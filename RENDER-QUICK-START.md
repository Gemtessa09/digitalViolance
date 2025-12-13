# 🚀 Render Deployment - Quick Start

## 5-Minute Deployment Guide

### 1️⃣ Push to GitHub (2 minutes)

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2️⃣ Create Render Service (1 minute)

1. Go to **https://render.com/**
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your repository

### 3️⃣ Configure (2 minutes)

**Build Settings:**

- Build Command: `npm install`
- Start Command: `npm start`
- Instance Type: **Free**

**Environment Variables** (click "Advanced"):

```env
MONGODB_URI=mongodb+srv://digital:10Q4all%4012@cluster0.8fetpic.mongodb.net/Hackaton?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-change-in-production
SESSION_SECRET=your-session-secret-key-change-in-production
NODE_ENV=production
PORT=3000
ADMIN_EMAIL=admin@safenetshield.org
ADMIN_PASSWORD=SafeNet2024!
```

### 4️⃣ Deploy!

Click **"Create Web Service"** → Wait 5-10 minutes

---

## ✅ Post-Deployment

### Update MongoDB Atlas:

1. Go to MongoDB Atlas → **Network Access**
2. Add IP: **0.0.0.0/0** (Allow all)

### Test Your App:

- Homepage: `https://your-app.onrender.com/`
- Login: `https://your-app.onrender.com/login.html`
  - Email: `admin@safenetshield.org`
  - Password: `SafeNet2024!`

---

## 🆘 Quick Fixes

### Can't Login?

```bash
# In Render Shell:
node server/unlockAccount.js admin@safenetshield.org
```

### Database Connection Failed?

- Check MongoDB Atlas Network Access (allow 0.0.0.0/0)
- Verify MONGODB_URI environment variable

### App Not Loading?

- Check Render logs for errors
- Verify all environment variables are set

---

## 📚 Full Guide

See **RENDER-DEPLOYMENT-GUIDE.md** for detailed instructions.

---

**Your app will be live at: `https://your-app-name.onrender.com`** 🎉
