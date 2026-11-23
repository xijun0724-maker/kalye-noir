# Kalye Noir — Discord Bot Setup Guide

This guide walks you through setting up and running the official **Kalye Noir Discord Bot** for real-time order alerts, interactive staff order management, and store slash commands.

---

## 🌟 Key Features

1. **Instant Order Notifications**:
   - Order alerts arrive in your Discord channel styled with Kalye Noir's signature Registration Red (`#C8202A`).
   - Detailed breakdown: Reference number, Customer info, phone, delivery address, ordered shirts & sizes, and payment method (COD vs GCash/Maya reference).
2. **Interactive Quick-Action Buttons**:
   - Every order message includes 4 interactive status buttons:
     - `[ 📦 Pack ]`: Marks order as packed.
     - `[ 🚚 Ship ]`: Marks order as shipped/out for delivery.
     - `[ ✅ Delivered ]`: Marks order as completed and delivered.
     - `[ ❌ Cancel ]`: Marks order as cancelled.
   - Clicking a button updates the embed in-place and logs the staff member who performed the action.
3. **Admin Slash Commands**:
   - `/order <reference>`: Search order by reference code (`KN-XXXX-XXXX`).
   - `/orders [status] [limit]`: View recent orders filtered by status.
   - `/status <reference> <new_status>`: Manually update fulfillment status.
   - `/stats`: View total store revenue, orders count, shirts sold, and COD vs GCash ratio.
   - `/catalog`: Browse active streetwear catalog.
   - `/ping`: Check bot connection and latency.

---

## 🛠️ Step 1: Create Your Discord Application & Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application** (top right) and name it: `Kalye Noir Bot` (or `Kalye Noir Store`).
3. (Optional) Under **General Information**, upload the Kalye Noir logo or brand icon.
4. Copy your **Application ID** (this is your `DISCORD_CLIENT_ID`).

---

## 🤖 Step 2: Create the Bot User & Get Bot Token

1. In the left navigation menu, click **Bot**.
2. Click **Reset Token** to generate a new bot token.
3. **Copy this token immediately** and save it safely (this is your `DISCORD_BOT_TOKEN`).
4. Scroll down to **Privileged Gateway Intents**:
   - Turn **ON** `Message Content Intent` (if you plan to read custom text commands; not strictly required for slash commands).
5. Under **Bot Permissions**, make sure these permissions are enabled:
   - `Send Messages`
   - `Embed Links`
   - `Attach Files`
   - `Read Message History`
   - `Use External Emojis`

---

## 🔗 Step 3: Invite the Bot to Your Discord Server

1. In the left menu, click **OAuth2** &rarr; **URL Generator**.
2. Under **SCOPES**, check:
   - `[x] bot`
   - `[x] applications.commands`
3. Under **BOT PERMISSIONS**, check:
   - `[x] Send Messages`
   - `[x] Embed Links`
   - `[x] Attach Files`
   - `[x] Read Message History`
4. Copy the generated URL at the bottom, paste it into your browser, select your Discord server, and click **Authorize**.

---

## 🆔 Step 4: Get Server ID & Channel ID

1. Open Discord, go to **User Settings** &rarr; **Advanced** &rarr; turn **Developer Mode** ON.
2. In your Discord server:
   - Right-click your server icon in the sidebar &rarr; click **Copy Server ID** (this is your `DISCORD_GUILD_ID`).
   - Right-click the channel where you want order notifications (e.g. `#kalye-orders`) &rarr; click **Copy Channel ID** (this is your `DISCORD_CHANNEL_ID`).

---

## 🚀 Step 5: Configure and Run the Bot

1. Open a terminal in the project directory:
   ```bash
   cd discord-bot
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
4. Fill in your credentials in `discord-bot/.env`:
   ```env
   DISCORD_BOT_TOKEN=your_copied_bot_token_here
   DISCORD_CLIENT_ID=your_copied_client_id_here
   DISCORD_GUILD_ID=your_copied_guild_id_here
   DISCORD_CHANNEL_ID=your_copied_channel_id_here
   PORT=4323
   ```
5. Register the slash commands (takes 1 second when `DISCORD_GUILD_ID` is set):
   ```bash
   npm run register
   ```
6. Start the bot:
   ```bash
   npm start
   ```
   You will see:
   ```
   🤖 Kalye Noir Discord Bot online as: Kalye Noir Bot#0000
   🌐 Bot HTTP endpoint listening at http://localhost:PORT
      • GET  /health
      • POST /api/order
   ```

---

## 🔌 Step 6: Connect with Kalye Noir Storefront

In your main Kalye Noir website `.env` (or environment variables):
```env
# Point to your running Discord Bot HTTP endpoint
PUBLIC_DISCORD_BOT_SERVER_URL=https://your-bot-server-url.example.com/api/order

# OR alternatively, use a direct Discord Webhook URL:
PUBLIC_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your_webhook_id/your_webhook_token
```

Whenever a customer completes checkout on the website, the order is automatically dispatched to your Discord bot and posted in `#kalye-orders` with interactive buttons!
