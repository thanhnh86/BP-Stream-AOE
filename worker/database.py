import time
import mysql.connector
from mysql.connector import Error
from config import DB_CONFIG

def get_db_connection(with_db=True):
    config = DB_CONFIG.copy()
    if not with_db:
        config.pop('database', None)
        
    max_retries = 15
    retry_count = 0
    while retry_count < max_retries:
        try:
            return mysql.connector.connect(**config)
        except Error as e:
            print(f"[{retry_count+1}/{max_retries}] Connecting to MariaDB... (Waiting for DB to start)")
            retry_count += 1
            time.sleep(5)
    return None

def migrate_legacy_data(cursor, conn):
    # Check if matches table is empty and legacy scoreboard has data
    cursor.execute("SELECT COUNT(*) FROM matches")
    if cursor.fetchone()[0] == 0:
        cursor.execute("SHOW TABLES LIKE 'scoreboard'")
        if cursor.fetchone():
            cursor.execute("SELECT * FROM scoreboard")
            old_rows = cursor.fetchall()
            if old_rows:
                print(f"Migrating {len(old_rows)} records from legacy scoreboard...")
                for row in old_rows:
                    m_date, m_type, t_a, t_b, s_a, s_b = row[1], row[2], row[3], row[4], row[5], row[6]
                    
                    cursor.execute("INSERT INTO matches (match_date, match_type, score_a, score_b) VALUES (%s, %s, %s, %s)", 
                                   (m_date, m_type, s_a, s_b))
                    m_id = cursor.lastrowid
                    
                    def add_parts(names, team):
                        for name in [n.strip() for n in names.split(',') if n.strip()]:
                            cursor.execute("INSERT IGNORE INTO players (name) VALUES (%s)", (name,))
                            cursor.execute("SELECT id FROM players WHERE name = %s", (name,))
                            p_id = cursor.fetchone()[0]
                            cursor.execute("INSERT INTO match_participants (match_id, player_id, team) VALUES (%s, %s, %s)", (m_id, p_id, team))
                    
                    add_parts(t_a, 'A')
                    add_parts(t_b, 'B')
                conn.commit()
                print("Migration successful.")

def init_db():
    # 1. First ensure the database exists
    conn = get_db_connection(with_db=False)
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_CONFIG['database']}")
            conn.commit()
            cursor.close()
            conn.close()
        except Error as e:
            print(f"Error creating database: {e}")
            if conn: conn.close()

    # 2. Then ensure tables exist
    conn = get_db_connection(with_db=True)
    if conn:
        try:
            cursor = conn.cursor()
            # Players table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS players (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL UNIQUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            # Matches table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS matches (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    match_date DATE NOT NULL,
                    match_type VARCHAR(50) NOT NULL,
                    score_a INT DEFAULT 0,
                    score_b INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            # Match Participants
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS match_participants (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    match_id INT NOT NULL,
                    player_id INT NOT NULL,
                    team ENUM('A', 'B') NOT NULL,
                    INDEX(match_id),
                    INDEX(player_id),
                    FOREIGN KEY (match_id) REFERENCES matches(id) ON DELETE CASCADE,
                    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
                )
            """)
            # Legacy table (keep for migration and backward compatibility if needed)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS scoreboard (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    match_date DATE NOT NULL,
                    match_type VARCHAR(50) NOT NULL,
                    team_a_players TEXT NOT NULL,
                    team_b_players TEXT NOT NULL,
                    score_a INT DEFAULT 0,
                    score_b INT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()
            
            # Run migration if needed
            migrate_legacy_data(cursor, conn)
            
            cursor.close()
        except Error as e:
            print(f"Error initializing table: {e}")
        finally:
            conn.close()
