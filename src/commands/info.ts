import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction } from 'discord.js';
import { BotCommand } from '../types/Command';
import { DatabaseService } from '../database/DatabaseService';
import os from 'os';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Shows information about the bot'),
  
  category: 'utility',
  cooldown: 5,
  
  async execute(interaction: ChatInputCommandInteraction) {
    const client = interaction.client;
    const databaseService = DatabaseService.getInstance();
    
    // Calculate uptime
    const uptime = process.uptime();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor(uptime / 3600) % 24;
    const minutes = Math.floor(uptime / 60) % 60;
    const seconds = Math.floor(uptime % 60);
    
    const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    
    // Memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const memoryTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    
    const embed = new EmbedBuilder()
      .setTitle('🤖 FouQ-Bot Information')
      .setColor(0x0099FF)
      .setThumbnail(client.user?.displayAvatarURL() || null)
      .addFields(
        {
          name: '📊 Statistics',
          value: [
            `**Servers:** ${client.guilds.cache.size}`,
            `**Users:** ${client.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0)}`,
            `**Commands:** ${client.commands.size}`,
            `**Shard:** ${client.shard?.ids[0] ?? 0}/${client.options.shardCount ?? 1}`,
          ].join('\n'),
          inline: true,
        },
        {
          name: '⚡ Performance',
          value: [
            `**Uptime:** ${uptimeString}`,
            `**Memory:** ${memoryUsed}MB / ${memoryTotal}MB`,
            `**Ping:** ${Math.round(client.ws.ping)}ms`,
          ].join('\n'),
          inline: true,
        },
        {
          name: '🔧 Technical',
          value: [
            `**Node.js:** ${process.version}`,
            `**Discord.js:** v14`,
            `**Platform:** ${os.platform()} ${os.arch()}`,
            `**Database:** ${databaseService.isConnected() ? databaseService.getDatabaseType().toUpperCase() : 'Disconnected'}`,
          ].join('\n'),
          inline: true,
        }
      )
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  },
};

export default command;