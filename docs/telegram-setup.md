# Telegram Bot Setup (Kalye Noir Orders)

The Cloudflare Worker posts every order request to a Telegram chat via the
Bot API. One-time setup: create the bot, get the chat ID, then set two
secrets on the Worker.

## 1. Create the bot

1. Message **@BotFather** on Telegram.
2. Send `/newbot`.
3. Name it `Kalye Noir Orders`.
4. Username: `kalyenoir_orders_bot` (or the next available variant).
5. Copy the **BOT_TOKEN** from BotFather's reply. It looks like
   `123456789:AAE...`. Keep it private — never commit it.

## 2. Get the chat ID

1. Add the bot to a private channel/group, or DM it (send `/start`).
2. Send any message to the bot in that chat.
3. Visit:

   ```
   https://api.telegram.org/bot<BOT_TOKEN>/getUpdates
   ```

4. Find `"chat":{"id":<CHAT_ID>}` in the response. Copy **CHAT_ID**
   (a group/chat id is often negative, e.g. `-1001234567890` — copy the
   whole value).

## 3. Test the bot

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/sendMessage" ^
  -d "chat_id=<CHAT_ID>" ^
  -d "text=Test from Kalye Noir"
```

A test message should arrive in the target chat.

## 4. Set Worker secrets and deploy

From `worker/`:

```bash
npx wrangler login
npx wrangler secret put BOT_TOKEN   # paste the BotFather token
npx wrangler secret put CHAT_ID     # paste the chat id
npx wrangler deploy
```

Record the deployed URL (e.g.
`https://kalye-noir-orders.<subdomain>.workers.dev`).

## 5. Point the site at the Worker

Set the full endpoint in Netlify site settings (and in a local `.env` for
development):

```
WORKER_SUBMIT_ORDER_URL=https://kalye-noir-orders.<subdomain>.workers.dev/api/submit-order
```

`src/config/worker.ts` falls back to the same value when the env var is
absent.

## 6. End-to-end check

```bash
curl -X POST "https://<worker-url>/api/submit-order" ^
  -F "name=Test User" -F "email=test@example.com" ^
  -F "phone=09171234567" -F "street=123 Test St" ^
  -F "city=Manila" -F "province=Manila" -F "zip=1000" ^
  -F "payment-type=cod" -F "payment-ref=" ^
  -F "cart-items=[{\"sku\":\"kalyenoir-tee-m\",\"qty\":1}]"
```

Expected: a `303` redirect to `/cart?success=1&ref=...` and the order
message arriving in the Telegram chat.
