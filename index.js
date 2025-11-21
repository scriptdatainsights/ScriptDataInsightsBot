require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, REST, Routes } = require('discord.js');
const keepAlive = require('./keepAlive');

// Initialize Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent // Required to read message content for link detection
    ],
});

client.commands = new Collection();

// Load Commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
const commands = [];

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Register Slash Commands
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        console.error(error);
    }
})();

// --- SMART LINK DETECTOR ---
const dataPath = path.join(__dirname, 'data/latest_posts.json');

client.on('messageCreate', async message => {
    // Ignore bot messages
    if (message.author.bot) return;

    // SECURITY: Only allow server owner to auto-update links
    if (!message.guild) return; // Ignore DMs
    const owner = await message.guild.fetchOwner();
    if (message.author.id !== owner.id) return;

    const content = message.content.trim();
    let platform = null;

    // Detect Platform based on URL
    if (content.includes('x.com') || content.includes('twitter.com')) platform = 'x';
    else if (content.includes('threads.net')) platform = 'threads';
    else if (content.includes('linkedin.com')) platform = 'linkedin';
    else if (content.includes('facebook.com') || content.includes('fb.watch')) platform = 'facebook';
    else if (content.includes('instagram.com')) platform = 'instagram';
    else if (content.includes('youtube.com') || content.includes('youtu.be')) platform = 'youtube';
    else if (content.includes('bsky.app')) platform = 'bluesky';
    else if (content.includes('tumblr.com')) platform = 'tumblr';
    else if (content.includes('blogspot.com')) platform = 'blogger';

    if (platform) {
        // It's a recognized link! Update the database.
        try {
            let currentData = {};
            if (fs.existsSync(dataPath)) {
                currentData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            }

            currentData[platform] = {
                link: content, // Save the whole message as the link (assuming user sends just the link)
                date: new Date().toISOString(),
                manual: true
            };

            fs.writeFileSync(dataPath, JSON.stringify(currentData, null, 2));

            await message.react('✅');
            await message.reply(`📝 **Auto-detected & Saved!**\nNew latest post set for **${platform.toUpperCase()}**.`);

        } catch (error) {
            console.error('Error auto-saving link:', error);
            await message.react('❌');
        }
    }
});

// --- WELCOME NEW MEMBERS ---
client.on('guildMemberAdd', async member => {
    try {
        // Find a channel to send welcome message (looks for 'general', 'welcome', or first text channel)
        const welcomeChannel = member.guild.channels.cache.find(
            channel =>
                channel.type === 0 && // Text channel
                (channel.name.includes('general') ||
                    channel.name.includes('welcome') ||
                    channel.name.includes('chat'))
        ) || member.guild.channels.cache.find(channel => channel.type === 0);

        if (welcomeChannel) {
            const welcomeEmbed = {
                color: 0x00FF00,
                title: '🎉 Welcome to Script Data Insights Hub!',
                description: `Hey ${member}! Welcome to our family! 🎊\n\nWe're excited to have you here. Feel free to explore and engage with the community!`,
                thumbnail: {
                    url: member.user.displayAvatarURL({ dynamic: true })
                },
                fields: [
                    {
                        name: '📢 Get Started',
                        value: 'Check out our latest content with `/latest platform:All`',
                        inline: false
                    },
                    {
                        name: '🔗 Social Links',
                        value: 'Use `/links` to see all our social media profiles',
                        inline: false
                    },
                    {
                        name: '📅 Posting Schedule',
                        value: 'Use `/schedule` to see when we post new content',
                        inline: false
                    }
                ],
                footer: {
                    text: `Member #${member.guild.memberCount}`,
                    icon_url: member.guild.iconURL()
                },
                timestamp: new Date()
            };

            await welcomeChannel.send({ embeds: [welcomeEmbed] });
        }
    } catch (error) {
        console.error('Error sending welcome message:', error);
    }
});

const { startAutoPoster } = require('./services/autoPoster');

// Event Handlers
client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    startAutoPoster(client);
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

// Start Keep-Alive Server
keepAlive();

// Login
client.login(process.env.TOKEN);
