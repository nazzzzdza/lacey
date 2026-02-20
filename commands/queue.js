const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require("discord.js");

const QUEUE_CHANNEL_ID = "1474363784910077982";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("new queue")
    .addUserOption(option =>
      option.setName("buyer")
        .setDescription("mention buyer")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("items")
        .setDescription("items bought + amount ex. 1x dcr")
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("buyer");
    const items = interaction.options.getString("items");

    const queueChannel = interaction.guild.channels.cache.get(QUEUE_CHANNEL_ID);
    if (!queueChannel) {
      return interaction.reply({ content: "queue channel not found.", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle("tysm for ordering cutie 𝜗ৎ")
      .setColor(0xFFC0CB)
      .setDescription(
        `𖹭 <@${targetUser.id}>\n` +
        `𖹭 bought: ${items}\n` +
        `𖹭 status: Pending`
      );

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("queue_paid")
        .setLabel("paid")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("queue_processing")
        .setLabel("processing")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId("queue_done")
        .setLabel("done")
        .setStyle(ButtonStyle.Secondary)
    );

    await queueChannel.send({
      embeds: [embed],
      components: [row]
    });

    await interaction.reply({
      content: "new order added to queue!!",
      ephemeral: true
    });
  },

  async handleInteraction(interaction) {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("queue_")) return;

    const message = interaction.message;
    const embed = message.embeds[0];
    if (!embed) return;

    let newStatus = "Pending";

    if (interaction.customId === "queue_paid") newStatus = "**paid**";
    if (interaction.customId === "queue_processing") newStatus = "**processing**";
    if (interaction.customId === "queue_done") newStatus = "**done**";

    // Update embed text
    const updatedEmbed = EmbedBuilder.from(embed)
      .setDescription(
        embed.description.replace(/Status: .*/, `Status: ${newStatus}`)
      );

    // Disable all buttons
    const disabledRow = new ActionRowBuilder().addComponents(
      message.components[0].components.map(btn =>
        ButtonBuilder.from(btn).setDisabled(true)
      )
    );

    await interaction.update({
      embeds: [updatedEmbed],
      components: [disabledRow]
    });
  }
};
