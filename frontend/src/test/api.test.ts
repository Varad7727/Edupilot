import { describe, it, expect } from 'vitest';
import api from '../api/client';

describe('Centralised API Client Configuration', () => {
  it('has credentials enabled for cookie-based authentication', () => {
    expect(api.defaults.withCredentials).toBe(true);
  });

  it('sets application/json Content-Type header', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('has a configured request timeout', () => {
    expect(api.defaults.timeout).toBeGreaterThan(0);
  });
});
