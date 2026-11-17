import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseSseBuffer,
  sanitizeHistory,
  parseMarkdownBlocks,
  parseInlineTokens,
  getChatStreamUrl,
} from './chatHelpers';

test('parseSseBuffer handles split chunks and multiple frames', () => {
  const firstChunk = 'data: {"text": "MS Dhoni"}\n\ndata: {"text": " led';
  const r1 = parseSseBuffer(firstChunk);
  assert.equal(r1.events.length, 1);
  assert.deepEqual(r1.events[0], { text: 'MS Dhoni' });
  assert.equal(r1.remainder, 'data: {"text": " led');

  const secondChunk = r1.remainder + ' India"}\n\ndata: {"done": true}\n\n';
  const r2 = parseSseBuffer(secondChunk);
  assert.equal(r2.events.length, 2);
  assert.deepEqual(r2.events[0], { text: ' led India' });
  assert.deepEqual(r2.events[1], { done: true });
  assert.equal(r2.remainder, '');
});

test('parseSseBuffer skips malformed JSON gracefully and supports CRLF', () => {
  const chunk = 'data: {bad-json}\r\n\r\ndata: {"error": "API error"}\r\n\r\n';
  const res = parseSseBuffer(chunk);
  assert.equal(res.events.length, 1);
  assert.deepEqual(res.events[0], { error: 'API error' });
});

test('sanitizeHistory drops errors, empty messages, and caps turns', () => {
  const input = [
    { role: 'user' as const, content: '  Hello  ' },
    { role: 'assistant' as const, content: 'Failed', isError: true },
    { role: 'assistant' as const, content: '   ' },
    { role: 'user' as const, content: '2011 World Cup?' },
    { role: 'assistant' as const, content: 'India won by 6 wickets.' },
  ];
  const res = sanitizeHistory(input, 2);
  assert.deepEqual(res, [
    { role: 'user', content: '2011 World Cup?' },
    { role: 'assistant', content: 'India won by 6 wickets.' },
  ]);
});

test('parseMarkdownBlocks parses headings, lists, tables, and paragraphs', () => {
  const md = [
    '## ICC Trophies',
    '',
    '- 2007 T20 World Cup',
    '- 2011 ODI World Cup',
    '',
    '| Year | Tournament |',
    '| --- | --- |',
    '| 2013 | Champions Trophy |',
    '',
    'Captain Cool finished in style.',
  ].join('\n');

  const blocks = parseMarkdownBlocks(md);
  assert.equal(blocks.length, 4);
  assert.deepEqual(blocks[0], { type: 'heading', level: 2, text: 'ICC Trophies' });
  assert.deepEqual(blocks[1], {
    type: 'ul',
    items: ['2007 T20 World Cup', '2011 ODI World Cup'],
  });
  assert.deepEqual(blocks[2], {
    type: 'table',
    headers: ['Year', 'Tournament'],
    rows: [['2013', 'Champions Trophy']],
  });
  assert.deepEqual(blocks[3], {
    type: 'paragraph',
    text: 'Captain Cool finished in style.',
  });
});

test('parseInlineTokens tokenizes bold, italic, and inline code', () => {
  const tokens = parseInlineTokens('He scored **91*** not out* with `183*` best.');
  assert.deepEqual(tokens, [
    { type: 'text', value: 'He scored ' },
    { type: 'bold', value: '91' },
    { type: 'italic', value: ' not out' },
    { type: 'text', value: ' with ' },
    { type: 'code', value: '183*' },
    { type: 'text', value: ' best.' },
  ]);
});

test('getChatStreamUrl resolves relative and remote Render base URLs', () => {
  assert.equal(getChatStreamUrl(undefined), '/api/chat/stream');
  assert.equal(getChatStreamUrl('   '), '/api/chat/stream');
  assert.equal(
    getChatStreamUrl('https://dhoni-ai-api.onrender.com'),
    'https://dhoni-ai-api.onrender.com/api/chat/stream'
  );
  assert.equal(
    getChatStreamUrl('https://dhoni-ai-api.onrender.com///'),
    'https://dhoni-ai-api.onrender.com/api/chat/stream'
  );
});
