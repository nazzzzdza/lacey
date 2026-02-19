const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("ticket button"),

  async execute(interaction) {
    const button = new ButtonBuilder()
      .setCustomId("open_ticket")
      .setLabel("order here")
      .setStyle(ButtonStyle.Secondary); // grey

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.channel.send({ content: "\u200B", components: [row] });

    // Acknowledge slash command silently
    await interaction.deferReply({ ephemeral: true });
    await interaction.deleteReply();
  },

  async handleInteraction(interaction) {
    if (!interaction.isButton()) return;

    const guild = interaction.guild;
    const member = interaction.member;

    const staffRoles = ["1469795995649839365", "1469795995964539066"];
    const logChannelId = "1469795996811792576";
    const ticketCategoryId = "1474139622345805929";

    // ---------------------------
    // OPEN TICKET
    // ---------------------------
    if (interaction.customId === "open_ticket") {
      await interaction.deferReply({ ephemeral: true });

      // Multiple tickets support
      const baseName = `ticket-${member.user.username.toLowerCase()}`;
      let ticketName = baseName;
      let counter = 1;
      while (guild.channels.cache.some(ch => ch.name === ticketName)) {
        ticketName = `${baseName}-${counter}`;
        counter++;
      }

      const permissionOverwrites = [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: member.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
      ];

      for (const roleId of staffRoles) {
        permissionOverwrites.push({
          id: roleId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
        });
      }

      const ticketChannel = await guild.channels.create({
        name: ticketName,
        type: ChannelType.GuildText,
        parent: ticketCategoryId,
        permissionOverwrites
      });

      await interaction.editReply({
        content: `find your ticket here love: ${ticketChannel}`,
        ephemeral: true
      });

      const embed = new EmbedBuilder()
        .setTitle("Incoming order!")
        .setDescription("Please type `.order` to start your order.\nDo not overping staff or owners or your ticket will be closed.")
        .setColor(0xFFC0CB);

      const closeButton = new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("close")
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(closeButton);

      await ticketChannel.send({ content: `<@${member.user.id}>`, embeds: [embed], components: [row] });
    }

    // ---------------------------
    // CLOSE TICKET
    // ---------------------------
    if (interaction.customId === "close_ticket") {
      const ticketChannel = interaction.channel;
      const closer = interaction.user;
      const logChannel = guild.channels.cache.get(logChannelId);

      const messages = await ticketChannel.messages.fetch({ limit: 100 });
      const transcript = messages.map(m => `[${m.author.tag}]: ${m.content}`).reverse().join("\n");
      const transcriptBuffer = Buffer.from(transcript || "No messages", "utf-8");

      const logEmbed = new EmbedBuilder()
        .setTitle("Ticket Closed")
        .addFields(
          { name: "Ticket Channel", value: ticketChannel.name },
          { name: "Closed By", value: `<@${closer.id}>` } // blue mention
        )
        .setColor(0xFFC0CB)
        .setTimestamp();

      if (logChannel) {
        await logChannel.send({
          embeds: [logEmbed],
          files: [{ attachment: transcriptBuffer, name: `${ticketChannel.name}-transcript.txt` }]
        });
      }

      await ticketChannel.delete();
      await interaction.deferUpdate();
    }
  }
};
