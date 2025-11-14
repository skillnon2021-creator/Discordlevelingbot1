const express = require('express')
const app = express()
const port = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
const { Client, GatewayIntentBits, EmbedBuilder, AttachmentBuilder, PermissionFlagsBits, ActivityType } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

const PREFIX = '<';
const DATA_FILE = './leveling_data.json';

const DEFAULT_ROLE_REWARDS = {
    5: 'Level 5',
    10: 'Level 10',
    15: 'Level 15',
    20: 'Level 20',
    25: 'Level 25',
    30: 'Level 30',
    50: 'Level 50',
    75: 'Level 75',
    100: 'Level 100'
};

const XP_PER_MESSAGE_MIN = 15;
const XP_PER_MESSAGE_MAX = 25;
const XP_COOLDOWN = 60000;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

let userData = {};
const cooldowns = new Map();

function loadData() {
    if (fs.existsSync(DATA_FILE)) {
        try {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            userData = JSON.parse(data);
            migrateData();
        } catch (err) {
            console.error('Error loading data:', err);
            userData = {};
        }
    } else {
        userData = {};
        saveData();
    }
}

function migrateData() {
    let needsSave = false;
    
    for (const guildId in userData) {
        const guildData = userData[guildId];
        
        if (!guildData.users && !guildData.roleRewards && !guildData.botActivity) {
            console.log(`Migrating legacy data structure for guild ${guildId}...`);
            const legacyUsers = { ...guildData };
            
            userData[guildId] = {
                users: legacyUsers,
                roleRewards: { ...DEFAULT_ROLE_REWARDS },
                botActivity: null
            };
            needsSave = true;
        }
    }
    
    if (needsSave) {
        saveData();
        console.log('✅ Data migration complete');
    }
}

function saveData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(userData, null, 2), 'utf8');
    } catch (err) {
        console.error('Error saving data:', err);
    }
}

function getUser(userId, guildId) {
    if (!userData[guildId]) {
        userData[guildId] = {
            users: {},
            roleRewards: { ...DEFAULT_ROLE_REWARDS },
            botActivity: null
        };
    }
    if (!userData[guildId].users) userData[guildId].users = {};
    if (!userData[guildId].roleRewards) userData[guildId].roleRewards = { ...DEFAULT_ROLE_REWARDS };
    if (!userData[guildId].botActivity) userData[guildId].botActivity = null;
    
    if (!userData[guildId].users[userId]) {
        userData[guildId].users[userId] = {
            xp: 0,
            level: 0,
            totalXp: 0
        };
    }
    return userData[guildId].users[userId];
}

function getRoleRewards(guildId) {
    if (!userData[guildId]) {
        userData[guildId] = {
            users: {},
            roleRewards: { ...DEFAULT_ROLE_REWARDS },
            botActivity: null
        };
    }
    if (!userData[guildId].roleRewards) {
        userData[guildId].roleRewards = { ...DEFAULT_ROLE_REWARDS };
    }
    return userData[guildId].roleRewards;
}

function setRoleReward(guildId, level, roleName) {
    if (!userData[guildId]) {
        userData[guildId] = {
            users: {},
            roleRewards: {},
            botActivity: null
        };
    }
    userData[guildId].roleRewards[level] = roleName;
    saveData();
}

function removeRoleReward(guildId, level) {
    if (userData[guildId] && userData[guildId].roleRewards) {
        delete userData[guildId].roleRewards[level];
        saveData();
        return true;
    }
    return false;
}

function calculateLevelXp(level) {
    return Math.floor(100 * Math.pow(level + 1, 1.5));
}

function getLevelFromXp(totalXp) {
    let level = 0;
    let xpAccumulated = 0;
    
    while (true) {
        const xpForNextLevel = calculateLevelXp(level);
        if (xpAccumulated + xpForNextLevel > totalXp) {
            break;
        }
        xpAccumulated += xpForNextLevel;
        level++;
    }
    
    return level;
}

function addXp(userId, guildId, amount) {
    const user = getUser(userId, guildId);
    const oldLevel = user.level;
    
    user.totalXp += amount;
    user.xp += amount;
    
    const xpNeeded = calculateLevelXp(user.level);
    
    if (user.xp >= xpNeeded) {
        user.level++;
        user.xp = user.xp - xpNeeded;
        saveData();
        return { leveledUp: true, newLevel: user.level, oldLevel };
    }
    
    saveData();
    return { leveledUp: false, newLevel: user.level, oldLevel };
}

async function generateRankCard(member, userData, guildName) {
    const canvas = createCanvas(934, 282);
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0f0f23');
    gradient.addColorStop(0.5, '#1a1a3e');
    gradient.addColorStop(1, '#0f0f23');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ffff';
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    ctx.shadowBlur = 0;
    
    const accentGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    accentGradient.addColorStop(0, '#ff00ff');
    accentGradient.addColorStop(0.5, '#00ffff');
    accentGradient.addColorStop(1, '#ff00ff');
    ctx.fillStyle = accentGradient;
    ctx.fillRect(20, 20, canvas.width - 40, 6);
    
    try {
        const avatar = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 256 }));
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(141, 141, 100, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 41, 41, 200, 200);
        ctx.restore();
        
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 6;
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#00ffff';
        ctx.beginPath();
        ctx.arc(141, 141, 103, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
    } catch (err) {
        console.error('Error loading avatar:', err);
    }
    
    ctx.font = 'bold 42px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ffff';
    ctx.fillText(member.user.username, 270, 90);
    ctx.shadowBlur = 0;
    
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#00ffff';
    ctx.fillText(guildName, 270, 125);
    
    const xpNeeded = calculateLevelXp(userData.level);
    const progressPercent = (userData.xp / xpNeeded) * 100;
    
    ctx.fillStyle = '#2a2a4e';
    ctx.fillRect(270, 160, 620, 35);
    
    const barGradient = ctx.createLinearGradient(270, 0, 890, 0);
    barGradient.addColorStop(0, '#ff00ff');
    barGradient.addColorStop(0.5, '#00ffff');
    barGradient.addColorStop(1, '#ff00ff');
    ctx.fillStyle = barGradient;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00ffff';
    ctx.fillRect(270, 160, (620 * progressPercent) / 100, 35);
    ctx.shadowBlur = 0;
    
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(270, 160, 620, 35);
    
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${userData.xp} / ${xpNeeded} XP`, 580, 183);
    
    ctx.textAlign = 'left';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#ff00ff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff00ff';
    ctx.fillText(`LEVEL ${userData.level}`, 270, 240);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#00ffff';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Total XP: ${userData.totalXp}`, 500, 240);
    
    return canvas.toBuffer();
}

async function checkAndAssignRoles(member, level) {
    const guild = member.guild;
    const roleRewards = getRoleRewards(guild.id);
    
    for (const [requiredLevel, roleName] of Object.entries(roleRewards)) {
        if (level >= parseInt(requiredLevel)) {
            const role = guild.roles.cache.find(r => r.name === roleName);
            
            if (role && !member.roles.cache.has(role.id)) {
                try {
                    await member.roles.add(role);
                    console.log(`Assigned role ${roleName} to ${member.user.username}`);
                } catch (err) {
                    console.error(`Failed to assign role ${roleName}:`, err);
                }
            }
        }
    }
}

client.once('ready', async () => {
    console.log(`✅ Bot is online as ${client.user.tag}`);
    console.log(`📊 Serving ${client.guilds.cache.size} server(s)`);
    console.log(`🎮 Prefix: ${PREFIX}`);
    loadData();
    
    for (const guild of client.guilds.cache.values()) {
        const guildData = userData[guild.id];
        if (guildData && guildData.botActivity) {
            const activityTypes = {
                'playing': ActivityType.Playing,
                'watching': ActivityType.Watching,
                'listening': ActivityType.Listening,
                'competing': ActivityType.Competing
            };
            
            try {
                client.user.setActivity(guildData.botActivity.text, { type: activityTypes[guildData.botActivity.type] });
                console.log(`🎮 Restored activity: ${guildData.botActivity.type} ${guildData.botActivity.text}`);
                break;
            } catch (err) {
                console.error('Failed to restore bot activity:', err.message);
            }
        }
    }
    
    console.log('🔄 Reconciling role rewards...');
    for (const guild of client.guilds.cache.values()) {
        const guildData = userData[guild.id];
        if (!guildData || !guildData.users) continue;
        
        for (const [userId, user] of Object.entries(guildData.users)) {
            try {
                const member = await guild.members.fetch(userId);
                await checkAndAssignRoles(member, user.level);
            } catch (err) {
                console.error(`Failed to reconcile roles for user ${userId}:`, err.message);
            }
        }
    }
    console.log('✅ Role reconciliation complete');
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.guild) return;
    
    const now = Date.now();
    const cooldownKey = `${message.guild.id}-${message.author.id}`;
    
    if (!message.content.startsWith(PREFIX)) {
        if (!cooldowns.has(cooldownKey) || now - cooldowns.get(cooldownKey) >= XP_COOLDOWN) {
            const xpGained = Math.floor(Math.random() * (XP_PER_MESSAGE_MAX - XP_PER_MESSAGE_MIN + 1)) + XP_PER_MESSAGE_MIN;
            const result = addXp(message.author.id, message.guild.id, xpGained);
            cooldowns.set(cooldownKey, now);
            
            if (result.leveledUp) {
                try {
                    const member = await message.guild.members.fetch(message.author.id);
                    const user = getUser(message.author.id, message.guild.id);
                    
                    const cardBuffer = await generateRankCard(member, user, message.guild.name);
                    const attachment = new AttachmentBuilder(cardBuffer, { name: 'levelup.png' });
                    
                    const levelUpEmbed = new EmbedBuilder()
                        .setColor('#00ffff')
                        .setTitle('🎉 LEVEL UP!')
                        .setDescription(`**${message.author.username}** reached **Level ${result.newLevel}**!`)
                        .setImage('attachment://levelup.png')
                        .setTimestamp();
                    
                    await message.channel.send({ embeds: [levelUpEmbed], files: [attachment] });
                    
                    await checkAndAssignRoles(member, result.newLevel);
                } catch (err) {
                    console.error('Error sending level up message:', err);
                }
            }
        }
        return;
    }
    
    const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
    const command = args.shift().toLowerCase();
    
    if (command === 'rank') {
        try {
            let targetUser = message.mentions.users.first() || message.author;
            const member = await message.guild.members.fetch(targetUser.id);
            const user = getUser(targetUser.id, message.guild.id);
            
            const cardBuffer = await generateRankCard(member, user, message.guild.name);
            const attachment = new AttachmentBuilder(cardBuffer, { name: 'rank.png' });
            
            await message.reply({ files: [attachment] });
        } catch (err) {
            console.error('Error generating rank card:', err);
            await message.reply('❌ An error occurred while generating the rank card.');
        }
    }
    else if (command === 'leaderboard') {
        try {
            const guildData = userData[message.guild.id];
            const users = guildData?.users || {};
            const sorted = Object.entries(users)
                .map(([userId, data]) => ({ userId, ...data }))
                .sort((a, b) => b.totalXp - a.totalXp)
                .slice(0, 10);
            
            if (sorted.length === 0) {
                return message.reply('📊 No users have earned XP yet!');
            }
            
            let description = '';
            for (let i = 0; i < sorted.length; i++) {
                const userEntry = sorted[i];
                try {
                    const user = await client.users.fetch(userEntry.userId);
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
                    description += `${medal} **${user.username}** - Level ${userEntry.level} (${userEntry.totalXp} XP)\n`;
                } catch (err) {
                    console.error('Error fetching user:', err);
                }
            }
            
            const leaderboardEmbed = new EmbedBuilder()
                .setColor('#ff00ff')
                .setTitle('🏆 LEADERBOARD')
                .setDescription(description)
                .setFooter({ text: message.guild.name })
                .setTimestamp();
            
            await message.reply({ embeds: [leaderboardEmbed] });
        } catch (err) {
            console.error('Error generating leaderboard:', err);
            await message.reply('❌ An error occurred while generating the leaderboard.');
        }
    }
    else if (command === 'setlevel') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ You need Administrator permissions to use this command.');
        }
        
        const targetUser = message.mentions.users.first();
        const level = parseInt(args[1]);
        
        if (!targetUser || isNaN(level) || level < 0) {
            return message.reply('❌ Usage: `<setlevel @user <level>`');
        }
        
        const user = getUser(targetUser.id, message.guild.id);
        user.level = level;
        user.xp = 0;
        
        let totalXp = 0;
        for (let i = 0; i < level; i++) {
            totalXp += calculateLevelXp(i);
        }
        user.totalXp = totalXp;
        
        saveData();
        
        try {
            const member = await message.guild.members.fetch(targetUser.id);
            await checkAndAssignRoles(member, level);
        } catch (err) {
            console.error('Error checking roles:', err);
        }
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription(`✅ Set **${targetUser.username}**'s level to **${level}**`)
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
    else if (command === 'setxp') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ You need Administrator permissions to use this command.');
        }
        
        const targetUser = message.mentions.users.first();
        const xp = parseInt(args[1]);
        
        if (!targetUser || isNaN(xp) || xp < 0) {
            return message.reply('❌ Usage: `<setxp @user <xp>`');
        }
        
        const user = getUser(targetUser.id, message.guild.id);
        user.totalXp = xp;
        
        const newLevel = getLevelFromXp(xp);
        user.level = newLevel;
        
        let xpUsed = 0;
        for (let i = 0; i < newLevel; i++) {
            xpUsed += calculateLevelXp(i);
        }
        user.xp = xp - xpUsed;
        
        saveData();
        
        try {
            const member = await message.guild.members.fetch(targetUser.id);
            await checkAndAssignRoles(member, newLevel);
        } catch (err) {
            console.error('Error checking roles:', err);
        }
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription(`✅ Set **${targetUser.username}**'s XP to **${xp}** (Level ${newLevel})`)
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
    else if (command === 'setactivity') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ You need Administrator permissions to use this command.');
        }
        
        const type = args[0]?.toLowerCase();
        const text = args.slice(1).join(' ');
        
        if (!type || !text) {
            return message.reply('❌ Usage: `<setactivity <playing|watching|listening|competing> <text>`');
        }
        
        const activityTypes = {
            'playing': ActivityType.Playing,
            'watching': ActivityType.Watching,
            'listening': ActivityType.Listening,
            'competing': ActivityType.Competing
        };
        
        if (!activityTypes[type]) {
            return message.reply('❌ Invalid activity type! Use: playing, watching, listening, or competing');
        }
        
        try {
            client.user.setActivity(text, { type: activityTypes[type] });
            
            if (!userData[message.guild.id]) userData[message.guild.id] = { users: {}, roleRewards: {}, botActivity: null };
            userData[message.guild.id].botActivity = { type, text };
            saveData();
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setDescription(`✅ Bot activity set to **${type} ${text}**`)
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
        } catch (err) {
            console.error('Error setting activity:', err);
            await message.reply('❌ Failed to set activity.');
        }
    }
    else if (command === 'addreward') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ You need Administrator permissions to use this command.');
        }
        
        const level = parseInt(args[0]);
        const roleName = args.slice(1).join(' ');
        
        if (isNaN(level) || level < 1 || !roleName) {
            return message.reply('❌ Usage: `<addreward <level> <role name>`');
        }
        
        const role = message.guild.roles.cache.find(r => r.name === roleName);
        if (!role) {
            return message.reply(`❌ Role **${roleName}** not found! Please create it first.`);
        }
        
        setRoleReward(message.guild.id, level, roleName);
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setDescription(`✅ Added reward: **${roleName}** role at level **${level}**`)
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
    else if (command === 'removereward') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ You need Administrator permissions to use this command.');
        }
        
        const level = parseInt(args[0]);
        
        if (isNaN(level) || level < 1) {
            return message.reply('❌ Usage: `<removereward <level>`');
        }
        
        const success = removeRoleReward(message.guild.id, level);
        
        if (success) {
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setDescription(`✅ Removed role reward at level **${level}**`)
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
        } else {
            await message.reply(`❌ No role reward found at level **${level}**`);
        }
    }
    else if (command === 'listrewards') {
        const roleRewards = getRoleRewards(message.guild.id);
        
        if (Object.keys(roleRewards).length === 0) {
            return message.reply('📋 No role rewards configured yet!');
        }
        
        const sortedRewards = Object.entries(roleRewards)
            .sort(([a], [b]) => parseInt(a) - parseInt(b));
        
        let description = '';
        for (const [level, roleName] of sortedRewards) {
            description += `**Level ${level}** → ${roleName}\n`;
        }
        
        const embed = new EmbedBuilder()
            .setColor('#ff00ff')
            .setTitle('🎁 ROLE REWARDS')
            .setDescription(description)
            .setFooter({ text: 'Admin: Use <addreward and <removereward to manage' })
            .setTimestamp();
        
        await message.reply({ embeds: [embed] });
    }
    else if (command === 'help') {
        const helpEmbed = new EmbedBuilder()
            .setColor('#00ffff')
            .setTitle('🤖 BOT COMMANDS')
            .setDescription('Here are all available commands:')
            .addFields(
                { name: '📊 `<rank`', value: 'Display your rank card with level, XP, and progress', inline: false },
                { name: '🏆 `<leaderboard`', value: 'View the top 10 users by total XP', inline: false },
                { name: '🎁 `<listrewards`', value: 'View all role rewards and their levels', inline: false },
                { name: '⚙️ `<setlevel @user <level>`', value: 'Set a user\'s level (Admin only)', inline: false },
                { name: '⚙️ `<setxp @user <xp>`', value: 'Set a user\'s total XP (Admin only)', inline: false },
                { name: '🎮 `<setactivity <type> <text>`', value: 'Change bot activity status (Admin only)', inline: false },
                { name: '🎁 `<addreward <level> <role>`', value: 'Add a role reward for a level (Admin only)', inline: false },
                { name: '🗑️ `<removereward <level>`', value: 'Remove a role reward (Admin only)', inline: false },
                { name: '❓ `<help`', value: 'Display this help menu', inline: false }
            )
            .setFooter({ text: 'Leveling System | Earn XP by chatting!' })
            .setTimestamp();
        
        await message.reply({ embeds: [helpEmbed] });
    }
    else {
        await message.reply('**This Is Not A Bot Command 🙂**');
    }
});

client.on('guildMemberAdd', async (member) => {
    const user = getUser(member.id, member.guild.id);
    await checkAndAssignRoles(member, user.level);
});

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
    console.error('❌ DISCORD_BOT_TOKEN not found in environment variables!');
    console.error('Please set up your Discord bot token.');
    process.exit(1);
}

client.login(token).catch(err => {
    console.error('❌ Failed to login:', err);
    process.exit(1);
});
