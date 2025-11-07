#!/bin/bash

# User-User Collaborative Filtering Test Script
# This script helps test the new collaborative filtering endpoint

echo "=========================================="
echo "User-User Collaborative Filtering Test"
echo "=========================================="
echo ""

# Configuration
BACKEND_URL=${BACKEND_URL:-"http://localhost:5000"}
API_ENDPOINT="$BACKEND_URL/api/recommendations/user"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing endpoint: $API_ENDPOINT${NC}"
echo ""

# Function to test with a user ID
test_user() {
    local user_id=$1
    echo -e "${GREEN}Testing User ID: $user_id${NC}"
    echo "----------------------------------------"
    
    response=$(curl -s "$API_ENDPOINT/$user_id")
    
    if [ $? -eq 0 ]; then
        echo "$response" | jq '.' 2>/dev/null || echo "$response"
        
        # Extract counts
        movie_count=$(echo "$response" | jq '.movies | length' 2>/dev/null)
        music_count=$(echo "$response" | jq '.music | length' 2>/dev/null)
        
        if [ -n "$movie_count" ] && [ -n "$music_count" ]; then
            echo ""
            echo -e "${GREEN}✓ Movies recommended: $movie_count${NC}"
            echo -e "${GREEN}✓ Music tracks recommended: $music_count${NC}"
        fi
    else
        echo -e "${RED}✗ Failed to connect to backend${NC}"
    fi
    
    echo ""
    echo ""
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Note: 'jq' is not installed. Install it for better JSON formatting.${NC}"
    echo -e "${YELLOW}Install with: brew install jq (macOS) or apt-get install jq (Ubuntu)${NC}"
    echo ""
fi

# Check if backend is running
echo "Checking if backend is running..."
health_check=$(curl -s "$BACKEND_URL/api/health" 2>/dev/null)

if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Backend is not running at $BACKEND_URL${NC}"
    echo ""
    echo "Start the backend with:"
    echo "  cd backend && npm start"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Backend is running${NC}"
echo ""

# Test with example user IDs
# You should replace these with actual user IDs from your database

echo "=========================================="
echo "Test Cases"
echo "=========================================="
echo ""

# Example 1: Test with first user ID
echo -e "${YELLOW}If you don't have user IDs, you can:${NC}"
echo "1. Check MongoDB with: mongosh your_database"
echo "2. Run: db.users.find().pretty()"
echo "3. Copy a user's _id"
echo ""

# Prompt for user ID
read -p "Enter a User ID to test (or press Enter to skip): " USER_ID

if [ -n "$USER_ID" ]; then
    test_user "$USER_ID"
else
    echo -e "${YELLOW}Skipping test. Please provide a user ID to test.${NC}"
fi

echo "=========================================="
echo "Quick MongoDB Commands"
echo "=========================================="
echo ""
echo "# List all users:"
echo "db.users.find({}, {_id: 1, name: 1, email: 1, likedMovies: 1, likedMusic: 1})"
echo ""
echo "# Add liked movies to a user:"
echo 'db.users.updateOne({_id: ObjectId("YOUR_USER_ID")}, {$push: {likedMovies: ObjectId("MOVIE_ID")}})'
echo ""
echo "# Add liked music to a user:"
echo 'db.users.updateOne({_id: ObjectId("YOUR_USER_ID")}, {$push: {likedMusic: ObjectId("MUSIC_ID")}})'
echo ""
echo "# Get movie IDs:"
echo "db.movies.find({}, {_id: 1, title: 1}).limit(5)"
echo ""
echo "# Get music IDs:"
echo "db.musics.find({}, {_id: 1, title: 1, artist: 1}).limit(5)"
echo ""

echo "=========================================="
echo "Test Complete"
echo "=========================================="
