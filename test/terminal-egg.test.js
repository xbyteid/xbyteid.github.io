import { beforeEach, describe, expect, it } from 'vitest';
import { fireClick, fireKey, loadPage } from './helpers/page.js';

describe('terminal easter egg', () => {
  let document;
  let window;
  let egg;
  let input;
  let out;
  let bannerLines;

  beforeEach(async () => {
    ({ document, window } = await loadPage('index.html'));
    egg = document.getElementById('termEgg');
    input = document.getElementById('termEggInput');
    out = document.getElementById('termEggOut');
    bannerLines = out.children.length;
  });

  const submit = (value) => {
    input.value = value;
    fireKey(input, 'Enter');
  };

  // Only the lines printed by the prompt, ignoring the static banner.
  const lines = () => [...out.children].slice(bannerLines).map((line) => line.textContent);

  it('starts hidden', () => {
    expect(egg.classList.contains('open')).toBe(false);
  });

  it('opens with the backtick key and closes on a second press', () => {
    fireKey(document, '`');
    expect(egg.classList.contains('open')).toBe(true);
    expect(egg.hidden).toBe(false);

    fireKey(document, '`');
    expect(egg.classList.contains('open')).toBe(false);
    expect(egg.hidden).toBe(true);
  });

  it('closes on Escape and via the close button', () => {
    fireKey(document, '`');
    fireKey(document, 'Escape');
    expect(egg.classList.contains('open')).toBe(false);

    fireKey(document, '`');
    fireClick(document.getElementById('termEggClose'));
    expect(egg.classList.contains('open')).toBe(false);
  });

  it('does not hijack the backtick key while another field is focused', () => {
    const field = document.createElement('input');
    document.body.appendChild(field);

    fireKey(field, '`');

    expect(egg.classList.contains('open')).toBe(false);
  });

  it('still opens when the backtick is typed in its own input', () => {
    fireKey(input, '`');
    expect(egg.classList.contains('open')).toBe(true);
  });

  it('ignores the backtick when a modifier key is held', () => {
    const event = new window.KeyboardEvent('keydown', { key: '`', ctrlKey: true, bubbles: true, cancelable: true });
    document.dispatchEvent(event);

    expect(egg.classList.contains('open')).toBe(false);
  });

  it.each([
    ['help', 'help · ls · status · whoami · projects · clear'],
    ['ls', 'xmint/  hermes-agent/  automation-toolkit/  portfolio/  blog/'],
    ['status', 'online · building · shipping · mostly working'],
    ['whoami', 'xbyteid — indonesia · builder · operator · shipper'],
    ['projects', 'xMint · Hermes Agent · Automation Toolkit · xbyteid.codes']
  ])('answers the "%s" command', (command, response) => {
    submit(command);

    expect(lines()).toEqual([`$ ${command}`, `→ ${response}`]);
    expect(input.value).toBe('');
  });

  it('normalises casing and surrounding whitespace', () => {
    submit('  WhoAmI  ');

    expect(lines()[0]).toBe('$ whoami');
    expect(lines()[1]).toContain('xbyteid');
  });

  it('reports unknown commands', () => {
    submit('sudo rm -rf /');

    expect(lines()[1]).toBe('command not found. try help');
  });

  it('echoes an empty prompt without a response line', () => {
    submit('   ');

    expect(lines()).toEqual(['$ ']);
  });

  it('wipes the scrollback with "clear"', () => {
    submit('help');
    submit('clear');

    expect(lines()).toEqual([]);
  });

  it('ignores keys other than Enter in the prompt', () => {
    input.value = 'help';
    fireKey(input, 'a');

    expect(lines()).toEqual([]);
    expect(input.value).toBe('help');
  });
});
