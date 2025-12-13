# ✅ Render Deployment Checklist

## Pre-Deployment

- [ ] Code is working locally (`npm run dev`)
- [ ] Admin login works locally
- [ ] MongoDB Atlas connection configured
- [ ] `.env` file is in `.gitignore` ✅ (already done)
- [ ] Code pushed to GitHub

## Render Setup

- [ ] Signed up for Render account
- [ ] Connected GitHub account
- [ ] Created new Web Service
- [ ] Connected repository

## Configuration

- [ ] Set Build Command: `npm install`
- [ ] Set Start Command: `npm start`
- [ ] Selected Free instance type
- [ ] Added all environment variables:
  - [ ] MONGODB_URI
  - [ ] JWT_SECRET
  - [ ] SESSION_SECRET
  - [ ] NODE_ENV
  - [ ] PORT
  - [ ] ADMIN_EMAIL
  - [ ] ADMIN_PASSWORD

## Deployment

- [ ] Clicked "Create Web Service"
- [ ] Watched build logs
- [ ] Build completed successfully
- [ ] Service status shows "Live"

## Post-Deployment

- [ ] Updated MongoDB Atlas Network Access (0.0.0.0/0)
- [ ] Tested homepage loads
- [ ] Tested login page
- [ ] Successfully logged in as admin
- [ ] Tested dashboard access
- [ ] Tested report submission
- [ ] Tested learning modules
- [ ] Tested support resources

## Security (Recommended)

- [ ] Generated new JWT_SECRET
- [ ] Generated new SESSION_SECRET
- [ ] Changed ADMIN_PASSWORD
- [ ] Updated environment variables in Render
- [ ] Restricted MongoDB Atlas Network Access (optional)

## Monitoring

- [ ] Checked Render logs
- [ ] Set up email notifications
- [ ] Bookmarked Render dashboard
- [ ] Documented app URL

## Optional

- [ ] Set up custom domain
- [ ] Upgraded to paid plan (no spin down)
- [ ] Set up monitoring alerts
- [ ] Configured backup strategy

---

## 🎯 Your App Info

**Render URL**: `https://__________.onrender.com`

**Admin Login**:

- Email: `admin@safenetshield.org`
- Password: `SafeNet2024!`

**MongoDB**: `cluster0.8fetpic.mongodb.net`

**GitHub Repo**: `https://github.com/________/________`

---

## 📞 Quick Links

- **Render Dashboard**: https://dashboard.render.com/
- **MongoDB Atlas**: https://cloud.mongodb.com/
- **GitHub Repo**: [Your repo URL]
- **Documentation**: See RENDER-DEPLOYMENT-GUIDE.md

---

**Deployment Date**: ****\_\_\_****

**Deployed By**: ****\_\_\_****

**Status**: ⬜ In Progress | ⬜ Completed | ⬜ Live
