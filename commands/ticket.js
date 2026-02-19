const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("ticket button"),

  async execute(interaction) {
    // Create the Open Ticket button (grey)
    const button = new ButtonBuilder()
      .setCustomId("open_ticket")
      .setLabel("order here")
      .setStyle(ButtonStyle.Secondary); // grey button

    const row = new ActionRowBuilder().addComponents(button);

    // Reply with just the button (ephemeral)
    await interaction.reply({
      content: "\u200B", // invisible character so the message isn't empty
      components: [row],
      ephemeral: false // only visible to the user who ran the command
    });
  }
};
