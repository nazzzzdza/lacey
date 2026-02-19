const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (!interaction.isButton()) return;

    const guild = interaction.guild;
    const member = interaction.member;

    // -------------------------------
    // CONFIG — replace these IDs
    // -------------------------------
    const staffRoles = ["1469795995649839365", "1469795995964539066"]; // multiple staff roles
    const logChannelId = "1469795996811792576"; // channel to log closed tickets
    const ticketCategoryId = "1474139622345805929"; // category where tickets will be created

    // ---------------------------
    // OPEN TICKET
    // ---------------------------
    if (interaction.customId === "open_ticket") {
      // ✅ acknowledge interaction immediately to prevent "interaction failed"
      await interaction.deferReply({ ephemeral: true });

      // Generate unique ticket name
      const timestamp = Date.now().toString().slice(-4);
      const ticketChannelName = `ticket-${member.user.username.toLowerCase()}-${timestamp}`;

      // Permission overwrites
      const permissionOverwrites = [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }, // everyone
        { id: member.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] } // ticket opener
      ];

      // Add all staff roles
      for (const roleId of staffRoles) {
        permissionOverwrites.push({
          id: roleId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
        });
      }

      // Create the ticket channel inside the category
      const ticketChannel = await guild.channels.create({
        name: ticketChannelName,
        type: ChannelType.GuildText,
        parent: ticketCategoryId,
        permissionOverwrites
      });

      // Embed with instructions
      const embed = new EmbedBuilder()
        .setTitle("Incoming order!")
        .setDescription("Please type `.order` to start your order.\nDo not overping staff or owners or your ticket will be closed. Feel free to bump once if it's taking more than expected.")
        .setColor(0x808080) // grey
        .setTimestamp();

      // Close button (grey)
      const closeButton = new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("close")
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(closeButton);

      await ticketChannel.send({ content: `<@${member.user.id}>`, embeds: [embed], components: [row] });

      // Delete the ephemeral deferred reply so user sees nothing
      await interaction.deleteReply();
    }

    // ---------------------------
    // CLOSE TICKET
    // ---------------------------
    if (interaction.customId === "close_ticket") {
      const ticketChannel = interaction.channel;
      const member = interaction.user;
      const logChannel = guild.channels.cache.get(logChannelId);

      // Fetch last 100 messages for transcript
      const messages = await ticketChannel.messages.fetch({ limit: 100 });
      const transcript = messages.map(m => `[${m.author.tag}]: ${m.content}`).reverse().join("\n");

      // Log embed
      const logEmbed = new EmbedBuilder()
        .setTitle("Ticket closed.")
        .addFields(
          { name: "Ticket Channel", value: ticketChannel.name },
          { name: "Closed By", value: member.tag },
          { name: "Transcript (last 100 messages)", value: transcript || "No messages" }
        )
        .setColor(0xFFC0CB)
        .setTimestamp();

      if (logChannel) await logChannel.send({ embeds: [logEmbed] });

      // Delete ticket channel
      await ticketChannel.delete();

      // Acknowledge the interaction silently
      await interaction.deferUpdate();
    }
  }
};

