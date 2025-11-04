# MongoDB Atlas SSL Error Fix

## Problem
You're encountering this error:
```
Error: C0A0F7FD01000000:error:0A000438:SSL routines:ssl3_read_bytes:tlsv1 alert internal error
```

This is caused by **Node.js v22.20.0** using OpenSSL 3.x, which has stricter SSL/TLS requirements incompatible with your MongoDB Atlas cluster configuration.

## Solutions

### Option 1: Use Node.js LTS (Recommended for MongoDB Atlas)

**Downgrade to Node.js v20 LTS** which has better MongoDB compatibility:

```bash
# Using nvm (recommended)
nvm install 20
nvm use 20

# Or using Homebrew
brew install node@20
brew link --overwrite node@20
```

Then restart the backend:
```bash
cd backend
npm run dev
```

### Option 2: Use Local MongoDB for Development

Install MongoDB locally for faster development:

```bash
# Install MongoDB Community Edition
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Or run manually
mongod --config /usr/local/etc/mongod.conf
```

Update `backend/.env`:
```
MONGO_URI=mongodb://localhost:27017/kosg
```

### Option 3: Fix MongoDB Atlas Settings

1. **Update IP Whitelist** in MongoDB Atlas:
   - Go to https://cloud.mongodb.com
   - Navigate to Network Access
   - Add your current IP or use `0.0.0.0/0` (for testing only)

2. **Check Database User Permissions**:
   - Go to Database Access
   - Ensure user `dhanush` has read/write permissions

3. **Update Connection String** with new format:
   - Get a fresh connection string from MongoDB Atlas
   - Ensure it includes `&tls=true&tlsAllowInvalidCertificates=true` for testing

### Option 4: Create New MongoDB Atlas Cluster

Sometimes the issue is with older Atlas clusters:

1. Create a new M0 (free) cluster on MongoDB Atlas
2. Use MongoDB 6.0 or higher
3. Get the new connection string
4. Update `.env` file

## Current Workaround Applied

I've updated the code to:
- ✅ Not crash the server if MongoDB fails to connect
- ✅ Show detailed error messages
- ✅ Allow the API to run without database (for testing endpoints)

The server will now start even if MongoDB fails, allowing you to:
- Test the frontend UI
- Fix the MongoDB connection separately
- See detailed error logs

## Quick Test

Check if MongoDB is reachable:
```bash
# Test connection with mongosh
mongosh "mongodb+srv://dhanush:8670@cluster0.0tclkq2.mongodb.net/kosg"
```

## Recommended Next Steps

1. **Install Node.js v20 LTS** (most reliable)
2. Restart the backend server
3. Test signup/login functionality

OR

1. **Use local MongoDB** for development
2. Deploy to production with MongoDB Atlas later
