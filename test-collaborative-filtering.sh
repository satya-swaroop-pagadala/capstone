#!/bin/bash

# Test Collaborative Filtering Implementation
# This script tests the new CF endpoints

echo "🧪 Testing Collaborative Filtering Implementation"
echo "=================================================="
echo ""

# Check if backend is running
if ! curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo "❌ Backend is not running. Please start it first with:"
    echo "   cd backend && npm start"
    exit 1
fi

echo "✅ Backend is running"
echo ""

# You need to replace this with your actual JWT token
# Get it by logging in first
read -p "Enter your JWT token (or press Enter to skip): " JWT_TOKEN

if [ -z "$JWT_TOKEN" ]; then
    echo "⚠️  No token provided. You'll need to add it manually to test."
    echo ""
    echo "To get a token:"
    echo "1. Login via POST http://localhost:5000/api/auth/login"
    echo "2. Copy the token from the response"
    echo ""
    exit 1
fi

echo ""
echo "📊 Step 1: Auditing CF Data Readiness"
echo "--------------------------------------"
curl -s -X GET \
  "http://localhost:5000/api/recommendations/collaborative/audit" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo ""
echo "🎬 Step 2: Testing Collaborative Movie Recommendations"
echo "------------------------------------------------------"
curl -s -X GET \
  "http://localhost:5000/api/recommendations/collaborative/movies?k=30&limit=10" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo ""
echo "🎵 Step 3: Testing Collaborative Music Recommendations"
echo "------------------------------------------------------"
curl -s -X GET \
  "http://localhost:5000/api/recommendations/collaborative/music?k=30&limit=10" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo ""
echo "🔀 Step 4: Testing with Jaccard Similarity"
echo "------------------------------------------"
curl -s -X GET \
  "http://localhost:5000/api/recommendations/collaborative/movies?similarityMetric=jaccard&limit=5" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq '.data.recommendations[] | {title, recommendationScore, source}'

echo ""
echo ""
echo "✨ Step 5: Testing Hybrid Recommendations (Content + CF)"
echo "--------------------------------------------------------"
curl -s -X GET \
  "http://localhost:5000/api/recommendations/movies?limit=10" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" | jq '.data.recommendations[0:5] | .[] | {title, recommendationScore}'

echo ""
echo ""
echo "✅ Testing Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Check the audit results to see if you have enough data for CF"
echo "2. If insufficient data, add more user interactions"
echo "3. Compare CF vs Content-based vs Hybrid results"
echo "4. Adjust k (neighbors) and minOverlap parameters for better results"
