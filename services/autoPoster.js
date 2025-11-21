const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const { fetchLatest } = require('../utils/contentFetcher');

const historyPath = path.join(__dirname, '../data/posted_history.json');
const CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes

// Load or initialize history
let history = {};
if (fs.existsSync(historyPath)) {
    try {
        history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    } catch (e) {
        console.error('Failed to load posted history:', e);
    }
}

const saveHistory = () => {
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
};

const startAutoPoster = (client) => {
    console.log('Starting Auto-Poster Service...');

    const checkAndPost = async () => {
        console.log('Auto-Poster: Checking for new content...');

        // Target specific channel ID provided by user
        const targetChannelId = '1440531529183793202';
        const channel = await client.channels.fetch(targetChannelId).catch(() => null);

        if (!channel) {
            console.log(`Auto-Poster: Target channel ${targetChannelId} not found.`);
            return;
        }

        const platforms = ['youtube', 'blogger', 'tumblr', 'bluesky', 'x', 'linkedin', 'threads', 'facebook', 'instagram'];

        for (const platform of platforms) {
            try {
                const latest = await fetchLatest(platform);

                if (latest && latest.link) {
                    // Check if this link was already posted
                    if (history[platform] !== latest.link) {
                        console.log(`Auto-Poster: New content found for ${platform}!`);

                        const embed = new EmbedBuilder()
                            .setColor(0x00FF00)
                            .setTitle(`🚨 New ${platform.charAt(0).toUpperCase() + platform.slice(1)} Post!`)
                            .setDescription(`**[${latest.title}](${latest.link})**`)
                            .setFooter({ text: 'Auto-posted by Script Data Insights Bot' });

                        if (latest.date && !isNaN(new Date(latest.date).getTime())) {
                            embed.setTimestamp(new Date(latest.date));
                        } else {
                            embed.setTimestamp();
                        }

                        await channel.send({ embeds: [embed] });

                        // Update history
                        history[platform] = latest.link;
                        saveHistory();
                    }
                }
            } catch (err) {
                console.error(`Auto-Poster error for ${platform}:`, err);
            }
        }
    };

    // Run immediately on start, then every interval
    checkAndPost();
    setInterval(checkAndPost, CHECK_INTERVAL);
};

module.exports = { startAutoPoster };
