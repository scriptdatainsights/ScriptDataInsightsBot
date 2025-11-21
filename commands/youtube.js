const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('youtube')
        .setDescription('Search and sort YouTube videos/shorts')
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Filter by content type')
                .setRequired(true)
                .addChoices(
                    { name: 'All', value: 'all' },
                    { name: 'Videos', value: 'video' },
                    { name: 'Shorts', value: 'shorts' }
                )
        )
        .addStringOption(option =>
            option.setName('sort')
                .setDescription('Sort by metric')
                .setRequired(true)
                .addChoices(
                    { name: 'Newest', value: 'date' },
                    { name: 'Most Views', value: 'views' },
                    { name: 'Most Likes', value: 'likes' }
                )
        )
        .addIntegerOption(option =>
            option.setName('limit')
                .setDescription('Number of results to show (max 10)')
                .setMinValue(1)
                .setMaxValue(10)
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const type = interaction.options.getString('type');
        const sort = interaction.options.getString('sort');
        const limit = interaction.options.getInteger('limit') || 5;

        const dataPath = path.join(__dirname, '../data/youtube_data.json');

        if (!fs.existsSync(dataPath)) {
            return interaction.editReply('❌ YouTube data not found. Please ask the admin to run the data processor.');
        }

        let data = [];
        try {
            data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
        } catch (e) {
            return interaction.editReply('❌ Error reading data file.');
        }

        // Filter
        if (type !== 'all') {
            data = data.filter(item => item.type === type);
        }

        // Sort
        data.sort((a, b) => {
            if (sort === 'date') {
                return new Date(b.date) - new Date(a.date);
            } else if (sort === 'views') {
                return b.views - a.views;
            } else if (sort === 'likes') {
                return b.likes - a.likes;
            }
            return 0;
        });

        // Slice
        const results = data.slice(0, limit);

        if (results.length === 0) {
            return interaction.editReply('No videos found matching your criteria.');
        }

        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle(`📺 YouTube Results: ${type.toUpperCase()} sorted by ${sort.toUpperCase()}`)
            .setFooter({ text: `Showing top ${results.length} results` });

        let description = '';
        results.forEach((item, index) => {
            const dateStr = item.date ? new Date(item.date).toLocaleDateString() : 'Unknown Date';
            const icon = item.type === 'shorts' ? '📱' : '📹';
            description += `**${index + 1}. ${icon} [${item.title}](${item.url})**\n`;
            description += `👀 ${item.views.toLocaleString()} views • 👍 ${item.likes.toLocaleString()} likes • 📅 ${dateStr}\n\n`;
        });

        embed.setDescription(description);

        await interaction.editReply({ embeds: [embed] });
    },
};
