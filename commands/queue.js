const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require("discord.js");

const QUEUE_CHANNEL_ID = "PUT_QUEUE_CHANNEL_ID_HERE";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("new queue order")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("buyer")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("items")
        .setDescription("items bought ex. 1x dcr")
        .setRequired(true)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("buyer");
    const items = interaction.options.getString("items");

    const queueChannel = interaction.guild.channels.cache.get(QUEUE_CHANNEL_ID);
    if (!queueChannel) {
      return interaction.reply({ content: "queue channel not found!", ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle("New Order")
      .setColor(0xFFC0CB)
      .addFields(
        { name: "♡ ", value: `<@${targetUser.id}>` },
        { name: "♡ bought", value: items },
        { name: "♡ status", value: "pending" }
      )
      .setTimestamp();

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
      content: "new order added to queue love",
      ephemeral: true
    });
  },

  async handleInteraction(interaction) {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("queue_")) return;

    const message = interaction.message;
    const oldEmbed = message.embeds[0];
    if (!oldEmbed) return;

    let newStatus = "pending";

    if (interaction.customId === "queue_paid") newStatus = "paid";
    if (interaction.customId === "queue_processing") newStatus = "processing";
    if (interaction.customId === "queue_done") newStatus = "done";

    // Rebuild embed properly
    const updatedEmbed = EmbedBuilder.from(oldEmbed);

    const fields = updatedEmbed.data.fields.map(field => {
      if (field.name === "status") {
        return { name: "status", value: newStatus };
      }
      return field;
    });

    updatedEmbed.setFields(fields);

    // Rebuild buttons (only clicked one disabled)
    const newRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("queue_paid")
        .setLabel("paid")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(interaction.customId === "queue_paid"),

      new ButtonBuilder()
        .setCustomId("queue_processing")
        .setLabel("processing")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(interaction.customId === "queue_processing"),

      new ButtonBuilder()
        .setCustomId("queue_done")
        .setLabel("done")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(interaction.customId === "queue_done")
    );

    await interaction.update({
      embeds: [updatedEmbed],
      components: [newRow]
    });
  }
};
