import type { ExecutorContext } from '@nrwl/devkit';

import { join, resolvePath } from '../utils/path';
import { ServeRemoteExecutorOptions } from './types/options.type';
import { getCfgFile } from '../utils/get-json-file';
import { copy } from '../utils/copy-file';

export default async function pickCfgExecutor(
  options: ServeRemoteExecutorOptions,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  await doPickCfg();

  return {
    success: true,
  };

  async function doPickCfg() {
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
    const { configJsonPath: environmentJsonPath } = await getCfgFile(
      'environment',
      projectRoot,
      options.envSrcFolder,
      options.e
    );
    const outFileName = join(absoluteEnvOutDir, 'environment.json');
    await copy(environmentJsonPath, outFileName);

    if (options.m) {
      // Copy modules.*.json to modules.json
      const { configJsonPath: moduleJsonPath } = await getCfgFile(
        'modules',
        projectRoot,
        options.modulesSrcFolder,
        options.m
      );
      const absoluteModulesOutDir = resolvePath(
        projectRoot,
        'src',
        options.modulesOutFolder
      );
      const modulesFilePath = join(absoluteModulesOutDir, 'modules.json');
      await copy(moduleJsonPath, modulesFilePath);
    }
  }
}
