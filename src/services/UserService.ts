import { Repository } from 'typeorm';
import { User } from '../database/entities/User';
import { DatabaseService } from '../database/DatabaseService';
import { Logger } from '../utils/Logger';

export class UserService {
  private userRepository: Repository<User>;

  constructor() {
    const databaseService = DatabaseService.getInstance();
    this.userRepository = databaseService.getDataSource().getRepository(User);
  }

  public async findOrCreateUser(discordId: string, username: string, displayName?: string): Promise<User> {
    try {
      let user = await this.userRepository.findOne({ where: { discordId } });
      
      if (!user) {
        user = this.userRepository.create({
          discordId,
          username,
          displayName,
        });
        
        await this.userRepository.save(user);
        Logger.info(`Created new user: ${username} (${discordId})`);
      } else {
        // Update username and display name if changed
        let updated = false;
        
        if (user.username !== username) {
          user.username = username;
          updated = true;
        }
        
        if (user.displayName !== displayName) {
          user.displayName = displayName;
          updated = true;
        }
        
        if (updated) {
          await this.userRepository.save(user);
          Logger.debug(`Updated user info: ${username} (${discordId})`);
        }
      }
      
      return user;
    } catch (error) {
      Logger.error('Error finding or creating user:', error);
      throw error;
    }
  }

  public async getUserByDiscordId(discordId: string): Promise<User | null> {
    try {
      return await this.userRepository.findOne({ where: { discordId } });
    } catch (error) {
      Logger.error('Error getting user by Discord ID:', error);
      throw error;
    }
  }

  public async addExperience(discordId: string, amount: number): Promise<{ user: User; leveledUp: boolean; newLevel?: number }> {
    try {
      const user = await this.userRepository.findOne({ where: { discordId } });
      
      if (!user) {
        throw new Error(`User with Discord ID ${discordId} not found`);
      }
      
      const oldLevel = user.level;
      user.addExperience(amount);
      
      await this.userRepository.save(user);
      
      const leveledUp = user.level > oldLevel;
      
      return {
        user,
        leveledUp,
        newLevel: leveledUp ? user.level : undefined,
      };
    } catch (error) {
      Logger.error('Error adding experience:', error);
      throw error;
    }
  }

  public async addCoins(discordId: string, amount: number): Promise<User> {
    try {
      const user = await this.userRepository.findOne({ where: { discordId } });
      
      if (!user) {
        throw new Error(`User with Discord ID ${discordId} not found`);
      }
      
      user.addCoins(amount);
      await this.userRepository.save(user);
      
      return user;
    } catch (error) {
      Logger.error('Error adding coins:', error);
      throw error;
    }
  }

  public async spendCoins(discordId: string, amount: number): Promise<{ success: boolean; user?: User }> {
    try {
      const user = await this.userRepository.findOne({ where: { discordId } });
      
      if (!user) {
        throw new Error(`User with Discord ID ${discordId} not found`);
      }
      
      const success = user.spendCoins(amount);
      
      if (success) {
        await this.userRepository.save(user);
      }
      
      return { success, user: success ? user : undefined };
    } catch (error) {
      Logger.error('Error spending coins:', error);
      throw error;
    }
  }

  public async getTopUsersByLevel(limit: number = 10): Promise<User[]> {
    try {
      return await this.userRepository.find({
        where: { isActive: true },
        order: { level: 'DESC', experience: 'DESC' },
        take: limit,
      });
    } catch (error) {
      Logger.error('Error getting top users by level:', error);
      throw error;
    }
  }

  public async getTopUsersByCoins(limit: number = 10): Promise<User[]> {
    try {
      return await this.userRepository.find({
        where: { isActive: true },
        order: { coins: 'DESC' },
        take: limit,
      });
    } catch (error) {
      Logger.error('Error getting top users by coins:', error);
      throw error;
    }
  }

  public async getUserStats(): Promise<{ totalUsers: number; activeUsers: number }> {
    try {
      const totalUsers = await this.userRepository.count();
      const activeUsers = await this.userRepository.count({ where: { isActive: true } });
      
      return { totalUsers, activeUsers };
    } catch (error) {
      Logger.error('Error getting user stats:', error);
      throw error;
    }
  }
}