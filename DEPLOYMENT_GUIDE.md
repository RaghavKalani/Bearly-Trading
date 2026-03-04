# Deployment Guide - Render + Vercel

## Current Setup
- **Frontend**: Vercel (`https://bearly-trading.vercel.app`)
- **Backend**: Render
- **Database**: PostgreSQL (likely on Render)

## Step-by-Step Deployment

### 1. Backend Setup on Render

#### Environment Variables
Go to your Render dashboard → Your backend service → Environment and add:

```
DATABASE_URL=your_render_postgres_url
SECRET_KEY=supersecretjwtkey
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GOOGLE_CLIENT_ID=your_actual_google_client_id.apps.googleusercontent.com
```

#### Update Database Schema
Connect to your Render PostgreSQL database and run:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR UNIQUE;
ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL;
```

**To connect to Render PostgreSQL:**
1. Go to Render Dashboard → Your PostgreSQL database
2. Click "Connect" → Copy the External Database URL
3. Use a tool like pgAdmin, DBeaver, or psql:
   ```bash
   psql <your_database_url>
   ```

#### Deploy Backend
After updating the code:
1. Commit and push your changes to GitHub
2. Render will automatically redeploy
3. Or manually trigger deploy from Render dashboard

### 2. Frontend Setup on Vercel

#### Environment Variables
Go to Vercel dashboard → Your project → Settings → Environment Variables and add:

```
REACT_APP_GOOGLE_CLIENT_ID=your_actual_google_client_id.apps.googleusercontent.com
REACT_APP_API_URL=https://your-backend-name.onrender.com
```

**Important**: Replace `your-backend-name.onrender.com` with your actual Render backend URL.

#### Deploy Frontend
1. Commit and push changes to GitHub
2. Vercel will automatically redeploy
3. Or run: `vercel --prod` from the frontend directory

### 3. Google Cloud Console Configuration

Go to [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials)

#### Update OAuth 2.0 Client ID:

**Authorized JavaScript origins:**
```
https://bearly-trading.vercel.app
http://localhost:3000
```

**Authorized redirect URIs:**
```
https://bearly-trading.vercel.app
http://localhost:3000
```

**Remove** the Supabase URL if you added it (we're not using Supabase auth).

### 4. Verify Deployment

1. **Test Backend Health**:
   - Visit: `https://your-backend-name.onrender.com/`
   - Should see: `{"message": "A virtual stock market simulation platform"}`

2. **Test Frontend**:
   - Visit: `https://bearly-trading.vercel.app`
   - Should load the login page
   - Check browser console for any errors

3. **Test Google OAuth**:
   - Click "Sign in with Google"
   - Should redirect to Google login
   - After login, should redirect back to your app

### 5. Common Issues & Solutions

#### Issue: CORS errors
**Solution**: Make sure your Render backend URL is correctly added to `allow_origins` in `main.py`

#### Issue: 404 errors from API
**Solution**: Verify `REACT_APP_API_URL` in Vercel environment variables matches your Render backend URL exactly

#### Issue: Google OAuth fails
**Solution**: 
- Verify `GOOGLE_CLIENT_ID` is set in both Render and Vercel
- Check Google Console has correct authorized origins
- Make sure they match exactly (no trailing slashes)

#### Issue: Database connection fails on Render
**Solution**: 
- Check `DATABASE_URL` environment variable
- Render PostgreSQL URL format: `postgresql://user:password@host:port/database`
- Verify database is in the same region as your backend service

#### Issue: Environment variables not updating
**Solution**:
- After changing env vars in Vercel/Render, you must redeploy
- In Vercel: Redeploy from Deployments tab
- In Render: Manual Deploy → Deploy latest commit

### 6. Local Development

Keep your local `.env` files for development:

**Backend `.env`:**
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/bearlytrading
SECRET_KEY=supersecretjwtkey
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

**Frontend `.env`:**
```
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
REACT_APP_API_URL=http://localhost:8000
```

### 7. Deployment Checklist

Before going live, verify:

- [ ] Backend deployed on Render and accessible
- [ ] Frontend deployed on Vercel and accessible
- [ ] Database schema updated with `google_id` column
- [ ] Environment variables set on both platforms
- [ ] Google OAuth credentials configured with production URLs
- [ ] CORS configured to allow Vercel frontend
- [ ] Test login with email/password
- [ ] Test login with Google OAuth
- [ ] Test trading functionality
- [ ] Check browser console for errors

### 8. Security Notes for Production

- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Use strong database password
- [ ] Enable HTTPS only (both platforms do this by default)
- [ ] Never commit `.env` files to Git
- [ ] Consider enabling rate limiting
- [ ] Monitor error logs on both platforms

## Need Help?

- **Render Logs**: Dashboard → Your service → Logs
- **Vercel Logs**: Dashboard → Your project → Deployments → View logs
- **Browser Console**: F12 → Console tab
