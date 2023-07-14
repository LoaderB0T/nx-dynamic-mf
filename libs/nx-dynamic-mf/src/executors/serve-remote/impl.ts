import type { ExecutorContext } from '@nrwl/devkit';

import { join, resolvePath } from '../utils/path';
import { ServeRemoteExecutorOptions } from './types/options.type';
import { promiseExec } from '../utils/promise-exec';
import { getCfgFile } from '../utils/get-json-file';
import { copy } from '../utils/copy-file';

export default async function constructExecutor(
  options: ServeRemoteExecutorOptions,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const callerName = context.projectName;
  if (!callerName) {
    throw new Error('No projectName found in context');
  }
  const projectRoot = context.workspace.projects[callerName].root;
  const projectSrcRoot = context.workspace.projects[callerName].sourceRoot;
  if (!projectSrcRoot) {
    throw new Error('No sourceRoot found in context');
  }

  const absoluteEnvOutDir = resolvePath(
    projectRoot,
    'src',
    options.envOutFolder
  );
  const { configJsonPath: environmentJsonPath, cfgName: envName } =
    await getCfgFile(
      'environment',
      projectRoot,
      options.envSrcFolder,
      options.e
    );

  const outFileName = join(absoluteEnvOutDir, 'environment.json');

  await copy(environmentJsonPath, outFileName);

  console.log(`['copy' : 'link'}] -- ${envName} --`);
  console.log(`${environmentJsonPath} -> ${outFileName}`);

  const serveCmdName = options.serveTarget ?? 'serve-ng';
  const configurationCmd = context.configurationName
    ? `--configuration ${context.configurationName}`
    : '';

  await promiseExec(`nx ${serveCmdName} ${callerName} ${configurationCmd}`);

  return {
    success: true,
  };
}
