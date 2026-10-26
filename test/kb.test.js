'use strict';
const test = require('node:test'); const assert = require('node:assert');
const path = require('path'); const kb = require('../src/kb');
const chunks = kb.load(path.join(__dirname, '..', 'data', 'faq.md'));

test('parses sections', () => { assert.strictEqual(chunks.length, 5); assert.ok(chunks.find(c => c.title === 'Delivery')); });
test('finds delivery', () => { assert.strictEqual(kb.search(chunks, 'How much does delivery cost?')[0].title, 'Delivery'); });
test('finds returns by stem', () => { assert.strictEqual(kb.search(chunks, 'can I return a purchase')[0].title, 'Returns'); });
test('finds hours', () => { assert.strictEqual(kb.search(chunks, 'what are your opening hours')[0].title, 'Opening hours'); });
test('nothing found for unrelated question', () => { assert.deepStrictEqual(kb.search(chunks, 'xyzzy plugh'), []); });
