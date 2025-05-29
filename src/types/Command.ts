import { SlashCommandBuilder, SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder, ChatInputCommandInteraction, PermissionResolvable } from 'discord.js';

export interface BotCommand {
  data: SlashCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  permissions?: PermissionResolvable[];
  cooldown?: number; // in seconds
  category?: string;
  guildOnly?: boolean;
  ownerOnly?: boolean;
}

export interface CommandCategory {
  name: string;
  description: string;
  emoji?: string;
}

export interface CooldownData {
  userId: string;
  commandName: string;
  expiresAt: number;
}