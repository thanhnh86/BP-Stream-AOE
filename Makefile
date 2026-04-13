.PHONY: install dev-infra dev-api dev-dash clean help

# Configuration
PYTHON_VENV = .venv
PYTHON = $(PYTHON_VENV)/bin/python3
PIP = $(PYTHON_VENV)/bin/pip
# Default Configuration
DATA_DIR ?= $(PWD)/srs_data
DB_HOST ?= 127.0.0.1
DB_PORT ?= 3306
DB_USER ?= root
DB_PASSWORD ?= root
DB_NAME ?= aoe_scoreboard

# Include local .env files (values here will override defaults)
-include .env
-include .env.dev

help:
	@echo "Lệnh hỗ trợ phát triển local:"
	@echo "  make install    - Cài đặt dependencies (Python & Node.js)"
	@echo "  make dev-infra  - Chạy MariaDB & SRS qua Docker Compose"
	@echo "  make dev-api    - Chạy Worker (Flask API backend)"
	@echo "  make dev-dash   - Chạy React Dashboard"
	@echo "  make clean      - Dừng Docker và dọn dẹp môi trường dev"

$(PYTHON_VENV):
	@echo "Creating virtual environment..."
	python3 -m venv $(PYTHON_VENV)
	$(PIP) install --upgrade pip

install: $(PYTHON_VENV)
	@echo "Installing Worker requirements..."
	$(PIP) install -r worker/requirements.txt
	@echo "\nInstalling Dashboard requirements..."
	cd web && npm install

dev-infra:
	@echo "Starting MySQL and SRS infrastructure..."
	mkdir -p $(DATA_DIR)
	docker compose -f docker-compose.dev.yml up -d
	@echo "Infrastructure is running."

dev-api: $(PYTHON_VENV)
	@echo "Starting Flask API service..."
	export DATA_DIR=$(DATA_DIR) && \
	export DB_HOST=$(DB_HOST) && \
	export DB_PORT=$(DB_PORT) && \
	export DB_USER=$(DB_USER) && \
	export DB_PASSWORD=$(DB_PASSWORD) && \
	export DB_NAME=$(DB_NAME) && \
	cd worker && ../$(PYTHON) app.py

dev-dash:
	@echo "Starting React Dashboard..."
	cd web && npm run dev

clean:
	@echo "Cleaning up..."
	docker compose -f docker-compose.dev.yml down
	find . -type d -name "__pycache__" -exec rm -rf {} +
	rm -rf worker/*.pyc

clean-venv:
	@echo "Removing virtual environment..."
	rm -rf $(PYTHON_VENV)

distclean: clean clean-venv
