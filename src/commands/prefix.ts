import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { BotCommand } from '../types/Command';
import { GuildService } from '../services/GuildService';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('prefix')
    .setDescription('Manage the bot prefix for this server')
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Set a new prefix for this server')
        .addStringOption(option =>
          option
            .setName('new_prefix')
            .setDescription('The new prefix to use (max 5 characters)')
            .setRequired(true)
            .setMaxLength(5)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('show')
        .setDescription('Show the current prefix for this server')
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  
  category: 'admin',
  cooldown: 5,
  guildOnly: true,
  permissions: [PermissionFlagsBits.ManageGuild],
  
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) {
      await interaction.reply({
        content: 'This command can only be used in a server!',
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();
    const guildService = new GuildService();

    try {
      if (subcommand === 'set') {
        const newPrefix = interaction.options.getString('new_prefix', true);
        
        // Validate prefix
        if (newPrefix.length > 5) {
          await interaction.reply({
            content: '❌ Prefix cannot be longer than 5 characters!',
            ephemeral: true,
          });
          return;
        }

        if (newPrefix.includes(' ')) {
          await interaction.reply({
            content: '❌ Prefix cannot contain spaces!',
            ephemeral: true,
          });
          return;
        }

        // Update prefix in database
        await guildService.updateGuildPrefix(interaction.guild.id, newPrefix);
        
        await interaction.reply({
          content: `✅ Server prefix has been changed to: \`${newPrefix}\`\n` +
                   `You can now use commands like: \`${newPrefix}ping\`, \`${newPrefix}info\`, etc.`,
          ephemeral: false,
        });
        
      } else if (subcommand === 'show') {
        const guildData = await guildService.findOrCreateGuild(interaction.guild.id, interaction.guild.name);
        
        await interaction.reply({
          content: `📝 Current server prefix: \`${guildData.prefix}\`\n` +
                   `You can use commands like: \`${guildData.prefix}ping\`, \`${guildData.prefix}info\`, etc.\n` +
                   `Or use slash commands: \`/ping\`, \`/info\`, etc.`,
          ephemeral: false,
        });
      }
      
    } catch (error) {
      console.error('Error managing prefix:', error);
      await interaction.reply({
        content: '❌ An error occurred while managing the prefix. Please try again later.',
        ephemeral: true,
      });
    }
  },
};

export default command;