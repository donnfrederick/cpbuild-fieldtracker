// src/tests/toBase64.spec.ts
import { describe, it, expect } from 'vitest';
import toBase64 from '@/util/toBase64';

describe('toBase64', () => {
  it('should encode a simple object', () => {
    const obj = { a: 1, b: 'test' };
    const encoded = toBase64(obj);
    // Decode to verify
    const decoded = JSON.parse(atob(encoded));
    expect(decoded).toEqual(obj);
  });

  it('should encode an empty object', () => {
    const obj = {};
    const encoded = toBase64(obj);
    const decoded = JSON.parse(atob(encoded));
    expect(decoded).toEqual(obj);
  });

  it('should encode a nested object', () => {
    const obj = { user: { name: 'Alice', age: 30 }, active: true };
    const encoded = toBase64(obj);
    const decoded = JSON.parse(atob(encoded));
    expect(decoded).toEqual(obj);
  });

  it('should produce a string output', () => {
    const obj = { x: 10 };
    const encoded = toBase64(obj);
    expect(typeof encoded).toBe('string');
  });
});
