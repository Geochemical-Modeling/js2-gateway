COMPOSE_FILE=docker-compose.dev.yml
PROJECT_NAME=js2-gateway
STACK_NAME=$(PROJECT_NAME)-stack
STACK_FILE=stack.yml
TAG=latest

.PHONY: up down restart logs

up:
	@echo "Building the project..."
	@cd frontend && npm install && npm run build
	@echo "Starting up the project with docker compose..."
	docker compose -f $(COMPOSE_FILE) -p $(PROJECT_NAME) up --build -d

down:
	docker compose -f $(COMPOSE_FILE) -p $(PROJECT_NAME) down

restart: down up

logs:
	docker compose -f $(COMPOSE_FILE) -p $(PROJECT_NAME) logs -f

.PHONY: deploy build push

build:
	@echo "Building the project..."
	@cd frontend && npm install && npm run build
	docker build -t $(PROJECT_NAME):$(TAG) .

deploy: build
	docker stack deploy -c $(STACK_FILE) $(STACK_NAME)
