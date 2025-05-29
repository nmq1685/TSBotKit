import { Events, Guild } from 'discord.js';
import { BotEvent } from '../handlers/EventHandler';
import { GuildService } from '../services/GuildService';
import { Logger } from '../utils/Logger';

const event: BotEvent = {
  name: Events.GuildCreate,
  async execute(guild: Guild) {
    try {
      const guildService = new GuildService();
      
      // Create or update guild in database
      await guildService.findOrCreateGuild(guild.id, guild.name);
      
      Logger.info(`Bot added to new guild: ${guild.name} (${guild.id}) with ${guild.memberCount} members`);
      
      // Try to send a welcome message to the system channel or first available text channel
      const welcomeChannel = guild.systemChannel || 
        guild.channels.cache.find(channel => 
          channel.isTextBased() && 
          channel.permissionsFor(guild.members.me!)?.has(['SendMessages', 'ViewChannel'])
        );
      
      if (welcomeChannel && welcomeChannel.isTextBased()) {
        const welcomeMessage = [
          `👋 Hello **${guild.name}**!`,
          '',
          '🤖 Thank you for adding **FouQ-Bot** to your server!',
          '',
          '🚀 **Getting Started:**',
          '• Use `/ping` to test if the bot is working',
          '• Use `/info` to see bot information and statistics',
          '• Use `/help` to see all available commands',
          '',
          '⚙️ **Configuration:**',
          '• Server administrators can configure bot settings',
          '• Commands can be enabled/disabled per server',
          '',
          '📚 **Need Help?**',
          '• Check out our documentation or contact support',
          '',
          '🎉 **Enjoy using FouQ-Bot!**'
        ].join('\n');
        
        try {
          await welcomeChannel.send(welcomeMessage);
          Logger.info(`Sent welcome message to ${guild.name}`);
        } catch (error) {
          Logger.warn(`Failed to send welcome message to ${guild.name}:`, error);
        }
      } else {
        Logger.warn(`No suitable channel found to send welcome message in ${guild.name}`);
      }
      
    } catch (error) {
      Logger.error(`Error handling guild create for ${guild.name}:`, error);
    }
  },
};

export default event;