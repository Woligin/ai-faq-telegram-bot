'use strict';
const test = require('node:test'); const assert = require('node:assert'); const path = require('path');
const kb = require('../src/kb'); const { createBot } = require('../src/bot');
const chunks = kb.load(path.join(__dirname, '..', 'data', 'faq.md'));

function mk(opts = {}) {
  const sent = [];
  const tg = { sendMessage: async (c, t) => { sent.push([c, t]); }, sendChatAction: async () => {} };
  return { sent, bot: createBot({ tg, chunks, ...opts }) };
}
const msg = (text, id = 1, from = 7) => ({ update_id: 1, message: { chat: { id }, from: { id: from }, text } });
delete process.env.GEMINI_API_KEY;

test('/start sends welcome', async () => { const { bot, sent } = mk(); await bot.handle(msg('/start')); assert.match(sent[0][1], /Hi!/); });
test('answers a question from the FAQ', async () => { const { bot, sent } = mk(); await bot.handle(msg('how long does delivery take')); assert.match(sent[0][1], /1 to 2/); });
test('unknown question gets a safe answer', async () => { const { bot, sent } = mk(); await bot.handle(msg('quantum physics')); assert.match(sent[0][1], /could not find/i); });
test('ignores non-text updates', async () => { const { bot, sent } = mk(); await bot.handle({ update_id: 2, message: { chat: { id: 1 }, photo: [] } }); assert.strictEqual(sent.length, 0); });
test('/stats only for the admin', async () => {
  const { bot, sent } = mk({ adminId: '42' });
  await bot.handle(msg('/stats', 1, 7)); assert.match(sent[0][1], /only for the bot owner/);
  await bot.handle(msg('delivery', 1, 42)); await bot.handle(msg('/stats', 1, 42)); assert.match(sent[2][1], /Messages: 1/);
});
test('rate limit', async () => {
  const { bot, sent } = mk({ limitPerMinute: 3, now: () => 1000 });
  for (let i = 0; i < 5; i++) await bot.handle(msg('delivery'));
  assert.match(sent[4][1], /Too many messages/); assert.strictEqual(sent.length, 5);
});
