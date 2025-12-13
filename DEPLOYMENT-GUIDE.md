# 🚀 MongoDB Atlas Deployment Guide

## ✅ Configuration Complete

Your project is now configured to use MongoDB Atlas!

## 📋 Setup Steps

### 1. Update Database Password

Open your `.env` file and replace `<db_password>` with your actual MongoDB Atlas password:

```env
MONGODB_URI=mongodb+srv://gemtessadeksisa_db_user:YOUR_ACTUAL_PASSWORD@cluster0.8fetpic.mongodb.net/Hackaton?retryWrites=true&w=majority&appName=Cluster0
```

**Important:** Replace `YOUR_ACTUAL_PASSWORD` with the password you set for the `gemtessadeksisa_db_user` database user in MongoDB Atlas.

### 2. Verify MongoDB Atlas Setup

1. **Login to MongoDB Atlas**: https://cloud.mongodb.com/
2. **Check Network Access**:
   - Go to "Network Access" in the left sidebar
   - Ensure your IP address is whitelisted (or use `0.0.0.0/0` for all IPs during development)
3. **Verify Database User**:
   - Go to "Database Access"
   - Confirm `gemtessadeksisa_db_user` exists with proper permissions

### 3. Test Local Connection

```bash
# Install dependencies (if not already done)
npm install

# Test the connection
npm run dev
```

You should see:

```
📊 MongoDB Connected: cluster0-shard-00-00.8fetpic.mongodb.net
👤 Admin user created successfully (if first run)
🚀 Server running on port 3000
```

### 4. Seed Admin User

The admin user will be created automatically on first connection. Default credentials:

- **Email**: `admin@safenetshield.org`
- **Password**: `SafeNet2024!`

You can change these in the `.env` file before first run.

## 🌐 Deployment Options

### Option 1: Deploy to Render

1. **Create account**: https://render.com/
2. **New Web Service** → Connect your GitHub repo
3. **Configure**:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Add Environment Variables** (copy from `.env`):
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `SESSION_SECRET`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `NODE_ENV=production`
   - `PORT=3000`

### Option 2: Deploy to Heroku

```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set MONGODB_URI="mongodb+srv://gemtessadeksisa_db_user:YOUR_PASSWORD@cluster0.8fetpic.mongodb.net/Hackaton?retryWrites=true&w=majority&appName=Cluster0"
heroku config:set JWT_SECRET="your-jwt-secret"
heroku config:set SESSION_SECRET="your-session-secret"
heroku config:set NODE_ENV="production"

# Deploy
git push heroku main
```

### Option 3: Deploy to Railway

1. **Create account**: https://railway.app/
2. **New Project** → Deploy from GitHub
3. **Add Variables** from your `.env` file
4. Railway will auto-detect Node.js and deploy

### Option 4: Deploy to Vercel (Serverless)

**Note**: Vercel is better for frontend. For full-stack Node.js apps, use Render or Railway.

## 🔒 Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Change `SESSION_SECRET` to a strong random string
- [ ] Change `ADMIN_PASSWORD` to a secure password
- [ ] Set `NODE_ENV=production`
- [ ] Configure MongoDB Atlas Network Access properly
- [ ] Enable MongoDB Atlas backup
- [ ] Set up monitoring and alerts

## 🧪 Testing the Deployment

After deployment, test these endpoints:

1. **Health Check**: `https://your-app.com/`
2. **Admin Login**: `https://your-app.com/login.html`
3. **API Test**: `https://your-app.com/api/auth/login` (POST)

## 📊 MongoDB Atlas Features

Your cluster includes:

- ✅ Automatic backups
- ✅ High availability (replica sets)
- ✅ Monitoring and alerts
- ✅ Performance insights
- ✅ 512MB free tier storage

## 🆘 Troubleshooting

### Connection Timeout

- Check Network Access whitelist in MongoDB Atlas
- Verify password is correct (no special characters that need encoding)

### Authentication Failed

- Confirm database user exists
- Check password doesn't contain special characters (or URL encode them)

### Database Not Found

- MongoDB Atlas creates databases automatically on first write
- The database name is specified in the connection string: `Hackaton`

## 📞 Support

If you encounter issues:

1. Check MongoDB Atlas logs
2. Check application logs
3. Verify all environment variables are set correctly

---

**Your MongoDB Atlas connection is ready! 🎉**
