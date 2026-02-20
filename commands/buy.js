const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("buy")
    .setDescription("purchase"),

  async execute(interaction) {
    const modal = new ModalBuilder()
      .setCustomId("buy_modal")
      .setTitle("purchase form <3");

    const itemsInput = new TextInputBuilder()
      .setCustomId("items")
      .setLabel("Items")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const amountInput = new TextInputBuilder()
      .setCustomId("amount")
      .setLabel("Amount")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const mopInput = new TextInputBuilder()
      .setCustomId("mop")
      .setLabel("Mop")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const tipInput = new TextInputBuilder()
      .setCustomId("tip")
      .setLabel("Tip")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const extraInput = new TextInputBuilder()
      .setCustomId("extra")
      .setLabel("Extra")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(itemsInput),
      new ActionRowBuilder().addComponents(amountInput),
      new ActionRowBuilder().addComponents(mopInput),
      new ActionRowBuilder().addComponents(tipInput),
      new ActionRowBuilder().addComponents(extraInput)
    );

    await interaction.showModal(modal);
  },

  async handleInteraction(interaction) {
    if (!interaction.isModalSubmit()) return;
    if (interaction.customId !== "buy_modal") return;

    const items = interaction.fields.getTextInputValue("items");
    const amount = interaction.fields.getTextInputValue("amount");
    const mop = interaction.fields.getTextInputValue("mop");
    const tip = interaction.fields.getTextInputValue("tip") || "None";
    const extra = interaction.fields.getTextInputValue("extra") || "None";

    const embed = new EmbedBuilder()
      .setTitle("new order information ˚˖𓍢ִ໋❀")
      .setColor(0xFFC0CB)
      .setDescription(
        `𖹭 buyer: <@${interaction.user.id}>\n\n` +
        `𖹭 items:\n\`${items}\`\n\n` +
        `𖹭 amount:\n\`${amount}\`\n\n` +
        `𖹭 mop:\n\`${mop}\`\n\n` +
        `𖹭 tip:\n\`${tip}\`\n\n` +
        `𖹭 extra:\n\`${extra}\``
      )
      .setTimestamp();

    await interaction.channel.send({ embeds: [embed] });

    await interaction.reply({
      content: "your purchase form is sent love <3",
      ephemeral: true
    });
  }
};
