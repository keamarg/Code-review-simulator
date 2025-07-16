#!/bin/bash

# Deployment script for Code Review Simulator
# This script handles deployment of both the main app and API key server

set -e  # Exit on any error

echo "🚀 Starting deployment process..."

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

print_status "Building main application..."
npm run build

if [ $? -eq 0 ]; then
    print_status "✅ Main application built successfully"
else
    print_error "❌ Main application build failed"
    exit 1
fi

print_status "Building API key server..."
cd backend/api-key-server
npm run build

if [ $? -eq 0 ]; then
    print_status "✅ API key server built successfully"
else
    print_error "❌ API key server build failed"
    exit 1
fi

cd ../..

print_status "Deployment preparation complete!"
print_warning "Remember to:"
print_warning "1. Set up environment variables in Vercel for both projects"
print_warning "2. Deploy the API key server to Vercel separately"
print_warning "3. Update the API_SERVER_BASE_URL in production to point to the deployed API key server"

echo ""
print_status "To deploy:"
echo "1. Main app: vercel --prod"
echo "2. API key server: cd backend/api-key-server && vercel --prod" 