import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { chromium, type Browser, type Page } from 'playwright';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync, readdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const archivedRoot = resolve(__dirname, '../../archived_game1_scripts');

interface ScriptPair {
  label: string;
  originalPath: string;
  deobfuscatedPath: string;
}

function discoverScriptPairs(): ScriptPair[] {
  const pairs: ScriptPair[] = [];
  for (const ent of readdirSync(archivedRoot, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    const dir = resolve(archivedRoot, ent.name);
    const originalPath = resolve(dir, 'game1.js');
    const deobfuscatedPath = resolve(dir, 'game1.js.deobfuscated.js');
    if (existsSync(originalPath) && existsSync(deobfuscatedPath)) {
      pairs.push({ label: ent.name, originalPath, deobfuscatedPath });
    }
  }
  return pairs.sort((a, b) => a.label.localeCompare(b.label));
}

const scriptPairs = discoverScriptPairs();
const mockTime = Date.now();
const mockTimeUtc = new Date(mockTime).toUTCString();

const HTML_BODY = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body></body></html>`;

function makeInitScript(): string {
  return `
const __origDate = Date;
const __origXHR = XMLHttpRequest;
const MOCK_TIME = ${mockTime};
const MOCK_TIME_UTC = '${mockTimeUtc}';

Date = class extends __origDate {
  constructor(...args) {
    if (args.length === 0) super(MOCK_TIME);
    else super(...args);
  }
  static now() { return MOCK_TIME; }
};

Math.random = () => 0.5;

XMLHttpRequest = class extends __origXHR {
  constructor() {
    super();
    this._rs = 0;
    this._st = 0;
    this._headers = {};
  }
  open() {}
  send() {
    const xhr = this;
    setTimeout(() => {
      xhr._rs = 4;
      xhr._st = 200;
      xhr._headers = { date: MOCK_TIME_UTC };
      if (xhr.onreadystatechange) xhr.onreadystatechange();
    }, 0);
  }
  getResponseHeader(name) {
    return this._headers[name.toLowerCase()] || null;
  }
  setRequestHeader() {}
  abort() {}
  get readyState() { return this._rs; }
  get status() { return this._st; }
};

localStorage.clear();
`;
}

async function getFingerprint(browser: Browser, scriptPath: string): Promise<string> {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  try {
    const page: Page = await context.newPage();
    page.on('pageerror', () => {});

    await page.addInitScript(makeInitScript());

    const code = readFileSync(scriptPath, 'utf-8');
    await page.route('**/test.html', async (route) => {
      await route.fulfill({ contentType: 'text/html', body: HTML_BODY });
    });
    await page.route('**/game1.js', async (route) => {
      await route.fulfill({ contentType: 'application/javascript', body: code });
    });

    await page.goto('http://local-test.com/test.html');

    await page.evaluate(() => {
      const s = document.createElement('script');
      s.src = '/game1.js';
      document.head.appendChild(s);
    });

    await page.waitForFunction(() => typeof (window as any).game1 !== 'undefined', { timeout: 15000 });

    const result = await page.evaluate(() => {
      return new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('TIMEOUT')), 20000);
        (window as any).game1((data: string) => {
          clearTimeout(timeout);
          resolve(data);
        });
      });
    });

    return result;
  } finally {
    await context.close();
  }
}

describe('behavioral equivalence', () => {
  let browser: Browser;

  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  });

  afterAll(async () => {
    await browser.close();
  });

  const pairs = scriptPairs.length > 0 ? scriptPairs : [{ label: 'none', originalPath: '', deobfuscatedPath: '' }];

  describe.each(pairs)('$label', ({ label, originalPath, deobfuscatedPath }) => {
    it('original and deobfuscated script produce identical fingerprint', async () => {
      const [origResult, deobfResult] = await Promise.all([
        getFingerprint(browser, originalPath),
        getFingerprint(browser, deobfuscatedPath),
      ]);

      expect(deobfResult).toBe(origResult);
    }, 120_000);
  });
});
