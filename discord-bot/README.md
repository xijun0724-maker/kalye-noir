# Kalye Noir Discord Bot 🤖👕

The official Discord Bot for **Kalye Noir** streetwear apparel studio.

Provides instant order alerts, staff fulfillment workflows, interactive status buttons, and slash commands.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure credentials
cp .env.example .env
# Edit .env with your DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, DISCORD_GUILD_ID, and DISCORD_CHANNEL_ID

# 3. Register Slash Commands
npm run register

# 4. Start the Bot
npm start
```

For full walkthrough on creating the bot in the Discord Developer Portal, see [discord-bot-setup.md](../docs/discord-bot-setup.md).

---

## 🛠️ Slash Commands Available

- `/order <reference>`: Search order by reference code (`KN-XXXX-XXXX`)
- `/orders [status] [limit]`: View recent orders filtered by status
- `/status <reference> <new_status>`: Manually update fulfillment status
- `/stats`: View total revenue, orders count, shirts sold, and payment ratio
- `/catalog`: Browse active streetwear catalog
- `/ping`: Latency check
