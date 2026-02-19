const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("ticket button"),

  async execute(interaction) {
    // Send the Open Ticket button normally in the channel
    const button = new ButtonBuilder()
      .setCustomId("open_ticket")
      .setLabel("order here")
      .setStyle(ButtonStyle.Secondary); // grey

    const row = new ActionRowBuilder().addComponents(button);

    await interaction.channel.send({ content: "\u200B", components: [row] });

    // Acknowledge slash command silently to prevent "interaction failed"
    await interaction.deferReply({ ephemeral: true });
    await interaction.deleteReply();
  },

  // Button interaction handler
  async handleInteraction(interaction) {
    if (!interaction.isButton()) return;

    const guild = interaction.guild;
    const member = interaction.member;

    // -------------------------------
    // CONFIG — replace these IDs
    // -------------------------------
    const staffRoles = ["1469795995649839365", "1469795995964539066"]; // staff role IDs
    const logChannelId = "1469795996811792576"; // log channel
    const ticketCategoryId = "1474139622345805929"; // category to create tickets in

    // ---------------------------
    // OPEN TICKET
    // ---------------------------
    if (interaction.customId === "open_ticket") {
      // Acknowledge immediately
      await interaction.deferReply({ ephemeral: true });

      // Base name for ticket
      const baseName = `ticket-${member.user.username.toLowerCase()}`;
      let ticketName = baseName;
      let counter = 1;

      // Allow multiple tickets by checking existing channels
      while (guild.channels.cache.some(ch => ch.name === ticketName)) {
        ticketName = `${baseName}-${counter}`;
        counter++;
      }

      // Permission overwrites
      const permissionOverwrites = [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: member.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
      ];

      // Add all staff roles
      for (const roleId of staffRoles) {
        permissionOverwrites.push({
          id: roleId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
        });
      }

      // Create ticket channel inside category
      const ticketChannel = await guild.channels.create({
        name: ticketName,
        type: ChannelType.GuildText,
        parent: ticketCategoryId,
        permissionOverwrites
      });

      // Send ephemeral reply to user mentioning their ticket
      await interaction.editReply({
        content: `Find your ticket here love: ${ticketChannel}`,
        ephemeral: true
      });

      // Embed for the ticket channel
      const embed = new EmbedBuilder()
        .setTitle("Incoming order!")
        .setDescription("Please type `.order` to start your order.\nDo not overping staff or owners or your ticket will be closed.")
        .setColor(0xFFC0CB);

      // Close button
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
      const member = interaction.user;
      const logChannel = guild.channels.cache.get(logChannelId);

      // Fetch last 100 messages
      const messages = await ticketChannel.messages.fetch({ limit: 100 });
      const transcript = messages.map(m => `[${m.author.tag}]: ${m.content}`).reverse().join("\n");

      // Log embed
      const logEmbed = new EmbedBuilder()
        .setTitle("Ticket Closed")
        .addFields(
          { name: "Ticket Channel", value: ticketChannel.name },
          { name: "Closed By", value: member.tag },
          { name: "Transcript", value: transcript || "No messages" }
        )
        .setColor(0xFFC0CB)
        .setTimestamp();

      if (logChannel) await logChannel.send({ embeds: [logEmbed] });

      // Delete ticket channel
      await ticketChannel.delete();

      // Acknowledge button click silently
      await interaction.deferUpdate();
    }
  }
};

