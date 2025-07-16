#!/bin/bash

# Development startup script for Code Review Simulator
# This script starts both the main app and API key server for local development

set -e  # Exit on any error

echo "🚀 Starting development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the root of the Code Review Simulator project"
    exit 1
fi

# Check if submodule is initialized
if [ ! -d "backend/api-key-server" ]; then
    print_error "API key server submodule not found. Please run: git submodule update --init"
    exit 1
fi

# Function to cleanup background processes on exit
cleanup() {
    print_status "Shutting down development servers..."
    kill $MAIN_PID $API_PID 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

print_status "Installing dependencies for main app..."
npm install

print_status "Installing dependencies for API key server..."
cd backend/api-key-server
npm install
cd ../..

print_status "Starting API key server on port 3001..."
cd backend/api-key-server
npm run dev &
API_PID=$!
cd ../..

# Wait a moment for API server to start
sleep 3

print_status "Starting main application on port 3000..."
npm start &
MAIN_PID=$!

print_status "✅ Development environment started!"
print_status "Main app: http://localhost:3000"
print_status "API key server: http://localhost:3001"
print_warning "Press Ctrl+C to stop both servers"

# Wait for both processes
wait $MAIN_PID $API_PID 