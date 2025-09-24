import { describe } from 'node:test';
import { encodeBase62 } from '../../src/lib/base62';

describe('encodeBase62', () => {
  test('encodes basic values correcrly', () => {
    expect(encodeBase62(0)).toBe('0');
    expect(encodeBase62(1)).toBe('1');
    expect(encodeBase62(10)).toBe('a');
    expect(encodeBase62(35)).toBe('z');
    expect(encodeBase62(36)).toBe('A');
    expect(encodeBase62(61)).toBe('Z');
    expect(encodeBase62(62)).toBe('10');
  });


  test('is deterministic for multiple values', () => {
    const samples = [123, 4567, 99999, 123456789];
    const mapped = samples.map((n) => encodeBase62(n));

    expect(mapped.every((s) => typeof s === 'string')).toBe(true);
    expect(new Set(mapped).size).toBe(mapped.length);
  });
});
