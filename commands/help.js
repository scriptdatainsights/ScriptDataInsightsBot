const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows a guide to all bot commands and features'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('🤖 Script Data Insights Bot Guide')
            .setDescription('Here is everything I can do for you!')
            .addFields(
                { name: '📢 Content Updates', value: '`/latest [platform]` - Get the latest post from a specific platform.\n`/latest platform:All` - See a summary of updates from all platforms.' },
                { name: '🔗 Socials & Schedule', value: '`/links` - View all our social media profiles.\n`/schedule` - Check when we post new content.' },
                { name: '💡 Utilities', value: '`/resources` - curated list of learning resources.\n`/suggest` - Send a suggestion to the team.' },
                { name: '⚙️ Admin Features', value: '`/setlatest` - Manually update the latest link for a platform (Owner only).\n**Auto-Poster**: I automatically post new updates to the #updates channel every 30 minutes.' }
            )
            .setFooter({ text: 'Stay curious, keep learning!' });

        await interaction.reply({ embeds: [embed] });
    },
};
