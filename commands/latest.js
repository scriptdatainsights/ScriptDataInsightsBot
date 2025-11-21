const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const { fetchLatest } = require('../utils/contentFetcher');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('latest')
        .setDescription('Get the latest post from a specific platform')
        .addStringOption(option =>
            option.setName('platform')
                .setDescription('The platform to fetch from')
                .setRequired(true)
                .addChoices(
                    { name: 'ALL (Summary)', value: 'all' },
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
        ),
    async execute(interaction) {
        await interaction.deferReply();
        const platformChoice = interaction.options.getString('platform');

        if (platformChoice === 'all') {
            const platformsToFetch = ['youtube', 'blogger', 'tumblr', 'bluesky', 'x', 'threads', 'linkedin', 'facebook', 'instagram'];
            const results = [];

            for (const p of platformsToFetch) {
                const res = await fetchLatest(p);
                if (res) results.push(res);
            }

            if (results.length === 0) {
                return interaction.editReply('Could not fetch any latest posts from configured platforms.');
            }
            const result = await fetchLatest(platformChoice);

            if (result) {
                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle(`Latest from ${platformChoice}`)
                    .setDescription(`**[${result.title}](${result.link})**`);

                if (result.date && !isNaN(new Date(result.date).getTime())) {
                    embed.setTimestamp(new Date(result.date));
                } else {
                    embed.setTimestamp();
                }

                await interaction.editReply({ embeds: [embed] });
            } else {
                const url = config.profiles[platformChoice];
                if (!url) {
                    return interaction.editReply(`❌ No URL configured for **${platformChoice}** and no manual link set.`);
                }

                await interaction.editReply({
                    content: `⚠️ **Could not fetch latest post for ${platformChoice}.**\n\nReason: *Temporary connection issue or service unavailable.*\nThe server owner has been notified.`
                });

                try {
                    const owner = await interaction.guild.fetchOwner();
                    await owner.send(`🚨 **Bot Error Report**\nCommand: \`/latest platform:${platformChoice}\`\nReason: Platform requires API key or scrape failed (Check .env and logs).`);
                } catch (e) {
                    console.error(`Failed to send error notification to guild owner: ${e.message}`);
                }
            }
        }
    },
};
