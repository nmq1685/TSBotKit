import { Client } from 'discord.js';
import { Logger } from '../utils/Logger';
import fs from 'fs';
import path from 'path';

export interface BotEvent {
  name: string;
  once?: boolean;
  execute: (...args: any[]) => Promise<void> | void;
}

export class EventHandler {
  private client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  public async loadEvents(): Promise<void> {
    const eventsPath = path.join(__dirname, '..', 'events');
    
    if (!fs.existsSync(eventsPath)) {
      Logger.warn('Events directory not found, creating it...');
      fs.mkdirSync(eventsPath, { recursive: true });
      return;
    }

    const eventFiles = fs.readdirSync(eventsPath).filter(file => 
      file.endsWith('.ts') || file.endsWith('.js')
    );

    let loadedEvents = 0;

    for (const file of eventFiles) {
      try {
        const filePath = path.join(eventsPath, file);
        const eventModule = await import(filePath);
        const event: BotEvent = eventModule.default || eventModule;

        if (!event.name || !event.execute) {
          Logger.warn(`Event file ${file} is missing required properties (name or execute)`);
          continue;
        }

        if (event.once) {
          this.client.once(event.name, (...args) => {
            this.handleEvent(event, ...args);
          });
        } else {
          this.client.on(event.name, (...args) => {
            this.handleEvent(event, ...args);
          });
        }

        loadedEvents++;
        Logger.info(`Loaded event: ${event.name}${event.once ? ' (once)' : ''}`);

      } catch (error) {
        Logger.error(`Failed to load event ${file}:`, error);
      }
    }

    Logger.info(`Loaded ${loadedEvents} events`);
  }

  private async handleEvent(event: BotEvent, ...args: any[]): Promise<void> {
    try {
      await event.execute(...args);
    } catch (error) {
      Logger.error(`Error executing event ${event.name}:`, error);
    }
  }
}