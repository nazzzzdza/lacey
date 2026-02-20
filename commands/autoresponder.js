module.exports = {
  name: "autoresponder",

  async handleMessage(message) {
    if (message.author.bot) return;

    // 🔧 CHANGE THIS to your role ID
    const supportRoleId = "1469795995649839365";

    // Trigger word
    if (message.content.toLowerCase().startsWith(".ask")) {

      // Optional: prevent spam (5 sec cooldown per channel)
      if (!this.cooldowns) this.cooldowns = new Map();

      const now = Date.now();
      const cooldown = 5000;

      if (this.cooldowns.has(message.channel.id)) {
        const expiration = this.cooldowns.get(message.channel.id) + cooldown;
        if (now < expiration) return;
      }

      this.cooldowns.set(message.channel.id, now);

      await message.channel.send({
        content: `-# <@&${supportRoleId}> someone needs assistance <3`
      });
    }
  }
};
