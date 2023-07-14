import path = require('path');

export function join(...paths: string[]): string {
  return paths.map((p) => normalizePath(p)).join('/');
}

export function normalizePath(path: string): string {
  const r = path.replace(/\/+/g, '/');
  r.replace(/\/$/, '');
  r.replace(/^\//, '');
  return r;
}

export function resolvePath(
  projectRoot: string,
  defaultPath: string,
  inPath?: string
) {
  return !inPath || inPath?.startsWith('.')
    ? path.resolve(projectRoot, inPath ?? defaultPath)
    : path.resolve(inPath);
}
