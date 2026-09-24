import { describe, expect, it } from 'vitest';
import {
  ASSET_RULES,
  renderHeadersFile,
  SECURITY_HEADERS,
  withSecurityHeaders,
} from '@workers/shared/security-headers';

describe('withSecurityHeaders', () => {
  it('adds every security header to a Worker response', () => {
    const response = withSecurityHeaders(new Response('ok'));
    for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
      expect(response.headers.get(name)).toBe(value);
    }
  });

  it('never overrides a header the response already carries', () => {
    const response = withSecurityHeaders(
      new Response('ok', { headers: { 'X-Frame-Options': 'SAMEORIGIN' } }),
    );
    expect(response.headers.get('X-Frame-Options')).toBe('SAMEORIGIN');
  });
});

describe('renderHeadersFile', () => {
  const file = renderHeadersFile();

  it('applies the security headers to every asset', () => {
    expect(file).toContain('/*\n');
    expect(file).toContain(
      `  Content-Security-Policy: ${SECURITY_HEADERS['Content-Security-Policy']}`,
    );
  });

  it('writes one block per asset pattern, fonts with CORS for the PDF renderer', () => {
    for (const [pattern, headers] of ASSET_RULES) {
      expect(file).toContain(`${pattern}\n`);
      for (const [name, value] of Object.entries(headers)) {
        expect(file).toContain(`  ${name}: ${value}`);
      }
    }
    expect(file).toContain('/fonts/*\n  Cache-Control: public, max-age=86400');
    expect(file).toContain('Access-Control-Allow-Origin: *');
  });
});
