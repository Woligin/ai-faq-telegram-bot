# AI FAQ Telegram Bot

A Telegram bot that answers questions from **your own text** (a FAQ file) using Google Gemini, and keeps working when the AI is unavailable. Node.js 18+, no dependencies.

## What it does
- You write your information in `data/faq.md` (sections starting with `# Title`).
- A user asks a question in plain words, in any language.
- The bot finds the most relevant sections and asks Gemini to answer **only from them**. If the answer is not there, it says so instead of inventing one.
- If Gemini is busy, retired or the key is missing, it tries other Gemini models, then falls back to a plain keyword answer. The bot never crashes because of the AI.
- Text from users and from the FAQ is passed to the model as data; instructions inside it are ignored.
- Simple protection: at most 10 messages per minute per chat. `/stats` shows counters, for the owner only.

## Run it
1. In Telegram, talk to **@BotFather**, send `/newbot` and copy the token.
2. Copy `.env.example` to `.env` and set `TELEGRAM_BOT_TOKEN=` (keep `.env` private, it is git-ignored).
3. Optional AI: create a free key in Google AI Studio and set `GEMINI_API_KEY=`. Without it the bot answers from keywords.
4. Run `node src/bot.js` and write to your bot in Telegram. Stop with Ctrl+C.

Optional: set `ADMIN_ID=` to your Telegram user id to enable `/stats`.

## Change the content
Edit `data/faq.md`. Each `# Heading` starts a section; the text under it is the answer material. Restart the bot after editing.

## Tests
`npm test` runs 16 tests with local fakes of Telegram and Gemini (no network, no real keys).

## Files
```
src/bot.js       message handling, rate limit, polling loop
src/ai.js        Gemini call with model fallback and safe prompt
src/kb.js        FAQ parser and keyword search
src/telegram.js  minimal Bot API client
data/faq.md      your information
```

## Limits
Keyword search is simple; very large knowledge bases would need better retrieval. Conversation memory is kept in RAM (last turns only) and is lost on restart. The bot uses long polling, so it must run on a machine that stays on.

License: MIT.
