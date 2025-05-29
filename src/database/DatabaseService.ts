import { DataSource, DataSourceOptions } from 'typeorm';
import { Logger } from '../utils/Logger';
import path from 'path';
import fs from 'fs';

export class DatabaseService {
  private static instance: DatabaseService | null = null;
  private dataSource: DataSource | null = null;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      Logger.warn('Database already initialized');
      return;
    }

    try {
      // Try MySQL first
      if (await this.tryMySQLConnection()) {
        Logger.info('Using MySQL database');
        return;
      }

      // Fallback to SQLite
      await this.initializeSQLite();
      Logger.info('Using SQLite database (MySQL not available)');

    } catch (error) {
      Logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private async tryMySQLConnection(): Promise<boolean> {
    try {
      const mysqlConfig: DataSourceOptions = {
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        entities: [path.join(__dirname, 'entities', '*.{ts,js}')],
        synchronize: true, // Set to false in production
        logging: process.env.DEBUG === 'true',
        connectTimeout: 5000,
        acquireTimeout: 5000,
      };

      // Check if MySQL credentials are provided
      if (!mysqlConfig.username || !mysqlConfig.password || !mysqlConfig.database) {
        Logger.info('MySQL credentials not provided, skipping MySQL connection');
        return false;
      }

      this.dataSource = new DataSource(mysqlConfig);
      await this.dataSource.initialize();
      
      // Test connection
      await this.dataSource.query('SELECT 1');
      this.isInitialized = true;
      return true;

    } catch (error) {
      Logger.warn('MySQL connection failed:', error instanceof Error ? error.message : 'Unknown error');
      
      if (this.dataSource) {
        try {
          await this.dataSource.destroy();
        } catch (destroyError) {
          Logger.warn('Error destroying failed MySQL connection:', destroyError);
        }
        this.dataSource = null;
      }
      
      return false;
    }
  }

  private async initializeSQLite(): Promise<void> {
    try {
      // Ensure data directory exists
      const dbPath = process.env.SQLITE_DATABASE || './data/fouq_bot.db';
      const dbDir = path.dirname(dbPath);
      
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        Logger.info(`Created database directory: ${dbDir}`);
      }

      const sqliteConfig: DataSourceOptions = {
        type: 'sqlite',
        database: dbPath,
        entities: [path.join(__dirname, 'entities', '*.{ts,js}')],
        synchronize: true, // Set to false in production
        logging: process.env.DEBUG === 'true',
      };

      this.dataSource = new DataSource(sqliteConfig);
      await this.dataSource.initialize();
      this.isInitialized = true;

    } catch (error) {
      Logger.error('SQLite initialization failed:', error);
      throw error;
    }
  }

  public getDataSource(): DataSource {
    if (!this.dataSource || !this.isInitialized) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.dataSource;
  }

  public async close(): Promise<void> {
    if (this.dataSource && this.isInitialized) {
      try {
        await this.dataSource.destroy();
        this.dataSource = null;
        this.isInitialized = false;
        Logger.info('Database connection closed');
      } catch (error) {
        Logger.error('Error closing database connection:', error);
        throw error;
      }
    }
  }

  public isConnected(): boolean {
    return this.isInitialized && this.dataSource?.isInitialized === true;
  }

  public getDatabaseType(): string {
    if (!this.dataSource) {
      return 'none';
    }
    return this.dataSource.options.type;
  }
}