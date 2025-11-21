const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('schedule')
        .setDescription('Show the content posting schedule'),
    async execute(interaction) {
        const scheduleFields = config.schedule.map(item => ({
            name: item.time,
            value: `${item.topic} - ${item.type}`,
            inline: true
        }));

        const embed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('📅 Content Posting Schedule')
            .setDescription(`**${config.video_schedule}**`)
            .addFields(scheduleFields)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
