# 🚀 Quick Start Guide - MongoDB Atlas Deployment

## Step 1: Update Your Password

Open `.env` file and replace `<db_password>` with your actual MongoDB Atlas password:

```env
MONGODB_URI=mongodb+srv://gemtessadeksisa_db_user:YOUR_ACTUAL_PASSWORD@cluster0.8fetpic.mongodb.net/Hackaton?retryWrites=true&w=majority&appName=Cluster0
```

**Where to find your password:**

1. Go to MongoDB Atlas: https://cloud.mongodb.com/
2. Click "Database Access" in left sidebar
3. Find user: `gemtessadeksisa_db_user`
4. If you forgot the password, click "Edit" → "Edit Password" to reset it

## Step 2: Test the Connection

```bash
npm run test:db
```

You should see:

```
✅ Successfully connected to MongoDB Atlas!
📊 Host: cluster0-shard-00-00.8fetpic.mongodb.net
🗄️  Database: Hackaton
🎉 All tests passed!
```

## Step 3: Run Your Application Locally

```bash
npm run dev
```

Expected output:

```
📊 MongoDB Connected: cluster0-shard-00-00.8fetpic.mongodb.net
👤 Admin user created successfully
🚀 Server running on port 3000
```

## Step 4: Access Your Application

Open your browser:

- **Homepage**: http://localhost:3000/
- **Login**: http://localhost:3000/login.html
- **Dashboard**: http://localhost:3000/dashboard.html

**Admin Credentials:**

- Email: `admin@safenetshield.org`
- Password: `SafeNet2024!`

## Step 5: Deploy to Production

Choose your platform:

### Option A: Render (Recommended)

1. Go to https://render.com/
2. Sign up / Login
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: safenet-shield
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add Environment Variables (copy from `.env`):
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `SESSION_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `NODE_ENV=production`
7. Click "Create Web Service"
8. Wait for deployment (5-10 minutes)

### Option B: Railway

1. Go to https://railway.app/
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables from `.env`
6. Deploy automatically starts

### Option C: Heroku

```bash
heroku login
heroku create safenet-shield
heroku config:set MONGODB_URI="your-connection-string"
heroku config:set JWT_SECRET="your-secret"
heroku config:set NODE_ENV="production"
git push heroku main
```

## Troubleshooting

### ❌ "Authentication failed"

- Check password in `.env` is correct
- Verify database user exists in MongoDB Atlas
- Go to "Database Access" and confirm user permissions

### ❌ "Connection timeout"

- Go to MongoDB Atlas → "Network Access"
- Click "Add IP Address"
- Choose "Allow Access from Anywhere" (0.0.0.0/0)
- Click "Confirm"

### ❌ "Cannot find module"

```bash
npm install
```

### ❌ Port already in use

```bash
# Change PORT in .env file
PORT=3001
```

## Need Help?

Check these files:

- `DEPLOYMENT-GUIDE.md` - Detailed deployment instructions
- `DEPLOYMENT-CHECKLIST.md` - Complete checklist
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/

---

**You're all set! 🎉**

Your application is now connected to MongoDB Atlas and ready to deploy!
