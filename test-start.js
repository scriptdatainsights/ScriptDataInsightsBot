require('dotenv').config();

console.log('Testing bot startup...');
console.log('TOKEN exists:', !!process.env.TOKEN);
console.log('CLIENT_ID exists:', !!process.env.CLIENT_ID);
console.log('GUILD_ID exists:', !!process.env.GUILD_ID);

if (!process.env.TOKEN) {
    console.error('ERROR: TOKEN is missing in .env file!');
    process.exit(1);
}

if (!process.env.CLIENT_ID) {
    console.error('ERROR: CLIENT_ID is missing in .env file!');
    process.exit(1);
}

if (!process.env.GUILD_ID) {
    console.error('ERROR: GUILD_ID is missing in .env file!');
    process.exit(1);
}

console.log('All required environment variables are present.');
console.log('Starting bot...');

// Now load the actual bot
require('./index.js');
