# 🚂 Railway Quick Deploy Cheat Sheet

## 📍 You Are Here
You're on: https://railway.app/new
Screen shows: "Deploy Repository"

---

## ⚡ Quick Steps (5 Minutes)

### Step 1: In the search box, type:
```
project123
```

### Step 2: Click on:
```
DHANUSH555dh/project123
```

### Step 3: Click the blue "Deploy" button

### Step 4: Wait 2-3 minutes for build

Railway creates 3 services automatically:
- 🗄️ MongoDB
- 🔧 Backend  
- 🎨 Frontend

---

## ⚙️ Step 5: Set Environment Variables

### For Backend:
Click **backend** → **Variables** → Add these:

```
NODE_ENV=production
PORT=5001
MONGODB_URI=${{MongoDB.MONGO_URL}}
CORS_ORIGIN=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}
```

### For Frontend:
Click **frontend** → **Variables** → Add this:

```
VITE_API_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}
```

---

## 🌐 Step 6: Generate Domains

### Frontend:
1. Click **frontend** service
2. **Settings** tab
3. Scroll to **Networking**
4. Click **Generate Domain**

### Backend:
1. Click **backend** service
2. **Settings** tab
3. Scroll to **Networking**
4. Click **Generate Domain**

---

## 🔄 Step 7: Redeploy

After setting variables and domains:

1. Click each service (backend, frontend)
2. Go to **Deployments** tab
3. Click ••• (three dots)
4. Click **Redeploy**

---

## ✅ Step 8: Visit Your Site!

Your frontend URL: `https://[random-name].up.railway.app`

**Done! Your app is live! 🎉**

---

## 🔍 What Railway Reference Variables Mean

`${{MongoDB.MONGO_URL}}` = MongoDB connection string (auto-filled)
`${{frontend.RAILWAY_PUBLIC_DOMAIN}}` = Your frontend URL (auto-filled)
`${{backend.RAILWAY_PUBLIC_DOMAIN}}` = Your backend URL (auto-filled)

Railway replaces these with actual values automatically!

---

## 🐛 If Something Goes Wrong

**Check logs:**
Click service → **Logs** tab → Look for red errors

**Common fixes:**
- Missing env variables? → Add them in Variables tab
- Service won't start? → Check Logs for error message
- Frontend blank? → Check browser console (F12)
- API errors? → Verify CORS_ORIGIN matches frontend domain

---

## 💡 Pro Tips

✅ Railway auto-deploys when you push to GitHub
✅ Free tier gives $5/month credit (enough for small apps)
✅ You can see usage in Railway dashboard
✅ Logs are real-time - great for debugging
✅ You can scale services later if needed

---

**Current Task:** Type "project123" in the Railway search box and click Deploy!

Good luck! 🚀
