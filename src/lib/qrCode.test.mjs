import test from 'node:test';
import assert from 'node:assert/strict';
import { extractQrCode, qrLinkFor } from './qrCode.mjs';

test('qrLinkFor builds a stable /q/ link', () => {
  assert.equal(qrLinkFor('https://baotang.vn/', 'SG-1822'), 'https://baotang.vn/q/SG-1822');
  assert.equal(qrLinkFor('http://localhost:5173', 'A B'), 'http://localhost:5173/q/A%20B');
});

test('extractQrCode reads museum links from any host', () => {
  assert.equal(extractQrCode('https://baotang.vn/q/SG-1822'), 'SG-1822');
  assert.equal(extractQrCode('http://localhost:5173/q/SG-1822/'), 'SG-1822');
  assert.equal(extractQrCode('  https://x.y/q/SG%2D1815?utm=1  '), 'SG-1815');
});

test('extractQrCode accepts raw codes', () => {
  assert.equal(extractQrCode('SG-ENTRANCE'), 'SG-ENTRANCE');
  assert.equal(extractQrCode('hv_101.01'), 'hv_101.01');
});

test('extractQrCode rejects foreign or unsafe content', () => {
  for (const value of [
    '', '   ', null, 42, 'https://example.com/', 'https://example.com/products/1',
    'https://x.y/q/', 'https://x.y/q/a/b', 'javascript:alert(1)', 'WIFI:S:home;T:WPA;P:secret;;',
    'mã có dấu', 'https://x.y/q/%E0%A4%A', 'x'.repeat(51), 'ftp://x.y/q/SG-1',
  ]) {
    assert.equal(extractQrCode(value), null, String(value));
  }
});
