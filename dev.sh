#!/bin/bash

# Development environment startup script
# Usage: ./dev.sh [command]
# Commands: up, down, logs, rebuild, clean

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

COMPOSE_FILE="docker-compose.dev.yml"

# Detect if we should use docker-compose or docker compose
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

print_help() {
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  up       - Start all services"
    echo "  down     - Stop all services"
    echo "  logs     - Show logs (follow mode)"
    echo "  rebuild  - Rebuild and start all services"
    echo "  clean    - Remove all containers, volumes, and images"
    echo "  backend  - Access backend container shell"
    echo "  frontend - Access frontend container shell"
    echo "  db       - Access database shell"
    echo "  tools    - Start with additional tools (adminer)"
    echo ""
}

case "$1" in
    up)
        echo -e "${GREEN}Starting development environment...${NC}"
        $DOCKER_COMPOSE -f $COMPOSE_FILE up -d
        echo -e "${GREEN}Services started!${NC}"
        echo ""
        echo "Frontend: http://localhost:5173"
        echo "Backend:  http://localhost:3001"
        echo "Database: localhost:5432"
        ;;
    
    down)
        echo -e "${YELLOW}Stopping development environment...${NC}"
        $DOCKER_COMPOSE -f $COMPOSE_FILE down
        echo -e "${GREEN}Services stopped!${NC}"
        ;;
    
    logs)
        $DOCKER_COMPOSE -f $COMPOSE_FILE logs -f
        ;;
    
    rebuild)
        echo -e "${YELLOW}Rebuilding development environment...${NC}"
        $DOCKER_COMPOSE -f $COMPOSE_FILE down
        $DOCKER_COMPOSE -f $COMPOSE_FILE build --no-cache
        $DOCKER_COMPOSE -f $COMPOSE_FILE up -d
        echo -e "${GREEN}Services rebuilt and started!${NC}"
        ;;
    
    clean)
        echo -e "${RED}Cleaning development environment...${NC}"
        read -p "This will remove all containers, volumes, and images. Continue? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            $DOCKER_COMPOSE -f $COMPOSE_FILE down -v --rmi all
            echo -e "${GREEN}Environment cleaned!${NC}"
        else
            echo "Cancelled."
        fi
        ;;
    
    backend)
        echo -e "${GREEN}Accessing backend container...${NC}"
        docker exec -it bizass-backend-dev sh
        ;;
    
    frontend)
        echo -e "${GREEN}Accessing frontend container...${NC}"
        docker exec -it bizass-frontend-dev sh
        ;;
    
    db)
        echo -e "${GREEN}Accessing database...${NC}"
        docker exec -it bizass-postgres-dev psql -U postgres -d bizass_platform
        ;;
    
    tools)
        echo -e "${GREEN}Starting with additional tools...${NC}"
        $DOCKER_COMPOSE -f $COMPOSE_FILE --profile tools up -d
        echo -e "${GREEN}Services started with tools!${NC}"
        echo ""
        echo "Frontend: http://localhost:5173"
        echo "Backend:  http://localhost:3001"
        echo "Adminer:  http://localhost:8080"
        echo "Database: localhost:5432"
        ;;
    
    *)
        print_help
        ;;
esac