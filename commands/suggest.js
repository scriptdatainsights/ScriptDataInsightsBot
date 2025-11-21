const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Send a suggestion to the server owner')
        .addStringOption(option =>
            option.setName('suggestion')
                .setDescription('Your suggestion or feedback')
                .setRequired(true)
        ),
    async execute(interaction) {
        const suggestion = interaction.options.getString('suggestion');
        const owner = await interaction.guild.fetchOwner();

        // Send DM to owner
        try {
            const dmEmbed = new EmbedBuilder()
                .setColor(0xFFA500)
                .setTitle('💡 New Suggestion!')
                .setDescription(suggestion)
                .addFields(
                    { name: 'From', value: `${interaction.user.tag} (${interaction.user.id})` },
                    { name: 'Server', value: interaction.guild.name }
                )
                .setTimestamp();

            await owner.send({ embeds: [dmEmbed] });

            await interaction.reply({
                content: '✅ Your suggestion has been sent to the server owner! Thank you for your feedback.',
                ephemeral: true
            });
        } catch (error) {
            console.error('Error sending suggestion:', error);
            await interaction.reply({
                content: '❌ Could not send suggestion. The owner might have DMs disabled.',
                ephemeral: true
            });
        }
    },
};
