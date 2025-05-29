import { Events, Message, PermissionsBitField } from 'discord.js';
import { BotEvent } from '../handlers/EventHandler';
import { GuildService } from '../services/GuildService';
import { Logger } from '../utils/Logger';
import { BotCommand } from '../types/Command';

const event: BotEvent = {
  name: Events.MessageCreate,
  async execute(message: Message) {
    // Ignore messages from bots
    if (message.author.bot) return;

    // Only process messages in guilds
    if (!message.guild) return;

    let commandName: string | undefined;

    try {
      const guildService = new GuildService();
      const guildData = await guildService.findOrCreateGuild(message.guild.id, message.guild.name);
      const prefix = guildData.prefix;

      // Check if message starts with prefix
      if (!message.content.startsWith(prefix)) return;

      // Parse command and arguments
      const args = message.content.slice(prefix.length).trim().split(/ +/);
      commandName = args.shift()?.toLowerCase();

      if (!commandName) return;

      // Get command from client commands collection
      const command = message.client.commands.get(commandName);
      if (!command) return;

      // Check if command is guild-only
      if (command.guildOnly && !message.guild) {
        await message.reply('This command can only be used in a server!');
        return;
      }

      // Check if user is bot owner (for owner-only commands)
      if (command.ownerOnly) {
        const ownerId = process.env.OWNER_ID;
        if (!ownerId || message.author.id !== ownerId) {
          await message.reply('This command can only be used by the bot owner!');
          return;
        }
      }

      // Check user permissions
      if (command.permissions && message.guild && message.member) {
        const memberPermissions = message.member.permissions;
        const hasPermissions = command.permissions.every(permission => 
          memberPermissions.has(permission as any)
        );

        if (!hasPermissions) {
          await message.reply('You do not have permission to use this command!');
          return;
        }
      }

      // Check bot permissions
      if (message.guild && message.guild.members.me) {
        const botPermissions = message.guild.members.me.permissions;
        if (!botPermissions.has(PermissionsBitField.Flags.SendMessages)) {
          return; // Can't send messages, so can't respond
        }
      }

      // Create a mock interaction object for compatibility with slash command handlers
      const mockInteraction = {
        client: message.client,
        user: message.author,
        member: message.member,
        guild: message.guild,
        channel: message.channel,
        createdTimestamp: message.createdTimestamp,
        reply: async (options: any) => {
          if (typeof options === 'string') {
            mockInteraction.lastReply = await message.reply(options);
            return mockInteraction.lastReply;
          }
          mockInteraction.lastReply = await message.reply(options);
          return mockInteraction.lastReply;
        },
        editReply: async (options: any) => {
          // Edit the last reply message if it exists
          if (mockInteraction.lastReply) {
            if (typeof options === 'string') {
              return await mockInteraction.lastReply.edit(options);
            }
            return await mockInteraction.lastReply.edit(options);
          }
          // Fallback to sending a new message if no reply exists
          if (message.channel.isTextBased() && 'send' in message.channel) {
            if (typeof options === 'string') {
              return await message.channel.send(options);
            }
            return await message.channel.send(options);
          }
          return null;
        },
        lastReply: null as any,
        options: {
          getString: (name: string) => args[0] || null,
          getInteger: (name: string) => {
            const value = args[0];
            return value ? parseInt(value) : null;
          },
          getBoolean: (name: string) => {
            const value = args[0]?.toLowerCase();
            return value === 'true' || value === '1' || value === 'yes';
          },
          getUser: (name: string) => {
            const mention = args[0];
            if (mention?.startsWith('<@') && mention.endsWith('>')) {
              const id = mention.slice(2, -1).replace('!', '');
              return message.client.users.cache.get(id) || null;
            }
            return null;
          },
          getChannel: (name: string) => {
            const mention = args[0];
            if (mention?.startsWith('<#') && mention.endsWith('>')) {
              const id = mention.slice(2, -1);
              return message.client.channels.cache.get(id) || null;
            }
            return null;
          }
        }
      };

      // Execute the command with mock interaction
      await command.execute(mockInteraction as any);

      Logger.info(`Prefix command executed: ${commandName} by ${message.author.tag} in ${message.guild.name}`);

    } catch (error) {
      Logger.error(`Error executing prefix command '${commandName}':`, {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        command: commandName,
        user: message.author.tag,
        guild: message.guild?.name
      });
      
      try {
        await message.reply('There was an error executing this command!');
      } catch (replyError) {
        Logger.error('Failed to send error message:', replyError);
      }
    }
  },
};

export default event;