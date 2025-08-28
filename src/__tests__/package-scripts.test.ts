import fs from 'fs';
import path from 'path';

describe('package.json scripts and engines', () => {
  const pkgJsonPath = path.join(process.cwd(), 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8')) as { scripts: Record<string, string>; engines?: { node: string } };

  test('uses standard production build (no turbopack)', () => {
    expect(pkg.scripts.build).toBe('next build');
  });

  test('binds start to platform port', () => {
    expect(pkg.scripts.start).toBe('next start -p $PORT');
  });

  test('pins Node version for hosting', () => {
    expect(pkg.engines).toBeDefined();
    expect(pkg.engines.node).toBe('20.x');
  });
});


