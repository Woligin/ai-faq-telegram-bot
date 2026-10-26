'use strict';
// Tiny knowledge base: splits a markdown file into sections and finds the most relevant ones by keyword overlap.
const fs = require('fs');

const STOP = new Set(['a', 'an', 'the', 'is', 'are', 'do', 'does', 'i', 'you', 'we', 'to', 'of', 'in', 'on', 'for', 'and', 'or', 'my', 'me', 'it', 'how', 'what', 'when', 'can', 'your']);

function tokens(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9а-яё\s]/gi, ' ').split(/\s+/).filter(w => w && !STOP.has(w));
}

function parse(text) {
  const out = [];
  let cur = null;
  for (const line of String(text).split(/\r?\n/)) {
    const h = line.match(/^#+\s+(.*)$/);
    if (h) { if (cur) out.push(cur); cur = { title: h[1].trim(), text: '' }; }
    else if (cur) cur.text += (cur.text ? ' ' : '') + line.trim();
  }
  if (cur) out.push(cur);
  return out.map(c => ({ ...c, text: c.text.trim() })).filter(c => c.text);
}

function load(file) { return parse(fs.readFileSync(file, 'utf8')); }

function stem(w) { return w.length > 4 ? w.slice(0, 5) : w; }

function search(chunks, query, limit = 3) {
  const q = tokens(query).map(stem);
  const scored = chunks.map(c => {
    const hay = new Set(tokens(c.title + ' ' + c.text).map(stem));
    const titleHay = new Set(tokens(c.title).map(stem));
    let score = 0;
    for (const w of q) { if (hay.has(w)) score += 1; if (titleHay.has(w)) score += 2; }
    return { ...c, score };
  }).filter(c => c.score > 0);
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

module.exports = { parse, load, search, tokens };
