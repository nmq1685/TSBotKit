import { ShardingManager } from 'discord.js';
import { Logger } from './utils/Logger';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

class ShardManager {
  private manager: ShardingManager;

  constructor() {
    const token = process.env.DISCORD_TOKEN;
    if (!token) {
      Logger.error('DISCORD_TOKEN not found in environment variables');
      process.exit(1);
    }

    // Get shard count from environment or use 'auto'
    const shardCount = process.env.SHARD_COUNT;
    const totalShards = shardCount === 'auto' || !shardCount ? 'auto' : parseInt(shardCount, 10);

    // Determine the correct file path and execution arguments based on environment
    const isProduction = process.env.NODE_ENV === 'production';
    const scriptPath = isProduction 
      ? path.join(__dirname, 'index.js')
      : path.join(__dirname, 'index.ts');

    // Create sharding manager
    this.manager = new ShardingManager(scriptPath, {
      token: token,
      totalShards: totalShards,
      shardList: 'auto',
      mode: 'process',
      respawn: true,
      shardArgs: [],
      execArgv: isProduction ? [] : ['-r', 'ts-node/register'],
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Shard creation event
    this.manager.on('shardCreate', (shard) => {
      Logger.info(`Launched shard ${shard.id}`);
      
      // Listen for shard ready event
      shard.on('ready', () => {
        Logger.info(`Shard ${shard.id} is ready`);
      });

      // Listen for shard disconnect event
      shard.on('disconnect', () => {
        Logger.warn(`Shard ${shard.id} disconnected`);
      });

      // Listen for shard reconnecting event
      shard.on('reconnecting', () => {
        Logger.info(`Shard ${shard.id} is reconnecting`);
      });

      // Listen for shard death event
      shard.on('death', () => {
        Logger.error(`Shard ${shard.id} died`);
      });

      // Listen for shard error event
      shard.on('error', (error) => {
        Logger.error(`Shard ${shard.id} encountered an error:`, error);
      });
    });
  }

  public async start(): Promise<void> {
    try {
      Logger.info('Starting FouQ-Bot with sharding...');
      
      // Spawn all shards
      await this.manager.spawn();
      
      Logger.info(`Successfully spawned ${this.manager.totalShards} shards`);
      
      // Broadcast a message to all shards (example)
      this.manager.broadcast({ type: 'SHARD_MANAGER_READY' });
      
    } catch (error) {
      Logger.error('Failed to start sharding manager:', error);
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    Logger.info('Shutting down shard manager...');
    
    try {
      // Destroy all shards
      this.manager.shards.forEach(shard => {
        shard.kill();
      });
      
      Logger.info('Shard manager shutdown completed');
    } catch (error) {
      Logger.error('Error during shard manager shutdown:', error);
    }
  }

  public getShardCount(): number {
    const totalShards = this.manager.totalShards;
    return typeof totalShards === 'number' ? totalShards : 0;
  }

  public getShardStatus(): Array<{ id: number; ready: boolean }> {
    return this.manager.shards.map(shard => ({
      id: shard.id,
      ready: shard.ready
    }));
  }
}

// Create and start shard manager
const shardManager = new ShardManager();

// Handle process termination
process.on('SIGINT', async () => {
  await shardManager.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await shardManager.shutdown();
  process.exit(0);
});

// Start the shard manager
shardManager.start().catch((error) => {
  Logger.error('Unhandled error in shard manager:', error);
  process.exit(1);
});

export default ShardManager;