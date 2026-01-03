# 🚀 UniMarket Deployment Guide

Complete guide to deploy your application with:
- **Frontend**: GitHub Pages
- **Backend**: Render
- **Database**: Supabase (PostgreSQL)

---

## 📋 Prerequisites

- GitHub account
- Render account (https://render.com)
- Supabase account (https://supabase.com)
- Your code pushed to GitHub

---

## 🗄️ STEP 1: Setup Supabase Database

### 1.1 Create Supabase Project
1. Go to https://supabase.com and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name**: UniMarket (or your preferred name)
   - **Database Password**: Choose a strong password (SAVE THIS!)
   - **Region**: Choose closest to your users
4. Click **"Create new project"** and wait ~2 minutes

### 1.2 Get Database Connection String
1. In your Supabase project dashboard, click **"Settings"** (gear icon)
2. Click **"Database"** in the left sidebar
3. Scroll to **"Connection string"** section
4. Select **"URI"** tab
5. Copy the connection string (looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`)
6. **IMPORTANT**: Replace `[YOUR-PASSWORD]` with the password you created in step 1.1

### 1.3 Create Database Tables
1. In Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New query"**
3. Copy and paste this SQL:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    picture TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create items table
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    condition VARCHAR(50),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    images JSONB DEFAULT '[]'::jsonb
);

-- Create exchange_requests table
CREATE TABLE IF NOT EXISTS exchange_requests (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_requester_id ON exchange_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_owner_id ON exchange_requests(owner_id);
CREATE INDEX IF NOT EXISTS idx_exchange_requests_item_id ON exchange_requests(item_id);
```

4. Click **"Run"** button
5. You should see a success message

---

## 🖥️ STEP 2: Deploy Backend to Render

### 2.1 Prepare Backend for Deployment

First, update your backend package.json to specify Node version:

1. Open `backend/package.json`
2. Add this after line 11 (after "license"):

```json
  "engines": {
    "node": "18.x"
  },
```

### 2.2 Create Render Account & Deploy

1. Go to https://render.com and sign in with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository (UniMarket)
4. Configure the service:

   **Basic Settings:**
   - **Name**: `unimarket-backend` (or your preferred name)
   - **Region**: Choose closest to your users
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

   **Instance Type:**
   - Select **"Free"** (or paid if you prefer)

5. Click **"Advanced"** to add environment variables

### 2.3 Add Environment Variables on Render

Click **"Add Environment Variable"** for each:

| Key | Value | Example |
|-----|-------|---------|
| `DATABASE_URL` | Your Supabase connection string | `postgresql://postgres:yourpass@db.xxx.supabase.co:5432/postgres` |
| `PORT` | `5000` | `5000` |
| `NODE_ENV` | `production` | `production` |

6. Click **"Create Web Service"**
7. Wait for deployment (2-5 minutes)
8. Once deployed, copy your backend URL (e.g., `https://unimarket-backend.onrender.com`)

### 2.4 Test Backend

Open in browser: `https://your-backend-url.onrender.com/api/items`

You should see `[]` or your items data.

---

## 🌐 STEP 3: Deploy Frontend to GitHub Pages

### 3.1 Update Frontend Configuration

1. Update API URL in `src/services/api.ts`:

Replace line 4:
```typescript
const API_URL = 'http://localhost:5000/api';
```

With:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'https://your-backend-url.onrender.com/api';
```

2. Update `vite.config.ts` - add base path:

Add this line after line 6 (after `plugins: [react()],`):
```typescript
  base: '/UniMarket/',
```

**Note**: Replace `UniMarket` with your actual repository name.

3. Create `.env.production` file in root:

```env
VITE_API_URL=https://your-backend-url.onrender.com/api
```

Replace with your actual Render backend URL.

### 3.2 Install gh-pages Package

Run in your project root:
```bash
npm install --save-dev gh-pages
```

### 3.3 Update package.json Scripts

Add these scripts to your `package.json` (in the "scripts" section):

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```

### 3.4 Enable GitHub Pages

1. Go to your GitHub repository
2. Click **"Settings"** tab
3. Click **"Pages"** in left sidebar
4. Under **"Source"**, select **"Deploy from a branch"**
5. Under **"Branch"**, select **"gh-pages"** and **"/ (root)"**
6. Click **"Save"**

### 3.5 Deploy to GitHub Pages

Run in terminal:
```bash
npm run deploy
```

This will:
1. Build your frontend
2. Create a `gh-pages` branch
3. Push your build to GitHub Pages

Wait 2-3 minutes, then visit:
```
https://your-username.github.io/UniMarket/
```

---

## 🔧 STEP 4: Update Backend CORS Settings

Your backend needs to allow requests from your GitHub Pages domain.

1. Open `backend/index.js`
2. Find the CORS configuration (around line 10-20)
3. Update it to:

```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-username.github.io'
  ],
  credentials: true
}));
```

Replace `your-username` with your actual GitHub username.

4. Commit and push changes:

```bash
git add .
git commit -m "Update CORS for production"
git push
```

Render will automatically redeploy your backend.

---

## ✅ STEP 5: Verify Deployment

### 5.1 Test Backend
- Visit: `https://your-backend-url.onrender.com/api/items`
- Should return JSON data

### 5.2 Test Frontend
- Visit: `https://your-username.github.io/UniMarket/`
- Check browser console for errors
- Test creating an item, logging in, etc.

### 5.3 Test Database
- Check Supabase dashboard → Table Editor
- Verify data is being saved

---

## 🐛 Troubleshooting

### Frontend shows blank page
- Check browser console for errors
- Verify `base` path in `vite.config.ts` matches repo name
- Check if API_URL is correct

### CORS errors
- Verify backend CORS settings include your GitHub Pages URL
- Make sure Render backend has redeployed

### Backend not connecting to database
- Check DATABASE_URL environment variable on Render
- Verify Supabase connection string is correct
- Check Render logs for errors

### 500 errors on API calls
- Check Render logs: Dashboard → Logs
- Verify all environment variables are set
- Check database tables exist

### Images not loading
- Images are stored as base64 in database
- Check browser console for size warnings
- Verify Supabase has enough storage

---

## 🔄 Future Updates

### Update Frontend:
```bash
git add .
git commit -m "Your update message"
git push
npm run deploy
```

### Update Backend:
```bash
cd backend
git add .
git commit -m "Your update message"
git push
```
Render auto-deploys when you push to GitHub!

---

## 📝 Important URLs to Save

| Service | URL | Notes |
|---------|-----|-------|
| **Frontend** | `https://your-username.github.io/UniMarket/` | Your live app |
| **Backend** | `https://your-backend-url.onrender.com` | API server |
| **Supabase** | `https://supabase.com/dashboard/project/your-project-id` | Database |
| **Render** | `https://dashboard.render.com/` | Backend hosting |
| **GitHub Repo** | `https://github.com/your-username/UniMarket` | Source code |

---

## 💡 Optional Enhancements

### Add Custom Domain (Optional)
1. Buy a domain (e.g., from Namecheap, Google Domains)
2. Add to GitHub Pages settings
3. Update Render backend URL
4. Update CORS settings

### Enable HTTPS (Already enabled!)
- GitHub Pages: Auto HTTPS ✅
- Render: Auto HTTPS ✅
- Supabase: Auto HTTPS ✅

### Add Environment Variables Locally
Create `.env.local` for development:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🎉 You're Done!

Your UniMarket app is now live! 🚀

- 📱 Share your app URL with users
- 📊 Monitor usage in Render and Supabase dashboards
- 🐛 Check logs if issues arise
- 🔄 Keep updating and improving!

**Need help?** Check:
- Render docs: https://render.com/docs
- Supabase docs: https://supabase.com/docs
- Vite docs: https://vitejs.dev/guide/static-deploy.html
