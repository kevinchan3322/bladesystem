#!/bin/bash

# Function to display script usage
usage() {
    echo "Usage: $0 [-e environment] [-b build] [-r restart] [-h help]"
    echo "  -e : Environment (prod/dev), default is prod"
    echo "  -b : Build containers (yes/no), default is yes"
    echo "  -r : Restart existing containers (yes/no), default is no"
    echo "  -h : Display this help message"
    exit 1
}

# Default values
ENV="prod"
BUILD="yes"
RESTART="no"

# Parse command line arguments
while getopts "e:b:r:h" opt; do
    case $opt in
        e) ENV="$OPTARG" ;;
        b) BUILD="$OPTARG" ;;
        r) RESTART="$OPTARG" ;;
        h) usage ;;
        ?) usage ;;
    esac
done

# Validate environment
if [ "$ENV" != "prod" ] && [ "$ENV" != "dev" ]; then
    echo "Invalid environment. Use 'prod' or 'dev'"
    exit 1
fi

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Function to create necessary directories
create_directories() {
    mkdir -p ./logs
    mkdir -p ./uploads
    chmod 777 ./logs
    chmod 777 ./uploads
}

# Function to check environment file
check_env_file() {
    if [ ! -f .env ]; then
        echo "Error: .env file not found!"
        echo "Please create .env file with required variables."
        exit 1
    fi
}

# Main deployment logic
echo "Starting deployment in $ENV environment..."

# Check prerequisites
check_docker
check_env_file
create_directories

# Stop existing containers if restarting
if [ "$RESTART" = "yes" ]; then
    echo "Stopping existing containers..."
    docker-compose down
fi

# Build and start containers
if [ "$BUILD" = "yes" ]; then
    echo "Building containers..."
    if [ "$ENV" = "prod" ]; then
        docker-compose -f docker-compose.yml build
    else
        docker-compose -f docker-compose.yml -f docker-compose.dev.yml build
    fi
fi

echo "Starting containers..."
if [ "$ENV" = "prod" ]; then
    docker-compose -f docker-compose.yml up -d
else
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
fi

echo "Waiting for services to start..."
sleep 10

# Check if services are running
echo "Checking service status..."
docker-compose ps

echo "Deployment completed!" 