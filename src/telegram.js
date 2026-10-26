'use strict';
// Minimal Telegram Bot API client (long polling), no dependencies.
function api(token) {
  const base = (process.env.TELEGRAM_API_BASE || 'https://api.telegram.org').replace(/\/$/, '');
  async function call(method, params = {}, timeoutMs = 15000) {
    const r = await fetch(`${base}/bot${token}/${method}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params), signal: AbortSignal.timeout(timeoutMs),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(`telegram ${method} failed: HTTP ${r.status} ${j.description || ''}`.trim());
    return j.result;
  }
  return {
    getUpdates: (offset, timeout = 25) => call('getUpdates', { offset, timeout, allowed_updates: ['message'] }, (timeout + 10) * 1000),
    sendMessage: (chat_id, text) => call('sendMessage', { chat_id, text: String(text).slice(0, 4000) }),
    sendChatAction: (chat_id, action = 'typing') => call('sendChatAction', { chat_id, action }).catch(() => {}),
  };
}
module.exports = { api };
