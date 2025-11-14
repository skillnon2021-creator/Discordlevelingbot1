# Discord Leveling Bot

A fully-featured Discord leveling bot with XP tracking, professional rank cards, leaderboards, admin commands, and automatic role rewards.

## Features

### 🎮 Leveling System
- Users earn **15-25 XP** per message (randomized)
- 60-second cooldown between XP gains
- Progressive level scaling (harder to level up as you progress)
- Automatic level-up notifications with custom rank cards

### 🎨 Professional Rank Cards
- Futuristic neon-themed design
- Displays username, avatar, level, XP progress bar
- Server name and total XP
- Generated on-the-fly using Canvas

### 📊 Commands (Prefix: `<`)
| Command | Description | Permission |
|---------|-------------|------------|
| `<rank` | Display your rank card | Everyone |
| `<rank @user` | Display another user's rank card | Everyone |
| `<leaderboard` | Show top 10 users by XP | Everyone |
| `<listrewards` | View all configured role rewards | Everyone |
| `<setlevel @user <level>` | Set a user's level | Admin only |
| `<setxp @user <xp>` | Set a user's total XP | Admin only |
| `<setactivity <type> <text>` | Change bot activity status | Admin only |
| `<addreward <level> <role>` | Add a role reward for a level | Admin only |
| `<removereward <level>` | Remove a role reward | Admin only |
| `<help` | Display command help menu | Everyone |

**Activity Types:** playing, watching, listening, competing

### 🏆 Role Rewards
Automatically assigns roles when users reach specific levels. The bot comes with default rewards:
- Level 5 → "Level 5" role
- Level 10 → "Level 10" role
- Level 15 → "Level 15" role
- Level 20 → "Level 20" role
- Level 25 → "Level 25" role
- Level 30 → "Level 30" role
- Level 50 → "Level 50" role
- Level 75 → "Level 75" role
- Level 100 → "Level 100" role

**Admins can now customize role rewards!** Use `<addreward` and `<removereward` commands to manage rewards for your server.

**Note:** Make sure the roles exist in your server and the bot's role is positioned ABOVE the reward roles in the hierarchy.

## Setup Instructions

### 1. Create a Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" tab and click "Add Bot"
4. Under "Privileged Gateway Intents", enable:
   - ✅ Presence Intent
   - ✅ Server Members Intent
   - ✅ Message Content Intent
5. Click "Reset Token" and copy your bot token (you'll need this in step 3)

### 2. Invite Bot to Your Server

1. Go to "OAuth2" → "URL Generator"
2. Select scopes:
   - ✅ bot
3. Select bot permissions:
   - ✅ Administrator (or at minimum: Manage Roles, Send Messages, Attach Files, Read Messages)
4. Copy the generated URL and open it in your browser
5. Select your server and authorize the bot

### 3. Configure Bot Token in Replit

When you run the bot, you'll be prompted to add your `DISCORD_BOT_TOKEN`. Paste the token you copied in step 1.5.

### 4. Create Reward Roles

In your Discord server, create the following roles (exact names):
- Level 5
- Level 10
- Level 15
- Level 20
- Level 25
- Level 30
- Level 50
- Level 75
- Level 100

**Important:** Make sure the bot's role is positioned ABOVE the reward roles in your server's role hierarchy, or it won't be able to assign them.

### 5. Run the Bot

The bot will automatically start when you run this Repl. You should see:
```
✅ Bot is online as YourBotName#1234
📊 Serving 1 server(s)
🎮 Prefix: <
```

## Usage

Once the bot is running in your server:

1. **Earn XP**: Simply chat in any text channel
2. **Check rank**: Type `<rank` to see your progress
3. **View leaderboard**: Type `<leaderboard` to see top users
4. **Get help**: Type `<help` for all commands

## Customization

### Change XP Values (requires editing `bot.js`)
```javascript
const XP_PER_MESSAGE_MIN = 15;  // Minimum XP per message
const XP_PER_MESSAGE_MAX = 25;  // Maximum XP per message
const XP_COOLDOWN = 60000;      // Cooldown in milliseconds (60000 = 1 minute)
```

### Modify Default Role Rewards (requires editing `bot.js`)
```javascript
const DEFAULT_ROLE_REWARDS = {
    5: 'Level 5',
    10: 'Level 10',
    // Add or modify default levels and role names
};
```
**Note:** You can also customize role rewards per server using the `<addreward` and `<removereward` commands without editing code!

### Change Command Prefix (requires editing `bot.js`)
```javascript
const PREFIX = '<';  // Change to any prefix you want
```

### Change Bot Activity (no code editing required!)
Use the `<setactivity` command as an admin:
```
<setactivity playing with Discord API
<setactivity watching the server
<setactivity listening to your commands
<setactivity competing in rankings
```

## Data Storage

User data is stored in `leveling_data.json` which is automatically created and updated. The file structure:
```json
{
  "guildId": {
    "users": {
      "userId": {
        "xp": 50,
        "level": 2,
        "totalXp": 350
      }
    },
    "roleRewards": {
      "5": "Level 5",
      "10": "Level 10"
    },
    "botActivity": {
      "type": "playing",
      "text": "with Discord API"
    }
  }
}
```

## Error Handling

- Invalid commands receive: **This Is Not A Bot Command 🙂**
- Admin commands check for Administrator permission
- Role assignment failures are logged but don't stop the bot
- Data is safely saved after every XP/level change

## Technical Details

- **Single File Architecture**: All logic in `bot.js`
- **Discord.js v14**: Modern Discord API
- **Canvas**: Professional image generation
- **JSON Storage**: No database required
- **Event-Driven**: Handles messages, level-ups, and member joins

## Troubleshooting

**Bot not responding to commands:**
- Verify the bot is online (check console)
- Ensure Message Content Intent is enabled
- Check that the bot has permission to send messages

**Roles not being assigned:**
- Use `<listrewards` to see configured role rewards for your server
- Verify the roles exist in your server with exact names
- Check bot's role is above reward roles in hierarchy
- Ensure bot has "Manage Roles" permission

**Rank cards not showing:**
- This may indicate a Canvas/image rendering issue
- Check console for error messages
- Verify all system dependencies are installed

## Support

For issues or questions, check:
1. Console logs for error messages
2. Discord Developer Portal for bot status
3. Server role hierarchy and permissions

## License

ISC
