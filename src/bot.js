'use strict';
const fs = require('fs');
const path = require('path');

(function loadEnv() {
  try {
    for (const line of fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch (_) { /* no .env */ }
})();

const kb = require('./kb');
const ai = require('./ai');
const { api } = require('./telegram');

const WELCOME = 'Hi! I answer questions about our shop: opening hours, delivery, returns, payment and contacts. Just write your question.';

function createBot({ tg, chunks, adminId = '', limitPerMinute = 10, now = () => Date.now() }) {
  const hist = new Map();      // chat id -> recent turns
  const hits = new Map();      // chat id -> timestamps
  const stats = { messages: 0, ai: 0, rules: 0, unknown: 0 };

  function limited(chat) {
    const t = now(); const arr = (hits.get(chat) || []).filter(x => t - x < 60000);
    arr.push(t); hits.set(chat, arr);
    return arr.length > limitPerMinute;
  }

  async function handle(update) {
    const m = update && update.message;
    if (!m || typeof m.text !== 'string') return;
    const chat = m.chat.id; const text = m.text.trim().slice(0, 500);
    if (!text) return;
    if (text === '/start' || text === '/help') return tg.sendMessage(chat, WELCOME);
    if (text === '/stats') {
      if (adminId && String(m.from && m.from.id) === String(adminId)) {
        return tg.sendMessage(chat, `Messages: ${stats.messages}\nAI answers: ${stats.ai}\nKeyword answers: ${stats.rules}\nNot found: ${stats.unknown}`);
      }
      return tg.sendMessage(chat, 'This command is only for the bot owner.');
    }
    if (limited(chat)) return tg.sendMessage(chat, 'Too many messages. Please wait a minute.');
    stats.messages++;
    await tg.sendChatAction(chat, 'typing');
    const found = kb.search(chunks, text);
    const res = await ai.answer(text, found, hist.get(chat) || []);
    if (!found.length) stats.unknown++; else if (res.source === 'ai') stats.ai++; else stats.rules++;
    const h = hist.get(chat) || []; h.push({ role: 'user', text }, { role: 'bot', text: res.text }); hist.set(chat, h.slice(-6));
    return tg.sendMessage(chat, res.text);
  }

  return { handle, stats };
}

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) { console.error('Set TELEGRAM_BOT_TOKEN in .env (get it from @BotFather).'); process.exit(1); }
  const tg = api(token);
  const bot = createBot({ tg, chunks: kb.load(path.join(__dirname, '..', 'data', 'faq.md')), adminId: process.env.ADMIN_ID || '' });
  console.log(`Bot started. AI: ${ai.enabled() ? 'gemini' : 'off (keyword answers)'}. Press Ctrl+C to stop.`);
  let offset = 0;
  for (;;) {
    try {
      const updates = await tg.getUpdates(offset);
      for (const u of updates) {
        offset = u.update_id + 1;
        try { await bot.handle(u); } catch (e) { console.error('handle error:', e.message); }
      }
    } catch (e) {
      console.error('poll error:', e.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

if (require.main === module) main();
module.exports = { createBot };
