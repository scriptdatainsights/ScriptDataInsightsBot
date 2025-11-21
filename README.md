# ScriptDataInsights Bot

A Discord bot for ScriptDataInsights to manage social links, posting schedules, and RSS feeds.

## Features
- `/links`: Displays all social media profile links.
- `/schedule`: Shows the weekly content posting schedule.
- `/latest`: Fetches the latest blog post via RSS.
- `/ping`: Checks bot latency.
- 24/7 Uptime support via Express keep-alive.

## Setup

### Prerequisites
- Node.js v16.9.0 or higher
- npm

### Installation
1. Clone the repository or download the files.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `.env` file (already created if using the provided setup):
   ```env
   TOKEN=your_discord_bot_token
   CLIENT_ID=your_client_id
   GUILD_ID=your_guild_id
   ```

### Running Locally
```bash
npm run dev
```

## Deployment

### Replit
1. Create a new Repl and import this repository.
2. Add your secrets (TOKEN, CLIENT_ID, GUILD_ID) in the Replit "Secrets" tab.
3. Click "Run".
4. Copy the Webview URL and use a service like UptimeRobot to ping it every 5 minutes to keep it awake.

### Railway
1. Create a new project on Railway from GitHub.
2. Add the environment variables in the "Variables" tab.
3. Railway will automatically detect the `start` script in `package.json` and deploy.

## Updating Commands
The bot automatically registers slash commands to the configured `GUILD_ID` on startup. If you want to register commands globally (for all servers), update `index.js` to use `Routes.applicationCommands(process.env.CLIENT_ID)` instead of `applicationGuildCommands`.
