import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  discordId!: string;

  @Column()
  username!: string;

  @Column({ nullable: true })
  displayName?: string;

  @Column({ default: 0 })
  level!: number;

  @Column({ default: 0 })
  experience!: number;

  @Column({ default: 0 })
  coins!: number;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Helper methods
  public addExperience(amount: number): void {
    this.experience += amount;
    
    // Simple level calculation (every 100 XP = 1 level)
    const newLevel = Math.floor(this.experience / 100);
    if (newLevel > this.level) {
      this.level = newLevel;
    }
  }

  public addCoins(amount: number): void {
    this.coins += amount;
  }

  public canAfford(amount: number): boolean {
    return this.coins >= amount;
  }

  public spendCoins(amount: number): boolean {
    if (this.canAfford(amount)) {
      this.coins -= amount;
      return true;
    }
    return false;
  }
}