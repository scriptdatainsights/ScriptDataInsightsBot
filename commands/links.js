const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('links')
        .setDescription('Get all ScriptDataInsights social media links'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('ScriptDataInsights Social Links')
            .setDescription('Follow us on our social media platforms!')
            .addFields(
                { name: 'YouTube', value: config.profiles.youtube, inline: true },
                { name: 'Instagram', value: config.profiles.instagram, inline: true },
                { name: 'Facebook', value: config.profiles.facebook, inline: true },
                { name: 'LinkedIn', value: config.profiles.linkedin, inline: true },
                { name: 'Blogger', value: config.profiles.blogger, inline: true },
                { name: 'Bluesky', value: config.profiles.bluesky, inline: true },
                { name: 'X (Twitter)', value: config.profiles.x, inline: true },
                { name: 'Threads', value: config.profiles.threads, inline: true },
                { name: 'Tumblr', value: config.profiles.tumblr, inline: true }
            )
            .setTimestamp()
            .setFooter({ text: 'ScriptDataInsights Bot' });

        await interaction.reply({ embeds: [embed] });
    },
};
