# 🚀 Deploy to Render - Step-by-Step Guide

## ✅ Pre-Deployment Checklist

Your project is ready! Here's what's configured:

- ✅ MongoDB Atlas connected
- ✅ Express server configured
- ✅ Environment variables ready
- ✅ Package.json scripts correct
- ✅ Static files properly served
- ✅ Admin user created

---

## 📋 Step-by-Step Deployment

### Step 1: Push Your Code to GitHub

If you haven't already, push your code to GitHub:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Render deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Important:** Make sure `.env` is in your `.gitignore` (it already is!)

---

### Step 2: Sign Up for Render

1. Go to **https://render.com/**
2. Click **"Get Started"** or **"Sign Up"**
3. **Sign up with GitHub** (recommended for easy deployment)
4. Authorize Render to access your GitHub repositories

---

### Step 3: Create a New Web Service

1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. Click **"Connect a repository"**
4. Find and select your repository
5. Click **"Connect"**

---

### Step 4: Configure Your Web Service

Fill in the following settings:

#### Basic Settings:

- **Name**: `safenet-shield` (or your preferred name)
- **Region**: Choose closest to you (e.g., Oregon, Frankfurt, Singapore)
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave blank
- **Runtime**: `Node`

#### Build & Deploy Settings:

- **Build Command**:
  ```
  npm install
  ```
- **Start Command**:
  ```
  npm start
  ```

#### Instance Type:

- Select **"Free"** (or paid plan if you prefer)

---

### Step 5: Add Environment Variables

Click **"Advanced"** to expand advanced settings, then scroll to **"Environment Variables"**.

Click **"Add Environment Variable"** and add each of these:

#### Required Variables:

1. **MONGODB_URI**

   ```
   mongodb+srv://digital:10Q4all%4012@cluster0.8fetpic.mongodb.net/Hackaton?retryWrites=true&w=majority&appName=Cluster0
   ```

2. **JWT_SECRET**

   ```
   your-super-secret-jwt-key-change-in-production
   ```

   ⚠️ **Recommended:** Generate a new secret:

   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

3. **SESSION_SECRET**

   ```
   your-session-secret-key-change-in-production
   ```

   ⚠️ **Recommended:** Generate a new secret:

   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

4. **NODE_ENV**

   ```
   production
   ```

5. **PORT**

   ```
   3000
   ```

6. **ADMIN_EMAIL**

   ```
   admin@safenetshield.org
   ```

7. **ADMIN_PASSWORD**
   ```
   SafeNet2024!
   ```
   ⚠️ **Recommended:** Change to a stronger password for production

#### Optional Variables (if you set up email):

8. **EMAIL_HOST**

   ```
   smtp.gmail.com
   ```

9. **EMAIL_PORT**

   ```
   587
   ```

10. **EMAIL_USER**

    ```
    your-email@gmail.com
    ```

11. **EMAIL_PASS**
    ```
    your-app-password
    ```

---

### Step 6: Deploy!

1. Click **"Create Web Service"** at the bottom
2. Render will start building your application
3. Watch the build logs in real-time
4. Wait 5-10 minutes for the first deployment

---

## 🎉 Your App is Live!

Once deployment is complete, you'll see:

- ✅ **Status**: "Live"
- 🌐 **URL**: `https://safenet-shield.onrender.com` (or your chosen name)

### Test Your Deployment:

1. **Visit your app**: Click the URL at the top
2. **Test homepage**: Should load successfully
3. **Test login**: Go to `/login.html`
   - Email: `admin@safenetshield.org`
   - Password: `SafeNet2024!`
4. **Test dashboard**: After login, access `/dashboard.html`

---

## 🔧 Post-Deployment Configuration

### Update MongoDB Atlas Network Access

1. Go to **MongoDB Atlas** → **Network Access**
2. Click **"Add IP Address"**
3. Select **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

This allows Render's servers to connect to your database.

### Update CORS Settings (Optional)

If you want to restrict CORS to your Render domain:

1. Go to your Render dashboard
2. Copy your app URL (e.g., `https://safenet-shield.onrender.com`)
3. Update the `CORS` environment variable or modify `server/server.js`

---

## 📊 Monitoring Your App

### View Logs:

1. Go to your Render dashboard
2. Click on your service
3. Click **"Logs"** tab
4. See real-time logs

### Check Metrics:

1. Click **"Metrics"** tab
2. View CPU, Memory, and Request metrics

### Set Up Alerts:

1. Click **"Settings"**
2. Scroll to **"Notifications"**
3. Add email for deployment notifications

---

## 🔄 Updating Your App

Render automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin main
```

Render will automatically:

1. Detect the push
2. Build your app
3. Deploy the new version
4. Zero-downtime deployment

---

## 🆘 Troubleshooting

### Build Failed?

**Check build logs** for errors:

- Missing dependencies? Run `npm install` locally first
- Syntax errors? Fix and push again

### App Not Starting?

**Check logs** for errors:

- Database connection issues? Verify MongoDB Atlas Network Access
- Environment variables missing? Double-check all variables are set

### Can't Login?

**Account might be locked:**

1. Go to Render dashboard
2. Click **"Shell"** tab
3. Run:
   ```bash
   node server/unlockAccount.js admin@safenetshield.org
   ```

### Database Connection Failed?

1. **Check MongoDB Atlas**:

   - Network Access allows 0.0.0.0/0
   - Database user exists
   - Password is correct

2. **Check Environment Variable**:
   - `MONGODB_URI` is set correctly
   - No typos in the connection string

---

## 🔒 Security Best Practices

### Before Going Live:

1. **Generate New Secrets**:

   ```bash
   # JWT Secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

   # Session Secret
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Update Environment Variables** in Render:

   - Replace `JWT_SECRET`
   - Replace `SESSION_SECRET`
   - Change `ADMIN_PASSWORD`

3. **Restrict MongoDB Access**:

   - Get Render's IP addresses
   - Update MongoDB Atlas Network Access
   - Remove 0.0.0.0/0 if possible

4. **Enable HTTPS** (Render does this automatically!)

5. **Set Up Custom Domain** (Optional):
   - Go to Settings → Custom Domains
   - Add your domain
   - Update DNS records

---

## 💰 Render Free Tier Limits

- ✅ 750 hours/month (enough for 1 app running 24/7)
- ✅ Automatic HTTPS
- ✅ Automatic deploys from GitHub
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ Cold starts take 30-60 seconds

**Upgrade to paid plan** ($7/month) for:

- No spin down
- Faster performance
- More resources

---

## 🎯 Quick Reference

### Your App URLs:

- **Homepage**: `https://your-app.onrender.com/`
- **Login**: `https://your-app.onrender.com/login.html`
- **Dashboard**: `https://your-app.onrender.com/dashboard.html`
- **API**: `https://your-app.onrender.com/api/`

### Admin Credentials:

- **Email**: `admin@safenetshield.org`
- **Password**: `SafeNet2024!` (change in production!)

### Useful Commands:

```bash
# View logs
# (Use Render dashboard)

# Restart service
# (Use Render dashboard → Manual Deploy → Clear build cache & deploy)

# Update environment variables
# (Use Render dashboard → Environment)
```

---

## 📞 Support

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com/
- **MongoDB Atlas**: https://docs.atlas.mongodb.com/

---

## ✨ You're All Set!

Your SafeNet Shield application is now deployed and accessible worldwide! 🌍

**Next Steps:**

1. Test all features
2. Update security settings
3. Set up custom domain (optional)
4. Monitor logs and metrics
5. Share your app with users!

---

**Congratulations on your deployment! 🎊**
