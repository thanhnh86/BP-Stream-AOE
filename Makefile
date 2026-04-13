.PHONY: install dev-infra dev-api dev-dash clean list

# Include local .env if exists
-include .env.dev

DATA_DIR ?= $(PWD)/mysql_data_dev

help:
	@echo "Lệnh hỗ trợ phát triển local:"
	@echo "  make install    - Cài đặt dependencies (Python & Node.js)"
	@echo "  make dev-infra  - Chạy MariaDB & SRS qua Docker Compose"
	@echo "  make dev-api    - Chạy Worker (Flask API backend)"
	@echo "  make dev-dash   - Chạy React Dashboard"
	@echo "  make clean      - Dừng Docker và dọn dẹp môi trường dev"

install:
	@echo "Installing Worker requirements..."
	cd worker && pip install -r requirements.txt
	@echo "\nInstalling Dashboard requirements..."
	cd web && npm install

dev-infra:
	@echo "Starting MySQL and SRS infrastructure..."
	mkdir -p $(DATA_DIR)
	docker compose -f docker-compose.dev.yml up -d
	@echo "Infrastructure is running."

dev-api:
	@echo "Starting Flask API service..."
	export DATA_DIR=$(PWD)/srs_data && \
	export DB_HOST=127.0.0.1 && \
	export DB_PORT=3307 && \
	export DB_USER=root && \
	export DB_PASSWORD=root && \
	export DB_NAME=aoe_scoreboard && \
	cd worker && python3 app.py

dev-dash:
	@echo "Starting React Dashboard..."
	cd web && npm run dev

clean:
	docker compose -f docker-compose.dev.yml down
	rm -rf worker/__pycache__
	rm -rf worker/services/__pycache__
	rm -rf worker/routes/__pycache__
