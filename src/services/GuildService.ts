import { Repository } from 'typeorm';
import { Guild } from '../database/entities/Guild';
import { DatabaseService } from '../database/DatabaseService';
import { Logger } from '../utils/Logger';

export class GuildService {
  private guildRepository: Repository<Guild>;

  constructor() {
    const databaseService = DatabaseService.getInstance();
    this.guildRepository = databaseService.getDataSource().getRepository(Guild);
  }

  public async findOrCreateGuild(discordId: string, name: string): Promise<Guild> {
    try {
      let guild = await this.guildRepository.findOne({ where: { discordId } });
      
      if (!guild) {
        guild = this.guildRepository.create({
          discordId,
          name,
        });
        
        await this.guildRepository.save(guild);
        Logger.info(`Created new guild: ${name} (${discordId})`);
      } else {
        // Update guild name if changed
        if (guild.name !== name) {
          guild.name = name;
          await this.guildRepository.save(guild);
          Logger.debug(`Updated guild name: ${name} (${discordId})`);
        }
      }
      
      return guild;
    } catch (error) {
      Logger.error('Error finding or creating guild:', error);
      throw error;
    }
  }

  public async getGuildByDiscordId(discordId: string): Promise<Guild | null> {
    try {
      return await this.guildRepository.findOne({ where: { discordId } });
    } catch (error) {
      Logger.error('Error getting guild by Discord ID:', error);
      throw error;
    }
  }

  public async updateGuildPrefix(discordId: string, prefix: string): Promise<Guild> {
    try {
      const guild = await this.guildRepository.findOne({ where: { discordId } });
      
      if (!guild) {
        throw new Error(`Guild with Discord ID ${discordId} not found`);
      }
      
      guild.prefix = prefix;
      await this.guildRepository.save(guild);
      
      Logger.info(`Updated prefix for guild ${guild.name}: ${prefix}`);
      return guild;
    } catch (error) {
      Logger.error('Error updating guild prefix:', error);
      throw error;
    }
  }

  public async updateGuildSetting(discordId: string, key: string, value: any): Promise<Guild> {
    try {
      const guild = await this.guildRepository.findOne({ where: { discordId } });
      
      if (!guild) {
        throw new Error(`Guild with Discord ID ${discordId} not found`);
      }
      
      guild.setSetting(key, value);
      await this.guildRepository.save(guild);
      
      Logger.info(`Updated setting ${key} for guild ${guild.name}`);
      return guild;
    } catch (error) {
      Logger.error('Error updating guild setting:', error);
      throw error;
    }
  }

  public async disableCommand(discordId: string, commandName: string): Promise<Guild> {
    try {
      const guild = await this.guildRepository.findOne({ where: { discordId } });
      
      if (!guild) {
        throw new Error(`Guild with Discord ID ${discordId} not found`);
      }
      
      guild.disableCommand(commandName);
      await this.guildRepository.save(guild);
      
      Logger.info(`Disabled command ${commandName} for guild ${guild.name}`);
      return guild;
    } catch (error) {
      Logger.error('Error disabling command:', error);
      throw error;
    }
  }

  public async enableCommand(discordId: string, commandName: string): Promise<Guild> {
    try {
      const guild = await this.guildRepository.findOne({ where: { discordId } });
      
      if (!guild) {
        throw new Error(`Guild with Discord ID ${discordId} not found`);
      }
      
      guild.enableCommand(commandName);
      await this.guildRepository.save(guild);
      
      Logger.info(`Enabled command ${commandName} for guild ${guild.name}`);
      return guild;
    } catch (error) {
      Logger.error('Error enabling command:', error);
      throw error;
    }
  }

  public async isCommandDisabled(discordId: string, commandName: string): Promise<boolean> {
    try {
      const guild = await this.guildRepository.findOne({ where: { discordId } });
      
      if (!guild) {
        return false; // If guild not found, command is not disabled
      }
      
      return guild.isCommandDisabled(commandName);
    } catch (error) {
      Logger.error('Error checking if command is disabled:', error);
      return false;
    }
  }

  public async getActiveGuilds(): Promise<Guild[]> {
    try {
      return await this.guildRepository.find({
        where: { isActive: true },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      Logger.error('Error getting active guilds:', error);
      throw error;
    }
  }

  public async getGuildStats(): Promise<{ totalGuilds: number; activeGuilds: number }> {
    try {
      const totalGuilds = await this.guildRepository.count();
      const activeGuilds = await this.guildRepository.count({ where: { isActive: true } });
      
      return { totalGuilds, activeGuilds };
    } catch (error) {
      Logger.error('Error getting guild stats:', error);
      throw error;
    }
  }

  public async setGuildInactive(discordId: string): Promise<void> {
    try {
      const guild = await this.guildRepository.findOne({ where: { discordId } });
      
      if (guild) {
        guild.isActive = false;
        await this.guildRepository.save(guild);
        Logger.info(`Set guild ${guild.name} as inactive`);
      }
    } catch (error) {
      Logger.error('Error setting guild inactive:', error);
      throw error;
    }
  }
}