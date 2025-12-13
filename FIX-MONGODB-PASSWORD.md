# 🔧 Fix MongoDB Atlas Password Issue

## ❌ Current Error

```
❌ Database connection error: bad auth : authentication failed
```

This means the password in your `.env` file is incorrect or still has the placeholder `<db_password>`.

## ✅ Solution: Get Your MongoDB Atlas Password

### Step 1: Login to MongoDB Atlas

1. Go to: https://cloud.mongodb.com/
2. Login with your credentials

### Step 2: Access Database User Settings

1. Click **"Database Access"** in the left sidebar
2. Find user: `gemtessadeksisa_db_user`
3. Click the **"Edit"** button (pencil icon)

### Step 3: Get/Reset Password

You have two options:

**Option A: View Existing Password** (if available)

- Some MongoDB Atlas versions show the password
- Copy it if visible

**Option B: Reset Password** (recommended)

1. Click **"Edit Password"**
2. Choose **"Autogenerate Secure Password"** OR enter your own
3. **IMPORTANT**: Copy the password immediately!
4. Click **"Update User"**

### Step 4: Update Your .env File

Open `.env` and replace `<db_password>` with your actual password:

**Before:**

```env
MONGODB_URI=mongodb+srv://gemtessadeksisa_db_user:<db_password>@cluster0.8fetpic.mongodb.net/Hackaton?retryWrites=true&w=majority&appName=Cluster0
```

**After:**

```env
MONGODB_URI=mongodb+srv://gemtessadeksisa_db_user:YourActualPassword123@cluster0.8fetpic.mongodb.net/Hackaton?retryWrites=true&w=majority&appName=Cluster0
```

### Step 5: Handle Special Characters in Password

If your password contains special characters like `@`, `#`, `$`, `%`, etc., you need to URL encode them:

| Character | URL Encoded |
| --------- | ----------- |
| `@`       | `%40`       |
| `#`       | `%23`       |
| `$`       | `%24`       |
| `%`       | `%25`       |
| `^`       | `%5E`       |
| `&`       | `%26`       |
| `+`       | `%2B`       |
| `=`       | `%3D`       |

**Example:**

- Password: `MyPass@123#`
- Encoded: `MyPass%40123%23`

**Or use this Node.js command:**

```bash
node -e "console.log(encodeURIComponent('YourPassword'))"
```

### Step 6: Restart Your Server

```bash
npm run dev
```

You should now see:

```
📊 MongoDB Connected: cluster0-shard-00-00.8fetpic.mongodb.net
👤 Admin user created successfully
🚀 Server running on port 3000
```

## 🔄 Alternative: Use Local MongoDB (Temporary)

If you can't access MongoDB Atlas right now, I've already switched your `.env` to use local MongoDB:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/Hackaton
```

**Requirements:**

1. Install MongoDB locally: https://www.mongodb.com/try/download/community
2. Start MongoDB service:

   ```bash
   # Windows
   net start MongoDB

   # Mac
   brew services start mongodb-community

   # Linux
   sudo systemctl start mongod
   ```

3. Run your app:
   ```bash
   npm run dev
   ```

## 🧪 Test Your Connection

After updating the password, test it:

```bash
npm run test:db
```

This will verify your MongoDB Atlas connection works correctly.

## 🆘 Still Having Issues?

### Issue: "Network timeout"

**Solution**: Whitelist your IP in MongoDB Atlas

1. Go to: **Network Access**
2. Click **"Add IP Address"**
3. Choose **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Click **"Confirm"**

### Issue: "User not found"

**Solution**: Create the database user

1. Go to: **Database Access**
2. Click **"Add New Database User"**
3. Username: `gemtessadeksisa_db_user`
4. Password: Create a strong password
5. Database User Privileges: **"Read and write to any database"**
6. Click **"Add User"**

### Issue: "Cannot connect to local MongoDB"

**Solution**: Install MongoDB locally

- Windows: https://www.mongodb.com/try/download/community
- Mac: `brew install mongodb-community`
- Linux: `sudo apt-get install mongodb`

## 📝 Quick Reference

**MongoDB Atlas Dashboard**: https://cloud.mongodb.com/

**Your Cluster Details:**

- Cluster: `Cluster0`
- Database: `Hackaton`
- User: `gemtessadeksisa_db_user`
- Connection: `cluster0.8fetpic.mongodb.net`

**Need Help?**

- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- MongoDB Community: https://www.mongodb.com/community/forums/

---

**Once you update the password, your app will connect successfully! 🎉**
