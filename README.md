# FouQ-Bot

A professional Discord bot built with TypeScript, featuring flexible database support (MySQL/SQLite).

## Features

- 🚀 Built with TypeScript for type safety
- 🗄️ Flexible database support (MySQL primary, SQLite fallback)
- 🔧 Modular command system with **dual command support**
- 💬 **Slash Commands** (`/ping`) and **Prefix Commands** (`!ping`)
- 📝 Event-driven architecture
- 🛡️ Error handling and logging
- 🔄 Auto-reconnection and resilience
- ⚡ **Sharding support** for high scalability
- 🔀 **Multi-process architecture** for better performance
- ⚙️ **Customizable prefix** per server

## Prerequisites

- Node.js 18+ 
- npm or yarn
- MySQL (optional, SQLite will be used as fallback)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd FouQ-Bot
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
```
Edit `.env` file with your Discord bot token and database configuration.

4. Build the project:
```bash
npm run build
```

## Usage
### Development

**Single Process (No Sharding):**
```bash
npm run dev
```

**With Sharding:**
```bash
npm run dev:shard
```

### Production

**Single Process (No Sharding):**
```bash
npm run build
npm start
```

**With Sharding:**
```bash
npm run build
npm run start:shard
```

### Watch mode (auto-rebuild)
```bash
npm run watch
```

## Configuration

### Environment Variables

```
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here

# Bot Owner Configuration
OWNER_ID=your_discord_user_id_here

# Database (Optional - will use SQLite if not provided)
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=fouq_bot

# Bot Configuration
BOT_PREFIX=!

# Sharding Configuration (Optional)
SHARD_COUNT=auto
SHARDS_PER_CLUSTER=1
```

**Important Configuration Notes:**
- `OWNER_ID`: Your Discord User ID (required for owner-only commands like `/shards`)
  - To get your Discord User ID: Enable Developer Mode in Discord Settings > Advanced > Developer Mode
  - Right-click your username and select "Copy User ID"
- `GUILD_ID`: Optional - for faster command registration during development

The bot will automatically:
- Connect to MySQL if credentials are provided, otherwise use SQLite
- Create necessary database tables
- Register slash commands
- Start listening for events

### Database Support

1. **MySQL (Primary)**: Recommended for production
2. **SQLite (Fallback)**: Automatically used if MySQL is unavailable

## Sharding Configuration

Sharding is useful when your bot serves many guilds (2000+) or you want to distribute load across multiple processes.

### Environment Variables for Sharding

- `SHARD_COUNT`: Number of shards to spawn
  - `auto`: Let Discord.js determine the optimal count (recommended)
  - `number`: Specific number of shards (e.g., `4`)
  - Default: `auto`

- `SHARDS_PER_CLUSTER`: Number of shards per cluster/process
  - Default: `1` (one shard per process)
  - Higher values use less memory but reduce fault tolerance

### When to Use Sharding

- **Large bots**: 2000+ guilds or approaching rate limits
- **High availability**: Fault tolerance (if one shard crashes, others continue)
- **Performance**: Distribute CPU load across multiple processes
- **Memory management**: Each shard uses separate memory space

### Sharding vs Single Process

| Feature | Single Process | Sharding |
|---------|----------------|----------|
| **Setup** | Simple | More complex |
| **Memory Usage** | Lower | Higher (multiple processes) |
| **Fault Tolerance** | Single point of failure | High availability |
| **Performance** | Good for small/medium bots | Better for large bots |
| **Debugging** | Easier | More complex |
| **Recommended for** | <2000 guilds | 2000+ guilds |

## Project Structure

```
src/
├── commands/          # Bot commands
├── events/            # Discord events
├── database/          # Database configuration and entities
├── services/          # Business logic services
├── utils/             # Utility functions
├── types/             # TypeScript type definitions
├── index.ts           # Bot entry point (single process)
└── shard.ts           # Sharding manager entry point
```

## Command Usage

FouQ-Bot supports both **Slash Commands** and **Prefix Commands**:

### Slash Commands
```
/ping                    # Check bot latency
/info                    # Show bot information
/help                    # Show all commands
/help ping               # Get help for specific command
/prefix set !            # Set server prefix
/prefix show             # Show current prefix
```

### Prefix Commands
```
!ping                    # Check bot latency (using default prefix)
!info                    # Show bot information
!help                    # Show all commands
!help ping               # Get help for specific command
```

**Note:** The prefix can be customized per server using `/prefix set <new_prefix>` or `!prefix set <new_prefix>`

## Adding Commands

1. Create a new file in `src/commands/`
2. Export a command object with `data` and `execute` properties
3. The command will be automatically loaded and work with both slash and prefix formats

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.