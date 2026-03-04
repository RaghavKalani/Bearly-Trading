# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for your Bear Trading application.

## Prerequisites

- A Google Cloud Console account
- Your Bear Trading project already created on Google Cloud Console

## Step 1: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Bear Trading project
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. If prompted, configure the OAuth consent screen:
   - Choose **External** user type
   - Fill in the required fields:
     - App name: Bear Trading
     - User support email: Your email
     - Developer contact: Your email
   - Click **Save and Continue**
   - Skip the Scopes page (click **Save and Continue**)
   - Add test users if needed
   - Click **Save and Continue**

6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: Bear Trading Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:3000`
   - **Authorized redirect URIs**:
     - `http://localhost:3000`
   - Click **Create**

7. Copy the **Client ID** (it will look like: `xxxxx.apps.googleusercontent.com`)

## Step 2: Configure Backend

1. Open `bearly_trading_backend/.env` file
2. Replace the placeholder with your actual Google Client ID:
   ```
   GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
   ```

## Step 3: Configure Frontend

1. Create a `.env` file in the `bearly_trading_frontend` directory
2. Add your Google Client ID:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
   ```

## Step 4: Update Database Schema

Since we added a new field (`google_id`) to the User model, you need to update your database:

### Option 1: Drop and recreate tables (WARNING: This will delete all data)
```bash
cd bearly_trading_backend
python create_tables.py
```

### Option 2: Manually update the database (Recommended for production)
Connect to your PostgreSQL database and run:
```sql
ALTER TABLE users ADD COLUMN google_id VARCHAR UNIQUE;
ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL;
```

## Step 5: Start Your Application

### Backend:
```bash
cd bearly_trading_backend
uvicorn app.main:app --reload
```

### Frontend:
```bash
cd bearly_trading_frontend
npm start
```

## Testing Google OAuth

1. Navigate to http://localhost:3000/login
2. You should see a "Sign in with Google" button
3. Click the button and sign in with your Google account
4. After successful authentication, you'll be redirected to the dashboard

## Troubleshooting

### Error: "redirect_uri_mismatch"
- Make sure `http://localhost:3000` is added to **Authorized JavaScript origins** in Google Cloud Console
- Ensure there are no trailing slashes

### Error: "Invalid Google token"
- Verify your `GOOGLE_CLIENT_ID` is correct in both `.env` files
- Make sure the Client ID matches exactly from Google Cloud Console

### Error: "popup_closed_by_user"
- This occurs when the user closes the Google sign-in popup
- This is normal user behavior, no action needed

### Database Errors
- Make sure you've updated the database schema to include the `google_id` column
- Verify `hashed_password` column allows NULL values

## Security Notes

- Never commit your `.env` files to version control
- Keep your Google Client ID and Secret secure
- For production, update the authorized origins/redirect URIs to your production domain
- Consider implementing additional security measures like rate limiting

## Production Deployment

When deploying to production:

1. Update Google Cloud Console credentials:
   - Add your production domain to **Authorized JavaScript origins**
   - Example: `https://yourdomain.com`

2. Update both `.env` files with production values

3. Ensure your backend accepts CORS requests from your production frontend domain

4. Consider moving to a more secure OAuth flow with backend token verification for enhanced security
