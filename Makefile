.PHONY: help start start-dev start-prod build-store github-actions

help:
	@echo "Usage: make <command>"
	@echo ""
	@echo "Available commands:"
	@echo "  start           Stop & rebuild containers (default docker-compose.yml)"
	@echo "  start-dev       Start using docker-compose.dev.yml"
	@echo "  start-prod      Start using docker-compose.prod.yml"
	@echo "  build-store     Build and run Medusa backend locally"
	@echo "  gh-vercel       Run GitHub Actions locally with act"
	@echo "  gh-store        Run GitHub Actions locally with act"

start:
	docker compose down -v
	docker compose up -d --build 
	
start-dev:
	docker compose -f docker-compose.dev.yml down -v
	docker compose -f docker-compose.dev.yml up -d --build 

start-prod:
	docker compose -f ./setup/docker/docker-compose.prod.yml down -v
	docker compose -f ./setup/docker/docker-compose.prod.yml up -d --build 

build-store:
	docker build -t floreria-medusa -f ./apps/store/Dockerfile .
	docker rm medusa-store || true
	docker container run --name medusa-store -it -d -p 9000:9000 floreria-medusa

gh-vercel:
	act -W '.github/workflows/github-deploy-prod.yml' --secret-file .secrets

gh-store:
	act -W '.github/workflows/build-medusa-image.yml' --secret-file .secrets
	