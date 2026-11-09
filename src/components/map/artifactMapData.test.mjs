import test from 'node:test';
import assert from 'node:assert/strict';
import {
  coordinateSignature,
  normalizePois,
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

test('filters invalid POIs and deduplicates only after finding a valid location', () => {
  const input = [
    { id: 'a', lat: null, lng: 106.7 },
    { id: 'a', lat: '10.7', lng: '106.7', name_vi: 'Tủ gốm', code: 'SG-1815', room: { name_vi: 'Phòng gốm' } },
    { id: 'a', lat: 20, lng: 100, name_vi: 'Duplicate' },
    { id: 0, lat: 0, lng: 0, code: 'SG-0' },
    { id: '', lat: 10, lng: 106 },
    { id: 'b', lat: true, lng: 106 },
    { id: 'c', lat: 10, lng: 181 },
    null,
  ];
  const result = normalizePois(input);
  assert.deepEqual(result.map(item => [item.id, item.lat, item.lng]), [['a', 10.7, 106.7], ['0', 0, 0]]);
  assert.equal(result[0].title, 'Tủ gốm');
  assert.equal(result[0].room.name_vi, 'Phòng gốm');
  assert.equal(result[1].title, 'SG-0');
  assert.equal(result[1].room, null);
  assert.equal(input[1].lat, '10.7');
});

test('one POI keeps all of its artifacts; a POI without artifacts is still a marker', () => {
  const result = normalizePois([
    { id: 'p1', lat: 10.7, lng: 106.7, name_vi: 'Tủ gốm', artifacts: [
      { id: 'x', code: 'SG-1815', title: 'Bình gốm' },
      { id: 'y', code: 'SG-1816', title: 'Đĩa men lam', description: ' Đĩa ' },
      { title: 'no id' },
    ] },
    { id: 'p2', lat: 10.7, lng: 106.7001, name_vi: 'Lối vào', poi_type: 'ENTRANCE', description_vi: 'Chào mừng' },
  ]);
  assert.equal(result.length, 2);
  assert.deepEqual(result[0].artifacts.map(item => item.id), ['x', 'y']);
  assert.equal(result[0].artifacts[1].description, 'Đĩa');
  assert.deepEqual(result[1].artifacts, []);
  assert.equal(result[1].poi_type, 'ENTRANCE');
  assert.equal(result[1].description, 'Chào mừng');
});

test('viewport signature changes only when coordinate values change', () => {
  const first = normalizePois([{ id: 'a', lat: 10, lng: 106 }, { id: 'b', lat: 11, lng: 107 }]);
  const reordered = normalizePois([{ id: 'b', lat: 11, lng: 107, name_vi: 'Changed' }, { id: 'a', lat: 10, lng: 106 }, { id: 'c', lat: 10, lng: 106 }]);
  assert.equal(coordinateSignature(first), coordinateSignature(reordered));
  assert.notEqual(coordinateSignature(first), coordinateSignature(normalizePois([{ id: 'a', lat: 12, lng: 106 }])));
});

test('short description is plain text, bounded, and never supplies invented content', () => {
  assert.equal(shortDescription(null), '');
  assert.equal(shortDescription('<p>Gốm&nbsp;cổ &amp; men</p>'), 'Gốm cổ & men');
  assert.equal(shortDescription('Một mô tả dài', 3), 'Một…');
});
