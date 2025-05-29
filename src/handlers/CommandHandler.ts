import { Client, Collection, REST, Routes } from 'discord.js';
import { BotCommand, CooldownData } from '../types/Command';
import { Logger } from '../utils/Logger';
import fs from 'fs';
import path from 'path';

export class CommandHandler {
  private client: Client;
  private cooldowns: Collection<string, CooldownData> = new Collection();

  constructor(client: Client) {
    this.client = client;
  }

  public async loadCommands(): Promise<void> {
    const commandsPath = path.join(__dirname, '..', 'commands');
    
    if (!fs.existsSync(commandsPath)) {
      Logger.warn('Commands directory not found, creating it...');
      fs.mkdirSync(commandsPath, { recursive: true });
      return;
    }

    const commandFiles = fs.readdirSync(commandsPath).filter(file => 
      file.endsWith('.ts') || file.endsWith('.js')
    );

    const commands = [];

    for (const file of commandFiles) {
      try {
        const filePath = path.join(commandsPath, file);
        const commandModule = await import(filePath);
        const command: BotCommand = commandModule.default || commandModule;

        if (!command.data || !command.execute) {
          Logger.warn(`Command file ${file} is missing required properties (data or execute)`);
          continue;
        }

        this.client.commands.set(command.data.name, command);
        commands.push(command.data.toJSON());
        Logger.info(`Loaded command: ${command.data.name}`);

      } catch (error) {
        Logger.error(`Failed to load command ${file}:`, error);
      }
    }

    // Register slash commands with Discord
    if (commands.length > 0) {
      await this.registerSlashCommands(commands);
    }

    Logger.info(`Loaded ${this.client.commands.size} commands`);
  }

  private async registerSlashCommands(commands: any[]): Promise<void> {
    try {
      const rest = new REST().setToken(process.env.DISCORD_TOKEN!);
      const clientId = process.env.CLIENT_ID;
      const guildId = process.env.GUILD_ID;

      if (!clientId) {
        Logger.error('CLIENT_ID not found in environment variables');
        return;
      }

      Logger.info('Started refreshing application (/) commands.');

      if (guildId) {
        // Register commands for specific guild (faster for development)
        await rest.put(
          Routes.applicationGuildCommands(clientId, guildId),
          { body: commands }
        );
        Logger.info(`Successfully reloaded ${commands.length} guild application (/) commands.`);
      } else {
        // Register commands globally (takes up to 1 hour to propagate)
        await rest.put(
          Routes.applicationCommands(clientId),
          { body: commands }
        );
        Logger.info(`Successfully reloaded ${commands.length} global application (/) commands.`);
      }

    } catch (error) {
      Logger.error('Failed to register slash commands:', error);
    }
  }

  public checkCooldown(userId: string, commandName: string, cooldownSeconds: number): number {
    const cooldownKey = `${userId}-${commandName}`;
    const now = Date.now();
    
    const existingCooldown = this.cooldowns.get(cooldownKey);
    
    if (existingCooldown && existingCooldown.expiresAt > now) {
      return Math.ceil((existingCooldown.expiresAt - now) / 1000);
    }

    // Set new cooldown
    this.cooldowns.set(cooldownKey, {
      userId,
      commandName,
      expiresAt: now + (cooldownSeconds * 1000)
    });

    // Clean up expired cooldowns periodically
    this.cleanupCooldowns();

    return 0;
  }

  private cleanupCooldowns(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cooldowns.forEach((cooldown, key) => {
      if (cooldown.expiresAt <= now) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.cooldowns.delete(key));
  }

  public getCommandsCount(): number {
    return this.client.commands.size;
  }

  public getCommand(name: string): BotCommand | undefined {
    return this.client.commands.get(name);
  }
}