import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { BotCommand } from '../types/Command';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('shards')
    .setDescription('Shows information about bot shards'),
  
  category: 'utility',
  cooldown: 10,
  ownerOnly: true, // Only bot owner can see shard information
  
  async execute(interaction: ChatInputCommandInteraction) {
    const client = interaction.client;
    
    if (!client.shard) {
      // Bot is not running with sharding
      const embed = new EmbedBuilder()
        .setTitle('🔧 Shard Information')
        .setDescription('This bot is not running with sharding enabled.')
        .setColor(0xFF9900)
        .addFields(
          {
            name: '📊 Current Mode',
            value: 'Single Process',
            inline: true,
          },
          {
            name: '🏠 Servers',
            value: client.guilds.cache.size.toString(),
            inline: true,
          },
          {
            name: '👥 Users',
            value: client.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0).toString(),
            inline: true,
          }
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
      return;
    }

    try {
      // Get shard information
      const shardId = client.shard.ids[0];
      const totalShards = client.options.shardCount || 1;
      
      // Fetch shard statistics
      const shardStats = await client.shard.fetchClientValues('guilds.cache.size');
      const userStats = await client.shard.fetchClientValues('guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0)');
      const pingStats = await client.shard.fetchClientValues('ws.ping');
      
      const totalGuilds = (shardStats as number[]).reduce((acc, val) => acc + val, 0);
      const totalUsers = (userStats as number[]).reduce((acc, val) => acc + val, 0);
      
      const embed = new EmbedBuilder()
        .setTitle('🔧 Shard Information')
        .setDescription(`Bot is running with **${totalShards}** shard(s)`)
        .setColor(0x00FF00)
        .addFields(
          {
            name: '📊 Current Shard',
            value: `Shard ${shardId}`,
            inline: true,
          },
          {
            name: '🏠 Total Servers',
            value: totalGuilds.toString(),
            inline: true,
          },
          {
            name: '👥 Total Users',
            value: totalUsers.toString(),
            inline: true,
          },
          {
            name: '📈 Shard Details',
            value: (shardStats as number[]).map((guilds, index) => 
              `**Shard ${index}:** ${guilds} servers | ${Math.round((pingStats as number[])[index] || 0)}ms`
            ).join('\n'),
            inline: false,
          }
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Error fetching shard information:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setTitle('❌ Error')
        .setDescription('Failed to fetch shard information.')
        .setColor(0xFF0000)
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();
      
      await interaction.reply({ embeds: [errorEmbed], flags: MessageFlags.Ephemeral });
    }
  },
};

export default command;