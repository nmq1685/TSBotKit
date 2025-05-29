import { Events, Interaction, PermissionsBitField } from 'discord.js';
import { BotEvent } from '../handlers/EventHandler';
import { CommandHandler } from '../handlers/CommandHandler';
import { Logger } from '../utils/Logger';

const event: BotEvent = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      Logger.warn(`No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      // Check if command is guild-only
      if (command.guildOnly && !interaction.guild) {
        await interaction.reply({
          content: 'This command can only be used in a server!',
          ephemeral: true,
        });
        return;
      }

      // Check if user is bot owner (for owner-only commands)
      if (command.ownerOnly) {
        const ownerId = process.env.OWNER_ID;
        if (!ownerId || interaction.user.id !== ownerId) {
          await interaction.reply({
            content: 'This command can only be used by the bot owner!',
            ephemeral: true,
          });
          return;
        }
      }

      // Check user permissions
      if (command.permissions && interaction.guild) {
        const member = interaction.guild.members.cache.get(interaction.user.id);
        if (member && !member.permissions.has(command.permissions)) {
          await interaction.reply({
            content: 'You do not have permission to use this command!',
            ephemeral: true,
          });
          return;
        }
      }

      // Check cooldown
      if (command.cooldown) {
        const commandHandler = new CommandHandler(interaction.client);
        const remainingCooldown = commandHandler.checkCooldown(
          interaction.user.id,
          interaction.commandName,
          command.cooldown
        );

        if (remainingCooldown > 0) {
          await interaction.reply({
            content: `Please wait ${remainingCooldown} seconds before using this command again.`,
            ephemeral: true,
          });
          return;
        }
      }

      // Execute the command
      await command.execute(interaction);
      
      Logger.info(`Command ${interaction.commandName} executed by ${interaction.user.tag} in ${interaction.guild?.name || 'DM'}`);

    } catch (error) {
      Logger.error(`Error executing command ${interaction.commandName}:`, error);
      
      const errorMessage = 'There was an error while executing this command!';
      
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        }
      } catch (replyError) {
        Logger.error('Failed to send error message:', replyError);
      }
    }
  },
};

export default event;