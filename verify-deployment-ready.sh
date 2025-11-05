#!/bin/bash

# Deployment Readiness Verification Script
# This script checks if your project is ready for deployment

# Don't exit on error for individual checks
# set -e  # Exit on error

echo "🚀 Deployment Readiness Verification"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# Get project root
PROJECT_ROOT="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_ROOT"

echo "Project root: $PROJECT_ROOT"
echo ""

# ============================================
# 1. CHECK BACKEND
# ============================================
echo "📦 Backend Checks"
echo "----------------"

# Check if backend directory exists
if [ -d "backend" ]; then
    pass "Backend directory exists"
else
    fail "Backend directory not found"
    exit 1
fi

cd backend

# Check Node.js version
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    pass "Node.js installed: $NODE_VERSION"
else
    fail "Node.js not installed"
    exit 1
fi

# Check package.json
if [ -f "package.json" ]; then
    pass "Backend package.json exists"
else
    fail "Backend package.json not found"
    exit 1
fi

# Check for required files
if [ -f "server.js" ]; then
    pass "server.js exists"
else
    fail "server.js not found"
    exit 1
fi

if [ -f "services/collaborativeFilteringService.js" ]; then
    pass "collaborativeFilteringService.js exists"
else
    fail "collaborativeFilteringService.js not found"
fi

if [ -f "controllers/recommendationController.js" ]; then
    pass "recommendationController.js exists"
else
    fail "recommendationController.js not found"
fi

# Check syntax
echo ""
echo "Checking JavaScript syntax..."
if node -c server.js 2>/dev/null; then
    pass "server.js syntax OK"
else
    fail "server.js has syntax errors"
fi

if [ -f "services/collaborativeFilteringService.js" ]; then
    if node -c services/collaborativeFilteringService.js 2>/dev/null; then
        pass "collaborativeFilteringService.js syntax OK"
    else
        fail "collaborativeFilteringService.js has syntax errors"
    fi
fi

# Check .env file
if [ -f ".env" ]; then
    pass ".env file exists"
    
    # Check required environment variables
    if grep -q "MONGODB_URI\|MONGO_URI" .env; then
        pass "MongoDB URI configured"
    else
        fail "MONGODB_URI or MONGO_URI missing in .env"
    fi
    
    if grep -q "JWT_SECRET" .env; then
        pass "JWT_SECRET configured"
    else
        fail "JWT_SECRET missing in .env"
    fi
else
    warn ".env file not found (needed for production)"
fi

# Check node_modules
if [ -d "node_modules" ]; then
    pass "Backend dependencies installed"
else
    warn "Backend dependencies not installed (run: npm install)"
fi

cd ..

echo ""

# ============================================
# 2. CHECK FRONTEND
# ============================================
echo "🎨 Frontend Checks"
echo "-----------------"

if [ -d "project" ]; then
    pass "Frontend directory exists"
    cd project
    
    if [ -f "package.json" ]; then
        pass "Frontend package.json exists"
    else
        fail "Frontend package.json not found"
    fi
    
    if [ -d "node_modules" ]; then
        pass "Frontend dependencies installed"
    else
        warn "Frontend dependencies not installed (run: npm install)"
    fi
    
    # Check if can build
    echo ""
    echo "Testing frontend build..."
    if npm run build > /dev/null 2>&1; then
        pass "Frontend builds successfully"
        
        if [ -d "dist" ]; then
            pass "dist/ directory created"
        else
            warn "dist/ directory not found after build"
        fi
    else
        fail "Frontend build failed"
    fi
    
    cd ..
else
    fail "Frontend directory 'project' not found"
fi

echo ""

# ============================================
# 3. CHECK DOCUMENTATION
# ============================================
echo "📚 Documentation Checks"
echo "----------------------"

docs=(
    "README_COLLABORATIVE_FILTERING.md"
    "COLLABORATIVE_FILTERING_GUIDE.md"
    "CF_QUICKSTART.md"
    "IMPLEMENTATION_COMPLETE.md"
    "PRE_DEPLOYMENT_CHECKLIST.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        pass "$doc exists"
    else
        warn "$doc not found"
    fi
done

echo ""

# ============================================
# 4. CHECK TEST SCRIPT
# ============================================
echo "🧪 Test Script Checks"
echo "--------------------"

if [ -f "test-collaborative-filtering.sh" ]; then
    pass "test-collaborative-filtering.sh exists"
    if [ -x "test-collaborative-filtering.sh" ]; then
        pass "Test script is executable"
    else
        warn "Test script not executable (run: chmod +x test-collaborative-filtering.sh)"
    fi
else
    warn "test-collaborative-filtering.sh not found"
fi

echo ""

# ============================================
# 5. CHECK GIT STATUS
# ============================================
echo "🔀 Git Checks"
echo "------------"

if [ -d ".git" ]; then
    pass "Git repository initialized"
    
    # Check for uncommitted changes
    if [ -z "$(git status --porcelain)" ]; then
        pass "No uncommitted changes"
    else
        warn "Uncommitted changes detected"
        echo "   Run: git status"
    fi
    
    # Check current branch
    BRANCH=$(git branch --show-current)
    if [ "$BRANCH" == "main" ] || [ "$BRANCH" == "master" ]; then
        pass "On main/master branch: $BRANCH"
    else
        warn "Current branch: $BRANCH (not main/master)"
    fi
else
    warn "Not a git repository"
fi

echo ""

# ============================================
# SUMMARY
# ============================================
echo "================================"
echo "📊 Summary"
echo "================================"
echo -e "${GREEN}Passed:${NC}   $PASSED"
echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
echo -e "${RED}Failed:${NC}   $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✅ All checks passed! Project is ready for deployment.${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Commit and push your code"
        echo "2. Deploy backend to Railway/Render/Heroku"
        echo "3. Deploy frontend to Vercel/Netlify"
        echo "4. Test in production"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Checks passed with $WARNINGS warnings.${NC}"
        echo "Review warnings above before deploying."
        exit 0
    fi
else
    echo -e "${RED}❌ $FAILED checks failed. Fix errors before deploying.${NC}"
    echo "Review failed checks above."
    exit 1
fi
