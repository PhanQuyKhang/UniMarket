# 🚀 Deploy Backend to Render - Step by Step Guide

## ✅ Prerequisites (Already Done!)
- ✅ Backend code pushed to GitHub
- ✅ Supabase database configured
- ✅ Database connection string ready

---

## 📋 Step-by-Step Deployment

### **Step 1: Create Render Account**

1. Go to **https://render.com**
2. Click **"Get Started"** or **"Sign Up"**
3. **Sign up with GitHub** (recommended) - this makes connecting your repo easier
4. Authorize Render to access your GitHub account

---

### **Step 2: Create New Web Service**

1. After logging in, click **"New +"** button (top right)
2. Select **"Web Service"** from the dropdown

3. You'll see a list of your GitHub repositories
   - If you don't see your repos, click **"Configure account"** and grant access
   - Find and select **`PhanQuyKhang/UniMarket`** repository

4. Click **"Connect"** next to your repository

---

### **Step 3: Configure Web Service**

Fill in the following settings:

#### **Basic Information:**

| Field | Value |
|-------|-------|
| **Name** | `unimarket-backend` (or any name you prefer) |
| **Region** | Choose closest to your users (e.g., Singapore, Oregon) |
| **Branch** | `hiuu` (your current branch) or `main` |
| **Root Directory** | `backend` ⚠️ **IMPORTANT!** |
| **Runtime** | `Node` (should auto-detect) |

#### **Build & Deploy Settings:**

| Field | Value |
|-------|-------|
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

#### **Instance Type:**

- Select **"Free"** (perfect for testing)
  - Note: Free tier has some limitations:
    - Spins down after 15 mins of inactivity (takes ~30s to wake up)
    - 750 hrs/month free
    - Good for development/testing

- Or select **"Starter"** ($7/month) if you need:
  - Always-on service
  - Better performance
  - More resources

---

### **Step 4: Environment Variables** ⭐ **CRITICAL!**

Scroll down to **"Environment Variables"** section and click **"Add Environment Variable"**

Add these variables one by one:

#### Variable 1: DATABASE_URL
```
Key: DATABASE_URL
Value: postgresql://postgres:hcmut%40dath123@db.dkyrbffkwtruwnjrjzna.supabase.co:5432/postgres
```
⚠️ **Copy this EXACTLY** - including the `%40` (URL-encoded @)

#### Variable 2: PORT
```
Key: PORT
Value: 5000
```

#### Variable 3: NODE_ENV
```
Key: NODE_ENV
Value: production
```

#### Variable 4: APP_URL (Optional)
```
Key: APP_URL
Value: (You'll get this after deployment, can add later)
```

---

### **Step 5: Deploy!** 🚀

1. Scroll down and click **"Create Web Service"**
2. Render will now:
   - Clone your repository
   - Navigate to `backend` folder
   - Run `npm install`
   - Run `npm start`
   - Expose your service on a public URL

3. **Wait 2-5 minutes** for the deployment to complete
   - You'll see the build logs in real-time
   - Look for the green ✅ "Live" status

---

### **Step 6: Get Your Backend URL**

Once deployed, you'll see your backend URL at the top:

```
https://unimarket-backend.onrender.com
```

(Your actual subdomain might be different)

**SAVE THIS URL!** You'll need it for:
- Frontend configuration
- CORS settings
- Testing

---

## 🧪 Step 7: Test Your Deployed Backend

### Test 1: Basic Health Check
Open in browser:
```
https://your-backend-url.onrender.com
```

You should see: `Hello from the backend!`

### Test 2: API Endpoint
Open in browser:
```
https://your-backend-url.onrender.com/api/items
```

You should see: JSON array (items or empty `[]`)

### Test 3: Categories
```
https://your-backend-url.onrender.com/api/categories
```

---

## 🔧 Step 8: Update CORS Settings

Your backend needs to allow requests from your future frontend domain.

1. In Render dashboard, go to your service
2. Click **"Environment"** tab
3. You can add/update variables here later when you know your frontend URL

For now, let's update the code to allow your future GitHub Pages domain:

**You'll need to update `backend/index.js` later** - we'll do this when deploying the frontend.

---

## 📊 Monitor Your Deployment

### Check Logs:
1. In Render dashboard, click "Logs" tab
2. You should see:
   ```
   Backend server listening at http://localhost:5000
   ✅ Database connected successfully
   📊 Connected to: Supabase (Production)
   ```

### If you see errors:
- Check environment variables are correct
- Verify DATABASE_URL has no typos
- Check the logs for specific error messages

---

## 🎉 Success Checklist

- ✅ Service shows "Live" status
- ✅ Backend URL is accessible
- ✅ `/api/items` returns JSON data
- ✅ Logs show "Database connected successfully"
- ✅ No errors in Render logs

---

## 💡 Important Notes

### Free Tier Behavior:
- ⚠️ **Spins down after 15 minutes** of no requests
- First request after sleeping takes ~30-60 seconds (cold start)
- Solution: Upgrade to paid plan or use a keep-alive service

### Auto-Deploy:
- ✅ Render auto-deploys when you push to GitHub
- Push changes → Render automatically rebuilds and redeploys
- Check "Events" tab to see deployment history

### Environment Variables:
- Can be updated anytime in Render dashboard
- Changing them requires a manual redeploy (click "Manual Deploy")

---

## 🐛 Troubleshooting

### "Build failed"
- Check root directory is set to `backend`
- Verify build command is `npm install`
- Check package.json has all dependencies

### "Connection refused" or database errors
- Verify DATABASE_URL is correct
- Check Supabase project is active
- Ensure `%40` is used for @ in password

### CORS errors (from frontend)
- Need to update CORS settings in backend code
- We'll fix this when deploying frontend

### Service is slow
- Free tier spins down after inactivity
- First request wakes it up (~30s delay)
- Consider upgrading to paid tier for always-on

---

## 📱 URLs to Save

| What | URL | Notes |
|------|-----|-------|
| **Render Dashboard** | https://dashboard.render.com | Manage your services |
| **Your Backend** | `https://your-service.onrender.com` | Will be shown after deploy |
| **Backend API** | `https://your-service.onrender.com/api` | Base URL for API calls |
| **Logs** | Dashboard → Your Service → Logs | For debugging |

---

## ✅ Next Steps After Deployment

1. ✅ Note your backend URL
2. 🔄 Update frontend `api.ts` with production URL
3. 🔄 Update CORS in backend to allow frontend domain
4. 🚀 Deploy frontend to GitHub Pages
5. 🎉 Test the complete app!

---

## 🆘 Need Help?

- **Render Docs**: https://render.com/docs
- **View Logs**: Dashboard → Your Service → Logs tab
- **Restart Service**: Dashboard → Manual Deploy → Clear build cache & deploy

**Your backend is ready to deploy! Follow the steps above.** 🚀

When you're done, come back and we'll deploy the frontend!
