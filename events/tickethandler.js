const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (!interaction.isButton()) return;

    const guild = interaction.guild;
    const member = interaction.member;

    // Replace with your staff role IDs
    const staffRoles = ["1469795995649839365", "1469795995964539066"];
    const logChannelId = "1469795996811792576"; // Replace with your log channel ID
    const ticketCategoryId = "1474139622345805929"; // Replace with your ticket category ID

    // ---------------------------
    // Open ticket
    // ---------------------------
    if (interaction.customId === "open_ticket") {
      // Generate a unique ticket channel name
      const timestamp = Date.now().toString().slice(-4); // last 4 digits for uniqueness
      const ticketChannelName = `ticket-${member.user.username.toLowerCase()}-${timestamp}`;

      // Permission overwrites
      const permissionOverwrites = [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] }, // everyone else
        { id: member.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] } // ticket opener
      ];

      // Add all staff roles
      for (const roleId of staffRoles) {
        permissionOverwrites.push({
          id: roleId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
        });
      }

      // Create ticket channel inside the category
      const ticketChannel = await guild.channels.create({
        name: ticketChannelName,
        type: ChannelType.GuildText,
        parent: ticketCategoryId, // <-- This puts the ticket inside the category
        permissionOverwrites
      });

      // Embed with instructions
      const embed = new EmbedBuilder()
        .setTitle("Incoming order!")
        .setDescription("Please type `.order` to start your order.\nDo not overping staff or owners or your ticket will be closed. Feel free to bump once if it's taking more than expected.")
        .setColor(0x808080) // grey color
        .setTimestamp();

      // Close button (grey)
      const closeButton = new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("close")
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(closeButton);

      await ticketChannel.send({ content: `<@${member.user.id}>`, embeds: [embed], components: [row] });
      await interaction.reply({ content: `Find your ticket here love: ${ticketChannel}`, ephemeral: true });
    }

    // ---------------------------
    // Close ticket
    // ---------------------------
    if (interaction.customId === "close_ticket") {
      const ticketChannel = interaction.channel;
      const member = interaction.user;
      const logChannel = guild.channels.cache.get(logChannelId);

      // Fetch messages for transcript
      const messages = await ticketChannel.messages.fetch({ limit: 100 });
      let transcript = messages.map(m => `[${m.author.tag}]: ${m.content}`).reverse().join("\n");

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
      await ticketChannel.delete();
    }
  }
};
