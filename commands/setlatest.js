const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/latest_posts.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setlatest')
        .setDescription('Manually set the latest post for a platform')
        .addStringOption(option =>
            option.setName('platform')
                .setDescription('The platform to update')
                .setRequired(true)
                .addChoices(
                    { name: 'YouTube', value: 'youtube' },
                    { name: 'Instagram', value: 'instagram' },
                    { name: 'Facebook', value: 'facebook' },
                    { name: 'LinkedIn', value: 'linkedin' },
                    { name: 'Blogger', value: 'blogger' },
                    { name: 'Bluesky', value: 'bluesky' },
                    { name: 'X (Twitter)', value: 'x' },
                    { name: 'Threads', value: 'threads' },
                    { name: 'Tumblr', value: 'tumblr' }
                )
        )
        .addStringOption(option =>
            option.setName('link')
                .setDescription('The link to the latest post')
                .setRequired(true)
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        // SECURITY: Only allow server owner to use this command
        const owner = await interaction.guild.fetchOwner();
        if (interaction.user.id !== owner.id) {
            return interaction.reply({ content: '❌ Only the server owner can use this command.', ephemeral: true });
        }

        const platform = interaction.options.getString('platform');
        const link = interaction.options.getString('link');

        // Read existing data
        let currentData = {};
        try {
            if (fs.existsSync(dataPath)) {
                const fileContent = fs.readFileSync(dataPath, 'utf8');
                currentData = JSON.parse(fileContent);
            }
        } catch (error) {
            console.error('Error reading data file:', error);
            return interaction.reply({ content: '❌ Error reading database file.', ephemeral: true });
        }

        // Update data
        currentData[platform] = {
            link: link,
            date: new Date().toISOString(),
            manual: true
        };

        // Write back to file
        try {
            fs.writeFileSync(dataPath, JSON.stringify(currentData, null, 2));
            await interaction.reply({ content: `✅ Successfully updated latest post for **${platform}**!\nLink: ${link}`, ephemeral: false });
        } catch (error) {
            console.error('Error writing data file:', error);
            await interaction.reply({ content: '❌ Error saving to database.', ephemeral: true });
        }
    },
};
