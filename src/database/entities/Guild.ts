import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('guilds')
export class Guild {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  discordId!: string;

  @Column()
  name!: string;

  @Column({ default: '!' })
  prefix!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'json', nullable: true })
  settings?: {
    welcomeChannel?: string;
    logChannel?: string;
    autoRole?: string;
    moderationEnabled?: boolean;
    levelingEnabled?: boolean;
    [key: string]: any;
  };

  @Column({ type: 'json', nullable: true })
  disabledCommands?: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Helper methods
  public isCommandDisabled(commandName: string): boolean {
    return this.disabledCommands?.includes(commandName) || false;
  }

  public disableCommand(commandName: string): void {
    if (!this.disabledCommands) {
      this.disabledCommands = [];
    }
    if (!this.disabledCommands.includes(commandName)) {
      this.disabledCommands.push(commandName);
    }
  }

  public enableCommand(commandName: string): void {
    if (this.disabledCommands) {
      this.disabledCommands = this.disabledCommands.filter(cmd => cmd !== commandName);
    }
  }

  public getSetting(key: string): any {
    return this.settings?.[key];
  }

  public setSetting(key: string, value: any): void {
    if (!this.settings) {
      this.settings = {};
    }
    this.settings[key] = value;
  }
}