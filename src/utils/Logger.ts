import fs from 'fs';
import path from 'path';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export class Logger {
  private static logLevel: LogLevel = process.env.DEBUG === 'true' ? LogLevel.DEBUG : LogLevel.INFO;
  private static logDir = './logs';

  static {
    // Ensure logs directory exists
    if (!fs.existsSync(Logger.logDir)) {
      fs.mkdirSync(Logger.logDir, { recursive: true });
    }
  }

  private static formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ') : '';
    
    return `[${timestamp}] [${level}] ${message}${formattedArgs}`;
  }

  private static writeToFile(level: string, message: string): void {
    try {
      const logFile = path.join(Logger.logDir, `${new Date().toISOString().split('T')[0]}.log`);
      fs.appendFileSync(logFile, message + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private static log(level: LogLevel, levelName: string, message: string, ...args: any[]): void {
    if (level > Logger.logLevel) {
      return;
    }

    const formattedMessage = Logger.formatMessage(levelName, message, ...args);
    
    // Console output with colors
    switch (level) {
      case LogLevel.ERROR:
        console.error(`\x1b[31m${formattedMessage}\x1b[0m`);
        break;
      case LogLevel.WARN:
        console.warn(`\x1b[33m${formattedMessage}\x1b[0m`);
        break;
      case LogLevel.INFO:
        console.info(`\x1b[36m${formattedMessage}\x1b[0m`);
        break;
      case LogLevel.DEBUG:
        console.debug(`\x1b[37m${formattedMessage}\x1b[0m`);
        break;
    }

    // Write to file (without colors)
    Logger.writeToFile(levelName, Logger.formatMessage(levelName, message, ...args));
  }

  public static error(message: string, ...args: any[]): void {
    Logger.log(LogLevel.ERROR, 'ERROR', message, ...args);
  }

  public static warn(message: string, ...args: any[]): void {
    Logger.log(LogLevel.WARN, 'WARN', message, ...args);
  }

  public static info(message: string, ...args: any[]): void {
    Logger.log(LogLevel.INFO, 'INFO', message, ...args);
  }

  public static debug(message: string, ...args: any[]): void {
    Logger.log(LogLevel.DEBUG, 'DEBUG', message, ...args);
  }

  public static setLogLevel(level: LogLevel): void {
    Logger.logLevel = level;
  }

  public static getLogLevel(): LogLevel {
    return Logger.logLevel;
  }
}