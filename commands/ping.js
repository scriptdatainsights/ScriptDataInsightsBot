const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong and latency!'),
    async execute(interaction) {
        const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
        interaction.editReply(`Pong! 🏓\nLatency: ${sent.createdTimestamp - interaction.createdTimestamp}ms\nAPI Latency: ${Math.round(interaction.client.ws.ping)}ms`);
    },
};
