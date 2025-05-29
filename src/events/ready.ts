import { Client, Events } from 'discord.js';
import { BotEvent } from '../handlers/EventHandler';
import { Logger } from '../utils/Logger';

const event: BotEvent = {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    if (!client.user) {
      Logger.error('Client user is null');
      return;
    }

    Logger.info(`Bot is ready! Logged in as ${client.user.tag}`);
    Logger.info(`Serving ${client.guilds.cache.size} guilds`);
    Logger.info(`Commands loaded: ${client.commands.size}`);

    // Set bot activity
    client.user.setActivity('Helping users!', { type: 0 }); // Type 0 = Playing

    // Log some statistics
    const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    Logger.info(`Total users: ${totalUsers}`);
  },
};

export default event;