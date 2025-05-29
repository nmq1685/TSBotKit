import { Client, GatewayIntentBits, Collection } from 'discord.js';
import dotenv from 'dotenv';
import { DatabaseService } from './database/DatabaseService';
import { CommandHandler } from './handlers/CommandHandler';
import { EventHandler } from './handlers/EventHandler';
import { Logger } from './utils/Logger';
import { BotCommand } from './types/Command';

// Load environment variables
dotenv.config();

// Extend Client interface to include commands
declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, BotCommand>;
  }
}

class FouQBot {
  private client: Client;
  private databaseService: DatabaseService;
  private commandHandler: CommandHandler;
  private eventHandler: EventHandler;
  private shardId: number;
  private totalShards: number;

  constructor() {
    // Get shard information from environment or process
    this.shardId = process.env.SHARD_ID ? parseInt(process.env.SHARD_ID) : 0;
    this.totalShards = process.env.TOTAL_SHARDS ? parseInt(process.env.TOTAL_SHARDS) : 1;

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
      ],
      shards: this.shardId,
      shardCount: this.totalShards,
    });

    this.client.commands = new Collection();
    this.databaseService = DatabaseService.getInstance();
    this.commandHandler = new CommandHandler(this.client);
    this.eventHandler = new EventHandler(this.client);
    
    this.setupShardEventListeners();
  }

  private setupShardEventListeners(): void {
    // Listen for messages from shard manager
    process.on('message', (message: any) => {
      if (message.type === 'SHARD_MANAGER_READY') {
        Logger.info(`Shard ${this.shardId} received ready signal from shard manager`);
      }
    });
  }

  public async start(): Promise<void> {
    try {
      Logger.info(`Starting FouQ-Bot shard ${this.shardId}/${this.totalShards}...`);

      // Initialize database
      await this.databaseService.initialize();
      Logger.info(`Database initialized successfully for shard ${this.shardId}`);

      // Load commands and events
      await this.commandHandler.loadCommands();
      await this.eventHandler.loadEvents();

      // Login to Discord
      await this.client.login(process.env.DISCORD_TOKEN);
      Logger.info(`Shard ${this.shardId} logged in successfully`);

    } catch (error) {
      Logger.error(`Failed to start shard ${this.shardId}:`, error);
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    Logger.info(`Shutting down FouQ-Bot shard ${this.shardId}...`);
    
    try {
      await this.databaseService.close();
      this.client.destroy();
      Logger.info(`Shard ${this.shardId} shutdown completed`);
    } catch (error) {
      Logger.error(`Error during shard ${this.shardId} shutdown:`, error);
    }
  }

  public getShardInfo(): { shardId: number; totalShards: number } {
    return {
      shardId: this.shardId,
      totalShards: this.totalShards
    };
  }

  public getClient(): Client {
    return this.client;
  }
}

// Create and start bot instance
const bot = new FouQBot();

// Handle process termination
process.on('SIGINT', async () => {
  await bot.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await bot.shutdown();
  process.exit(0);
});

// Start the bot
bot.start().catch((error) => {
  Logger.error('Unhandled error:', error);
  process.exit(1);
});