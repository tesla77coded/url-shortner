import { describe } from 'node:test'
import { isValidUrl } from '../../src/lib/urlValidator'

describe('isValidUrl', () => {
  it('accepts http and https', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
    expect(isValidUrl('https://example.com/path?q=1')).toBe(true);
  });

  it('rejects other protocols and invalid strings', () => {
    expect(isValidUrl('ftp://example.com')).toBe(false);
    expect(isValidUrl('not-a-url')).toBe(false);
    expect(isValidUrl('')).toBe(false);
  });
});

