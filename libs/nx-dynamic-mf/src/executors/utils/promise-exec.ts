import { exec } from 'child_process';

export function promiseExec(
  command: string,
  dataCallback?: (data: string) => void
) {
  return new Promise<void>((resolve, reject) => {
    console.log('executing: ', command);
    const child = exec(command);
    child.stdout?.pipe(process.stdout);
    child.stderr?.pipe(process.stderr);
    if (dataCallback) {
      child.stdout?.on('data', dataCallback);
    }
    child.on('exit', (code) => (code === 0 ? resolve() : reject(code)));
  });
}
