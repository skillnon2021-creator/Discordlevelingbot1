# Discord Leveling Bot

## Overview
A fully-featured Discord leveling bot for "YlliMorinaXD's Server" with comprehensive XP tracking, professional rank cards, leaderboards, admin commands, and automatic role rewards.

## Features
- **XP System**: Users earn 15-25 XP per message (60-second cooldown)
- **Progressive Leveling**: Level requirements increase exponentially
- **Rank Cards**: Professional, futuristic neon-themed rank cards with avatar, username, level, XP bar, and server name
- **Commands** (prefix: `<`):
  - `<rank` - Display user's rank card
  - `<leaderboard` - Show top 10 users
  - `<listrewards` - View all configured role rewards
  - `<setlevel @user <level>` - Admin only
  - `<setxp @user <xp>` - Admin only
  - `<setactivity <type> <text>` - Admin only: Change bot activity
  - `<addreward <level> <role>` - Admin only: Add role reward
  - `<removereward <level>` - Admin only: Remove role reward
  - `<help` - Display command help menu
- **Role Rewards**: Dynamic role reward system with default rewards at levels 5, 10, 15, 20, 25, 30, 50, 75, 100 (customizable per server)
- **Activity Status**: Admins can change bot activity (playing, watching, listening, competing)
- **Data Persistence**: JSON-based storage with automatic file generation
- **Error Handling**: Custom error message for invalid commands
- **Startup Reconciliation**: Automatically assigns missing role rewards on bot restart

## Architecture
- **Single File**: All logic contained in `bot.js`
- **Canvas-based Graphics**: Professional rank card generation using node-canvas
- **Discord.js v14**: Modern Discord API integration
- **Event-driven**: Handles messages, level-ups, and new members

## Configuration
- Prefix: `<`
- XP per message: 15-25 (randomized)
- XP cooldown: 60 seconds
- Data file: `leveling_data.json`
- Default role rewards defined in `DEFAULT_ROLE_REWARDS` constant
- Per-server role rewards and bot activity stored in JSON
- Data structure supports multiple servers with independent configurations

## Setup Requirements
1. Discord bot token (stored in DISCORD_BOT_TOKEN environment variable)
2. Create default reward roles in Discord server (Level 5, Level 10, etc.) or use `<addreward` command to configure custom role rewards
3. Bot needs Administrator or Manage Roles permission to assign role rewards

## Recent Changes
- 2025-11-13: Added admin commands for role reward management (<addreward, <removereward, <listrewards)
- 2025-11-13: Added admin command for bot activity status customization (<setactivity)
- 2025-11-13: Implemented dynamic per-server role reward configuration with JSON persistence
- 2025-11-13: Fixed getLevelFromXp calculation and added startup role reconciliation
- 2025-11-13: Initial bot creation with all core features implemented

## Tech Stack
- Node.js 20
- discord.js 14.24.2
- canvas 3.2.0
