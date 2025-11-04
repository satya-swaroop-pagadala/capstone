#!/bin/bash

echo "🔧 KOSG MongoDB Setup Helper"
echo "=============================="
echo ""
echo "Choose your MongoDB setup:"
echo "1) Local MongoDB (recommended for development)"
echo "2) MongoDB Atlas (cloud database)"
echo ""
read -p "Enter your choice (1 or 2): " choice

case $choice in
  1)
    echo ""
    echo "📦 Setting up Local MongoDB..."
    echo ""
    echo "Checking if MongoDB is installed..."
    
    if command -v mongod &> /dev/null; then
        echo "✅ MongoDB is installed"
        
        # Copy local config
        cp backend/.env.local backend/.env
        echo "✅ Updated .env to use local MongoDB"
        
        echo ""
        echo "Starting MongoDB service..."
        brew services start mongodb-community 2>/dev/null || {
            echo "⚠️  Could not start MongoDB service"
            echo "Please start MongoDB manually: mongod --config /usr/local/etc/mongod.conf"
        }
        
        echo ""
        echo "✅ Setup complete!"
        echo "🚀 Start your backend with: cd backend && npm run dev"
        
    else
        echo "❌ MongoDB is not installed"
        echo ""
        echo "Install MongoDB with:"
        echo "  brew tap mongodb/brew"
        echo "  brew install mongodb-community"
        echo ""
        echo "Then run this script again."
    fi
    ;;
    
  2)
    echo ""
    echo "☁️  Setting up MongoDB Atlas..."
    echo ""
    echo "Current Node.js version: $(node --version)"
    echo ""
    
    if [[ $(node --version) == v22* ]]; then
        echo "⚠️  WARNING: Node.js v22 has SSL compatibility issues with MongoDB Atlas"
        echo ""
        echo "Recommended: Switch to Node.js v20 LTS"
        echo ""
        read -p "Do you want to see instructions? (y/n): " show_instructions
        
        if [ "$show_instructions" = "y" ]; then
            echo ""
            echo "Install Node.js v20 with nvm:"
            echo "  nvm install 20"
            echo "  nvm use 20"
            echo ""
            echo "Or with Homebrew:"
            echo "  brew install node@20"
            echo "  brew link --overwrite node@20"
            echo ""
        fi
    fi
    
    echo "Make sure to:"
    echo "1. Check Network Access in MongoDB Atlas (add your IP or 0.0.0.0/0)"
    echo "2. Verify Database User has read/write permissions"
    echo "3. Test connection with: mongosh 'your-connection-string'"
    echo ""
    echo "✅ .env is already configured for Atlas"
    echo "🚀 Start your backend with: cd backend && npm run dev"
    ;;
    
  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "📚 For more details, see MONGODB_FIX.md"
