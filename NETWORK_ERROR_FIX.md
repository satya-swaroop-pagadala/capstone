# Network Error Fix Guide

## Current Status
- ✅ Backend running on http://localhost:5001
- ✅ Frontend running on http://localhost:5173
- ✅ MongoDB Atlas connected
- ❌ Network error when signup

## Step-by-Step Fix

### 1. Open Browser Console
Open http://localhost:5173 in your browser, then press F12 or Right-click → Inspect → Console tab

### 2. Check What Error Shows
When you click "Create Account", look for errors in the console. It will show one of these:

**A) CORS Error:**
```
Access to XMLHttpRequest at 'http://localhost:5001/api/auth/signup' from origin 'http://localhost:5173' has been blocked by CORS policy
```
**Fix:** Already fixed in server.js with CORS configuration

**B) Network Error:**
```
ERR_NETWORK or Failed to fetch
```
**Fix:** Backend is not running or wrong URL

**C) 404 Not Found:**
```
POST http://localhost:5001/api/auth/signup 404
```
**Fix:** Check route configuration

### 3. Manual Test Commands

Run these in terminal to verify:

```bash
# Test if backend is running
curl http://localhost:5001/api/health

# Test signup endpoint
curl -X POST http://localhost:5001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"test123456"}'
```

### 4. Common Fixes

**If backend keeps stopping:**
```bash
# Kill all node processes
pkill -f node

# Restart backend in separate terminal
cd backend
npm run dev
```

**If frontend can't connect:**
1. Check browser console for actual error
2. Verify http://localhost:5001/api/health works in browser
3. Check if antivirus/firewall is blocking

### 5. Debug Mode

The code now has detailed logging. Check:
- Browser Console: See API request/response logs
- Backend Terminal: See incoming requests

Look for:
```
🔗 API URL: http://localhost:5001
📤 API Request: POST /api/auth/signup
POST /api/auth/signup - Body: { name, email, password }
```

## Quick Fix Script

Save this as `start-servers.sh`:

```bash
#!/bin/bash
# Kill existing processes
pkill -f "nodemon server.js"
lsof -ti:5001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null

# Start backend
cd backend
npm run dev &

# Wait 3 seconds
sleep 3

# Start frontend
cd ../project
npm run dev
```

Then run: `chmod +x start-servers.sh && ./start-servers.sh`
