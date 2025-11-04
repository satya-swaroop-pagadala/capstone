#!/bin/bash

# KOSG Platform - Development Startup Script
# This script helps you start the entire application

echo "🎬🎵 KOSG Entertainment Platform Startup"
echo "========================================"
echo ""

# Check if MongoDB is running
echo "📊 Checking MongoDB connection..."
if command -v mongosh &> /dev/null; then
    if mongosh --eval "db.runCommand({ ping: 1 })" --quiet &> /dev/null; then
        echo "✅ MongoDB is running"
    else
        echo "⚠️  MongoDB is not running. Starting MongoDB..."
        brew services start mongodb-community 2>/dev/null || echo "⚠️  Please start MongoDB manually or use MongoDB Atlas"
    fi
else
    echo "ℹ️  MongoDB CLI not found. Make sure MongoDB is running or use MongoDB Atlas"
fi

echo ""
echo "📦 Checking dependencies..."

# Check backend dependencies
if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Check frontend dependencies
if [ ! -d "project/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd project && npm install && cd ..
fi

echo "✅ Dependencies checked"
echo ""

# Check if database needs seeding
echo "🌱 Do you want to seed the database? (y/n)"
read -r seed_db
if [ "$seed_db" = "y" ] || [ "$seed_db" = "Y" ]; then
    echo "Seeding database..."
    cd backend && npm run seed && cd ..
fi

echo ""
echo "🚀 Starting servers..."
echo ""
echo "Backend will run on: http://localhost:5000"
echo "Frontend will run on: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup INT TERM

# Start backend in background
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend in background
cd project
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for both processes
wait
