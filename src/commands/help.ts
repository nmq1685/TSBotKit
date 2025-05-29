import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ComponentType } from 'discord.js';
import { BotCommand } from '../types/Command';
import { GuildService } from '../services/GuildService';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows all available commands or detailed info about a specific command')
    .addStringOption(option =>
      option.setName('command')
        .setDescription('Get detailed information about a specific command')
        .setRequired(false)
    ),
  
  category: 'utility',
  cooldown: 5,
  
  async execute(interaction: ChatInputCommandInteraction) {
    const commandName = interaction.options.getString('command');
    const client = interaction.client;
    
    if (commandName) {
      // Show detailed info about specific command
      const command = client.commands.get(commandName);
      
      if (!command) {
        await interaction.reply({
          content: `❌ Command \`${commandName}\` not found!`,
          ephemeral: true,
        });
        return;
      }
      
      // Get guild prefix for prefix command usage
      let guildPrefix = '!';
      if (interaction.guild) {
        try {
          const guildService = new GuildService();
          const guildData = await guildService.findOrCreateGuild(interaction.guild.id, interaction.guild.name);
          guildPrefix = guildData.prefix;
        } catch (error) {
          // Use default prefix if error
        }
      }

      const embed = new EmbedBuilder()
        .setTitle(`📖 Command: ${command.data.name}`)
        .setDescription(command.data.description)
        .setColor(0x0099FF)
        .addFields(
          {
            name: '💬 Usage',
            value: `**Slash Command:** \`/${command.data.name}\`\n**Prefix Command:** \`${guildPrefix}${command.data.name}\``,
            inline: false,
          }
        )
        .addFields(
          {
            name: '📂 Category',
            value: command.category || 'General',
            inline: true,
          },
          {
            name: '⏱️ Cooldown',
            value: command.cooldown ? `${command.cooldown} seconds` : 'None',
            inline: true,
          },
          {
            name: '🔒 Permissions',
            value: command.permissions ? command.permissions.join(', ') : 'None',
            inline: true,
          }
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();
      
      if (command.guildOnly) {
        embed.addFields({
          name: '🏠 Server Only',
          value: 'This command can only be used in servers',
          inline: true,
        });
      }
      
      if (command.ownerOnly) {
        embed.addFields({
          name: '👑 Owner Only',
          value: 'This command can only be used by the bot owner',
          inline: true,
        });
      }
      
      await interaction.reply({ embeds: [embed] });
      return;
    }
    
    // Get guild prefix for display
    let guildPrefix = '!';
    if (interaction.guild) {
      try {
        const guildService = new GuildService();
        const guildData = await guildService.findOrCreateGuild(interaction.guild.id, interaction.guild.name);
        guildPrefix = guildData.prefix;
      } catch (error) {
        // Use default prefix if error
      }
    }

    // Show all commands grouped by category
    const commands = Array.from(client.commands.values());
    const categories = new Map<string, BotCommand[]>();
    
    // Group commands by category
    commands.forEach(cmd => {
      const category = cmd.category || 'General';
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category)!.push(cmd);
    });

    const embed = new EmbedBuilder()
      .setTitle('📚 FouQ-Bot Commands')
      .setDescription(
        `Here are all available commands:\n\n` +
        `**🔹 Slash Commands:** Use \`/command\` (e.g., \`/ping\`)\n` +
        `**🔹 Prefix Commands:** Use \`${guildPrefix}command\` (e.g., \`${guildPrefix}ping\`)\n\n` +
        `Use \`/help <command>\` or \`${guildPrefix}help <command>\` for detailed information.`
      )
      .setColor(0x0099FF)
      .setThumbnail(client.user?.displayAvatarURL() || null)
      .setFooter({
        text: `Total Commands: ${commands.length} | Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();
    
    // Add fields for each category
    categories.forEach((cmds, categoryName) => {
      const commandList = cmds
        .map(cmd => `\`/${cmd.data.name}\` | \`${guildPrefix}${cmd.data.name}\` - ${cmd.data.description}`)
        .join('\n');
      
      embed.addFields({
        name: `📂 ${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}`,
        value: commandList || 'No commands',
        inline: false,
      });
    });
    
    // Create select menu for categories
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help_category_select')
      .setPlaceholder('Select a category for more details')
      .addOptions(
        Array.from(categories.keys()).map(category => 
          new StringSelectMenuOptionBuilder()
            .setLabel(category.charAt(0).toUpperCase() + category.slice(1))
            .setDescription(`View commands in ${category} category`)
            .setValue(category)
            .setEmoji('📂')
        )
      );
    
    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);
    
    const response = await interaction.reply({
      embeds: [embed],
      components: [row],
    });
    
    // Handle select menu interactions
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60000, // 1 minute
    });
    
    collector.on('collect', async (selectInteraction) => {
      if (selectInteraction.user.id !== interaction.user.id) {
        await selectInteraction.reply({
          content: 'You cannot use this menu!',
          ephemeral: true,
        });
        return;
      }
      
      const selectedCategory = selectInteraction.values[0];
      const categoryCommands = categories.get(selectedCategory) || [];
      
      const categoryEmbed = new EmbedBuilder()
        .setTitle(`📂 ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Commands`)
        .setColor(0x0099FF)
        .setDescription(
          categoryCommands
            .map(cmd => `**/${cmd.data.name}**\n${cmd.data.description}\n`)
            .join('\n')
        )
        .setFooter({
          text: `${categoryCommands.length} commands in this category`,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();
      
      await selectInteraction.update({ embeds: [categoryEmbed] });
    });
    
    collector.on('end', async () => {
      try {
        await interaction.editReply({ components: [] });
      } catch (error) {
        // Ignore errors when editing reply (message might be deleted)
      }
    });
  },
};

export default command;