# API Setup Guide

To enable fetching from platforms like Twitter (X), Facebook, and Instagram, you need to obtain official API keys and add them to your `.env` file.

## 1. YouTube Data API (Free)
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project.
3. Enable "YouTube Data API v3".
4. Create Credentials > API Key.
5. Add to `.env`:
   ```env
   YOUTUBE_API_KEY=your_key_here
   ```

## 2. Twitter / X API (Free Tier)
1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard).
2. Sign up for a "Free" account.
3. Create a Project & App.
4. Get the **Bearer Token**.
5. Add to `.env`:
   ```env
   TWITTER_BEARER_TOKEN=your_token_here
   ```
   *Note: The free tier is very limited (1500 tweets/month).*

## 3. Facebook & Instagram (Graph API)
1. Go to [Meta for Developers](https://developers.facebook.com/).
2. Create an App (Type: Business).
3. Add "Instagram Graph API" and "Facebook Graph API".
4. Use the Graph API Explorer to generate a long-lived Access Token.
5. Get your Facebook Page ID.
6. Add to `.env`:
   ```env
   FB_ACCESS_TOKEN=your_token_here
   FB_PAGE_ID=your_page_id_here
   IG_ACCESS_TOKEN=your_token_here
   ```

## Restarting the Bot
After updating `.env`, restart the bot:
```bash
npm run dev
```
