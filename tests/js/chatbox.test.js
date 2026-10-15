const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const html = `<div class="chatbox"><div class="chatbox__support"><div class="chatbox__messages"></div>
<input type="text"><button class="send__button">Send</button></div><div class="chatbox__button"><button>o</button></div></div>`;

function load(file, fetchImpl) {
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`, { runScripts: 'outside-only' });
  dom.window.fetch = fetchImpl;
  dom.window.eval(fs.readFileSync(path.join(__dirname, '..', '..', file), 'utf8').replace('if (typeof module', 'if (false && typeof module'));
  return dom;
}

for (const file of ['static/app.js', 'standalone-frontend/app.js']) {
  test(`${file}: messages render as text, never markup`, async () => {
    const calls = [];
    const dom = load(file, async (url, opts) => {
      calls.push(url);
      return { ok: true, json: async () => ({ answer: '<img src=x onerror=alert(1)>' }) };
    });
    const { document } = dom.window;
    document.querySelector('input').value = '<b>hi</b>';
    document.querySelector('.send__button').click();
    await new Promise((r) => setTimeout(r, 20));
    assert.equal(document.querySelectorAll('.chatbox__messages img, .chatbox__messages b').length, 0);
    const texts = [...document.querySelectorAll('.messages__item')].map((n) => n.textContent);
    assert.deepEqual(texts, ['<img src=x onerror=alert(1)>', '<b>hi</b>']);
    assert.match(calls[0], /\/predict$/);
  });

  test(`${file}: network failure shows an error message`, async () => {
    const dom = load(file, async () => { throw new Error('down'); });
    const { document } = dom.window;
    document.querySelector('input').value = 'hi';
    document.querySelector('.send__button').click();
    await new Promise((r) => setTimeout(r, 20));
    assert.match(document.querySelector('.messages__item').textContent, /could not reach/);
  });
}
