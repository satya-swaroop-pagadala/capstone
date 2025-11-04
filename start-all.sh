#!/bin/bash

# Kill any existing processes on ports 5001 and 5173
echo "🧹 Cleaning up ports..."
lsof -ti:5001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
echo "✅ Ports cleared"

# Start backend in background
echo "🚀 Starting backend server..."
cd backend
npm start &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 3

# Test backend
echo "🧪 Testing backend API..."
curl -s "http://localhost:5001/api/movies/moods" > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend is running!"
else
    echo "❌ Backend failed to start"
    exit 1
fi

# Start frontend
echo "🚀 Starting frontend..."
cd ../project
npm run dev

# If frontend exits, kill backend
echo "🛑 Shutting down backend..."
kill $BACKEND_PID 2>/dev/null
