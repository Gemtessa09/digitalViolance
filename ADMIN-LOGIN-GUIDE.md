# Admin Login System - Setup Guide

## ✅ What's Been Added

1. **Admin Login Page** (`/login.html`)

   - Secure login form with email and password
   - Password visibility toggle
   - Remember me functionality
   - Demo credentials displayed

2. **Authentication Protection**

   - Dashboard now requires login
   - JWT token verification
   - Automatic redirect to login if not authenticated

3. **Admin User Seeding**
   - Script to create admin user in database

---

## 🚀 How to Use

### Step 1: Create Admin User

Run this command to create the admin user in your database:

```bash
npm run seed:admin
```

This will create:

- **Email**: `admin@safenetshield.org`
- **Password**: `SafeNet2024!`
- **Role**: `admin`

### Step 2: Start the Server

```bash
npm start
```

### Step 3: Login

1. Visit: **http://localhost:3000/login.html**
2. Enter credentials:
   - Email: `admin@safenetshield.org`
   - Password: `SafeNet2024!`
3. Click "Sign In"

### Step 4: Access Dashboard

After successful login, you'll be redirected to:

- **http://localhost:3000/dashboard**

Here you can:

- ✅ View all reported violence incidents
- ✅ See statistics (total reports, pending, resolved)
- ✅ Manage users
- ✅ View analytics
- ✅ Manage learning modules

---

## 🔒 Security Features

1. **JWT Authentication**

   - Secure token-based authentication
   - Token stored in localStorage
   - Automatic token verification on dashboard access

2. **Protected Routes**

   - Dashboard requires valid admin/moderator token
   - Automatic redirect to login if unauthorized

3. **Role-Based Access**

   - Only users with `admin` or `moderator` role can access dashboard
   - Regular users are redirected to login

4. **Account Security**
   - Password hashing with bcrypt
   - Login attempt tracking
   - Account locking after failed attempts

---

## 📋 API Endpoints Used

### Authentication

- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - Logout user

### Admin Dashboard

- `GET /api/admin/dashboard` - Get dashboard statistics
- `GET /api/admin/reports` - Get all reports
- `GET /api/admin/users` - Get all users
- `GET /api/admin/analytics` - Get analytics data

---

## 🔧 Troubleshooting

### Can't Login?

1. **Make sure MongoDB is running**

   ```bash
   mongod
   ```

2. **Create admin user**

   ```bash
   npm run seed:admin
   ```

3. **Check server is running**

   ```bash
   npm start
   ```

4. **Clear browser cache/localStorage**
   - Open DevTools (F12)
   - Go to Application > Local Storage
   - Clear all items
   - Try logging in again

### Token Expired?

- Just logout and login again
- Token is automatically refreshed on login

### Wrong Credentials?

- Default credentials:
  - Email: `admin@safenetshield.org`
  - Password: `SafeNet2024!`

---

## 🎯 What Happens After Login

1. **Token Storage**

   - JWT token saved to localStorage
   - Admin name and role saved

2. **Dashboard Access**

   - Redirected to `/dashboard`
   - Can view all reported incidents
   - Can manage users and content

3. **Session Management**
   - Token verified on every dashboard load
   - Automatic logout if token invalid
   - Remember me keeps you logged in

---

## 📱 Testing the Flow

1. **Visit Dashboard Without Login**

   - Go to: http://localhost:3000/dashboard
   - Should redirect to: http://localhost:3000/login.html

2. **Login with Credentials**

   - Enter email and password
   - Click "Sign In"
   - Should redirect to dashboard

3. **View Reports**

   - Dashboard shows all reported violence incidents
   - Can filter by status, severity, date
   - Can view details of each report

4. **Logout**
   - Click user menu in top right
   - Click "Logout"
   - Redirected to home page

---

## 🎉 You're All Set!

Your admin portal is now protected with authentication. Only authorized admins can view reported incidents and manage the platform.

**Login URL**: http://localhost:3000/login.html
**Dashboard URL**: http://localhost:3000/dashboard

---

## 📝 Notes

- The admin user is created in your MongoDB database
- You can create additional admin users through the database or by modifying the seed script
- All API requests from the dashboard include the JWT token in the Authorization header
- The token is verified on every protected route
