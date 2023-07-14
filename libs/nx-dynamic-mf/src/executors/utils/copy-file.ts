import { copyFileSync, existsSync, unlink } from 'fs-extra';

export async function copy(from: string, to: string) {
  if (existsSync(to)) {
    await unlink(to);
  }

  copyFileSync(from, to);
}
