import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { BotCommand } from '../types/Command';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong! and shows bot latency'),
  
  category: 'utility',
  cooldown: 3,
  
  async execute(interaction: ChatInputCommandInteraction) {
    const sent = await interaction.reply({ 
      content: 'Pinging...'
    }).then(() => interaction.fetchReply());
    
    const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;
    const websocketLatency = Math.round(interaction.client.ws.ping);
    
    await interaction.editReply(
      `🏓 Pong!\n` +
      `📡 Roundtrip latency: ${roundtripLatency}ms\n` +
      `💓 Websocket heartbeat: ${websocketLatency}ms`
    );
  },
};

export default command;