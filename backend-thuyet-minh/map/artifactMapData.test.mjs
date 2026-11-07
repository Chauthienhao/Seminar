import test from 'node:test';
import assert from 'node:assert/strict';
import {
  coordinateSignature,
  groupArtifactsByCoordinate,
  normalizeArtifacts,
  parseCoordinate,
  shortDescription,
} from './artifactMapData.mjs';

test('accepts real zero, numeric strings, and coordinate limits', () => {
  assert.equal(parseCoordinate(0, 90), 0);
  assert.equal(parseCoordinate(' 0 ', 90), 0);
  assert.equal(parseCoordinate('-90', 90), -90);
  assert.equal(parseCoordinate('180', 180), 180);
  assert.equal(parseCoordinate('10.7769', 90), 10.7769);
});

test('rejects absent, blank, boolean, nonfinite, malformed, and out-of-range coordinates', () => {
  for (const value of [null, undefined, '', '  ', true, false, NaN, Infinity, 'Infinity', '0x10', '10,5', {}, [], 90.001, -90.001]) {
    assert.equal(parseCoordinate(value, 90), null, String(value));
  }
});

test('filters invalid records and deduplicates only after finding a valid location', () => {
  const input = [
    { id: 'a', lat: null, lng: 106.7 },
    { id: 'a', lat: '10.7', lng: '106.7', title: 'Bình gốm', qr_code: 'QR-A', room: { name_vi: 'Phòng gốm' } },
    { id: 'a', lat: 20, lng: 100, title: 'Duplicate' },
    { id: 0, lat: 0, lng: 0, title: 'Zero point' },
    { id: '', lat: 10, lng: 106 },
    { id: 'b', lat: true, lng: 106 },
    { id: 'c', lat: 10, lng: 181 },
    null,
  ];
  const result = normalizeArtifacts(input);
  assert.deepEqual(result.map(item => [item.id, item.lat, item.lng]), [['a', 10.7, 106.7], ['0', 0, 0]]);
  assert.equal(result[0].title, 'Bình gốm');
  assert.equal(result[0].room.name_vi, 'Phòng gốm');
  assert.equal(result[1].room, null);
  assert.equal(input[1].lat, '10.7');
});

test('coincident artifacts stay at the original GPS and remain individually accessible', () => {
  const result = normalizeArtifacts([
    { id: 'a', lat: 10.7, lng: 106.7 },
    { id: 'b', lat: '10.7000', lng: '106.7000' },
  ]);
  const groups = groupArtifactsByCoordinate(result);
  assert.equal(result.length, 2);
  assert.equal(groups.size, 1);
  assert.deepEqual(groups.get('10.7,106.7').map(item => item.id), ['a', 'b']);
  assert.deepEqual(result.map(item => [item.lat, item.lng]), [[10.7, 106.7], [10.7, 106.7]]);
});

test('viewport signature changes only when coordinate values change', () => {
  const first = normalizeArtifacts([{ id: 'a', lat: 10, lng: 106 }, { id: 'b', lat: 11, lng: 107 }]);
  const reordered = normalizeArtifacts([{ id: 'b', lat: 11, lng: 107, title: 'Changed' }, { id: 'a', lat: 10, lng: 106 }, { id: 'c', lat: 10, lng: 106 }]);
  assert.equal(coordinateSignature(first), coordinateSignature(reordered));
  assert.notEqual(coordinateSignature(first), coordinateSignature(normalizeArtifacts([{ id: 'a', lat: 12, lng: 106 }])));
});

test('short description is plain text, bounded, and never supplies invented content', () => {
  assert.equal(shortDescription(null), '');
  assert.equal(shortDescription('<p>Gốm&nbsp;cổ &amp; men</p>'), 'Gốm cổ & men');
  assert.equal(shortDescription('Một mô tả dài', 3), 'Một…');
});
