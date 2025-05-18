COMPOSE_FILE=docker-compose.dev.yml
PROJECT_NAME=js2-gateway
IMAGE_NAME=ghcr.io/geochemical-modeling/js2-gateway
STACK_NAME=$(PROJECT_NAME)-stack
STACK_FILE=stack.yml
TAG=latest

.PHONY: up down restart logs frontend

# Run the app in development env
up:
	@echo "Building the project..."
	@cd frontend && npm install && npm run build
	@echo "Starting up the project with docker compose..."
	docker compose -f $(COMPOSE_FILE) -p $(PROJECT_NAME) up --build -d

# Shut down the development env
down:
	docker compose -f $(COMPOSE_FILE) -p $(PROJECT_NAME) down

# Restart the development env
restart: down up

# Quickly show the real-time logs for the dev environment; 
logs:
	docker compose -f $(COMPOSE_FILE) -p $(PROJECT_NAME) logs -f

# For running execing into the dev container
shell:
	@docker exec -it $(shell docker ps -q -f "name=$(PROJECT_NAME)") /bin/sh

# Run the react app only; good for when you just need to develop the frontend.
frontend:
	@echo "Building the frontend..."
	@cd frontend && npm install && npm run dev

.PHONY: deploy build

build:
	@echo "Building the project..."
	@cd frontend && npm install && npm run build
	docker build -t $(IMAGE_NAME):$(TAG) .

# Expect a wait about 5 seconds for the replicas to be created after you run the command
deploy: build
	docker stack deploy -c $(STACK_FILE) $(STACK_NAME)
