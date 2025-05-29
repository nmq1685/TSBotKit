import { Events, Guild } from 'discord.js';
import { BotEvent } from '../handlers/EventHandler';
import { GuildService } from '../services/GuildService';
import { Logger } from '../utils/Logger';

const event: BotEvent = {
  name: Events.GuildDelete,
  async execute(guild: Guild) {
    try {
      const guildService = new GuildService();
      
      // Mark guild as inactive in database (don't delete to preserve data)
      await guildService.setGuildInactive(guild.id);
      
      Logger.info(`Bot removed from guild: ${guild.name} (${guild.id}) with ${guild.memberCount} members`);
      
    } catch (error) {
      Logger.error(`Error handling guild delete for ${guild.name}:`, error);
    }
  },
};

export default event;