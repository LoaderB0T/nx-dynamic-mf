import { ExecutorContext } from '@nrwl/devkit';
import { readFileSync, writeFileSync } from 'fs';
import { ExtendedModuleDefinition } from '../types/module-def.type';
import { getConstructTypeFromUrl } from '../utils/get-construct-type-from-url';
import { ModuleDefinitions, join } from 'ng-dynamic-mf';
import { createHash } from 'crypto';

export interface HashExecutorOptions {
  modulesFolder: string;
}

export default async function runExecutor(
  options: HashExecutorOptions,
  context: ExecutorContext
) {
  const callerName = context.projectName;
  if (!callerName) {
    throw new Error('No projectName found in context');
  }
  const projConfig = context.workspace.projects[callerName];
  const projRoot = projConfig.root;

  const modulesFilePath = join(
    'dist',
    projRoot,
    options.modulesFolder,
    'modules.json'
  );
  const modulesFile = readFileSync(modulesFilePath, 'utf8');
  const moduleDefinitions = JSON.parse(modulesFile) as ModuleDefinitions;

  const moduleCfgs = moduleDefinitions.modules.map((m) => {
    const moduleDef: ExtendedModuleDefinition = {
      ...m,
      constructType: getConstructTypeFromUrl(m.url),
    };
    return moduleDef;
  });

  moduleCfgs.forEach((m) => {
    if (m.constructType === 'build') {
      console.log(`Hashing ${m.name}...`);
      const modulePath = `${projConfig.sourceRoot}${m.url}`;
      const remoteEntryPath = join(modulePath, 'remoteEntry.js');
      const hash = createHash('shake256', { outputLength: 8 });
      hash.update(readFileSync(remoteEntryPath, 'utf8'));
      const moduleToUpdate = moduleDefinitions.modules.find(
        (x) => x.name === m.name
      );
      if (!moduleToUpdate) {
        throw new Error(`Module ${m.name} not found in modules.json`);
      }
      moduleToUpdate.hash = hash.digest('hex');
    } else {
      console.log(`Skipping hash for ${m.name} because it is served`);
    }
  });

  writeFileSync(modulesFilePath, JSON.stringify(moduleDefinitions, null, 2));

  return {
    success: true,
  };
}
