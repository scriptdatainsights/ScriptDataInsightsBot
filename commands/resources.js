const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resources')
        .setDescription('Get a list of helpful learning resources'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('📚 Learning Resources')
            .setDescription('Here are some great resources to help you on your journey!')
            .addFields(
                { name: '💻 Scripting & Coding', value: '• [MDN Web Docs](https://developer.mozilla.org/)\n• [W3Schools](https://www.w3schools.com/)\n• [Stack Overflow](https://stackoverflow.com/)' },
                { name: '📊 Data Analysis', value: '• [Kaggle](https://www.kaggle.com/)\n• [Towards Data Science](https://towardsdatascience.com/)\n• [Python Data Science Handbook](https://jakevdp.github.io/PythonDataScienceHandbook/)' },
                { name: '🎨 Design & Tools', value: '• [Figma](https://www.figma.com/)\n• [Canva](https://www.canva.com/)\n• [Coolors](https://coolors.co/)' }
            )
            .setFooter({ text: 'Have a resource to add? Use /suggest!' });

        await interaction.reply({ embeds: [embed] });
    },
};
