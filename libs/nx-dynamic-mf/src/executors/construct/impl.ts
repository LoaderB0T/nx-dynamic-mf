import type { ExecutorContext, ProjectConfiguration } from '@nrwl/devkit';
import { copyFileSync, existsSync, readFileSync, readdirSync } from 'fs';
import * as fse from 'fs-extra';

import type { ModuleDefinitions } from 'ng-dynamic-mf';

import { ExtendedModuleDefinition } from '../types/module-def.type';
import { getConstructTypeFromUrl } from '../utils/get-construct-type-from-url';
import { getModulesToWatch } from './utils/get-modules-to-watch';
import { join, resolvePath } from '../utils/path';
import { ConstructExecutorOptions } from './types/options.type';
import { isBuilt } from './utils/is-built';
import { promiseExec } from '../utils/promise-exec';
import { getCfgFile } from '../utils/get-json-file';
import { copy } from '../utils/copy-file';

export default async function constructExecutor(
  options: ConstructExecutorOptions,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const callerName = context.projectName;
  if (!callerName) {
    throw new Error('No projectName found in context');
  }
  const projConfig = context.workspace.projects[callerName];
  const projRoot = projConfig.root;
  const projSrcRoot = projConfig.sourceRoot;
  if (!projSrcRoot) {
    throw new Error(`No sourceRoot found for ${callerName}`);
  }

  // Copy environment.*.json to modules.json
  const { configJsonPath: environmentJsonPath } = await getCfgFile(
    'environment',
    projRoot,
    options.envSrcFolder,
    options.e
  );
  const absoluteEnvOutDir = resolvePath(projRoot, 'src', options.envOutFolder);
  await copy(environmentJsonPath, join(absoluteEnvOutDir, 'environment.json'));

  // Copy environment.*.json to modules.json
  const { configJsonPath: moduleJsonPath } = await getCfgFile(
    'modules',
    projRoot,
    options.modulesSrcFolder,
    options.m
  );
  const absoluteModulesOutDir = resolvePath(
    projRoot,
    'src',
    options.modulesOutFolder
  );
  const modulesFilePath = join(absoluteModulesOutDir, 'modules.json');
  await copy(moduleJsonPath, modulesFilePath);

  // Parse modules.json
  const modulesFile = readFileSync(modulesFilePath, 'utf8');
  const moduleDefinitions = JSON.parse(modulesFile) as ModuleDefinitions;

  // Add constructType to module definitions
  const moduleCfgs = moduleDefinitions.modules.map((m) => {
    const moduleDef: ExtendedModuleDefinition = {
      ...m,
      constructType: getConstructTypeFromUrl(m.url, options.prebuilt),
    };
    return moduleDef;
  });

  if (!options.prebuilt) {
    // Adjust constructType for watch mode
    getModulesToWatch(options.watch, moduleCfgs);
  }

  // Build and serve modules
  const servings: Promise<void>[] = [];
  const builds: Promise<void>[] = [];

  buildAndServeModules(
    builds,
    servings,
    moduleCfgs,
    context,
    options,
    projConfig
  );

  // Wait for builds to finish
  try {
    await Promise.all(builds);
    // Copy the builds after all builds are finished
    copyBuilds(
      moduleCfgs.filter((m) => isBuilt(m)),
      context,
      projConfig
    );

    adjustGlobalStylesBundleNameIfNecessary(
      moduleCfgs,
      projConfig,
      moduleDefinitions,
      modulesFilePath
    );

    // Serve the host after all builds (not the servings) are finished and options.build is false
    if (!options.build) {
      serveHost(servings, callerName, options);
    }

    await Promise.all(servings);
  } catch (error) {
    console.error(`Error building referenced projects.`);
    console.error(error);
    return { success: false };
  }

  // Needs to be last so that the module bundles are already in the assets folder
  if (options.build) {
    await buildHost(callerName);
  }

  return { success: true };
}

function adjustGlobalStylesBundleNameIfNecessary(
  moduleCfgs: ExtendedModuleDefinition[],
  projConfig: ProjectConfiguration,
  moduleDefinitions: ModuleDefinitions,
  modulesFilePath: string
) {
  let changes = false;
  moduleCfgs
    .filter((x) => x.hasGlobalStyles && isBuilt(x))
    .forEach((moduleCfg) => {
      const fileName = moduleCfg.globalStyleBundleName ?? 'global-styles.css';
      if (!projConfig.sourceRoot) {
        throw new Error('No sourceRoot found in project configuration');
      }
      const fileParentPath = join(projConfig.sourceRoot, moduleCfg.url);
      const filePath = join(fileParentPath, fileName);
      if (existsSync(filePath)) {
        return;
      }
      const allFilesInParentFolder = readdirSync(fileParentPath);
      const globalStyleRegex = new RegExp(
        `^${fileName.replace('.css', '')}\\..*\\.css$`
      );
      const file = allFilesInParentFolder.find((f) => globalStyleRegex.test(f));
      if (!file) {
        console.error('foundFiles: ', allFilesInParentFolder);
        throw new Error(
          `Could not find global style ${fileName} file for module ${moduleCfg.url}`
        );
      }
      const moduleToUpdate = moduleDefinitions.modules.find(
        (x) => x.name === moduleCfg.name
      );
      if (!moduleToUpdate) {
        throw new Error(`Module ${moduleCfg.name} not found in modules.json`);
      }
      moduleToUpdate.globalStyleBundleName = file;
      changes = true;
    });
  if (changes) {
    fse.writeFileSync(
      modulesFilePath,
      JSON.stringify(moduleDefinitions, null, 2)
    );
  }
}

function copyBuilds(
  moduleDefs: ExtendedModuleDefinition[],
  context: ExecutorContext,
  projConfig: ProjectConfiguration
) {
  moduleDefs.forEach((moduleDef) => {
    const moduleConfig = getNxModuleConfig(context, moduleDef);
    if (!projConfig.sourceRoot) {
      throw new Error('No sourceRoot found in project configuration');
    }
    fse.copySync(
      join('dist', moduleConfig.root),
      join(projConfig.sourceRoot, moduleDef.url)
    );
  });
}

function serveHost(
  servings: Promise<void>[],
  callerName: string,
  options: ConstructExecutorOptions
) {
  servings.push(
    promiseExec(
      `nx serve ${callerName} --open${
        options.host ? ' --host 0.0.0.0 --disable-host-check' : ''
      }`
    )
  );
}

function buildAndServeModules(
  builds: Promise<void>[],
  servings: Promise<void>[],
  moduleCfgs: ExtendedModuleDefinition[],
  context: ExecutorContext,
  options: ConstructExecutorOptions,
  projConfig: ProjectConfiguration
) {
  const modulesToServe = moduleCfgs.filter((m) => m.constructType === 'serve');
  const modulesToBuildAndWatch = moduleCfgs.filter(
    (m) => m.constructType === 'buildAndWatch'
  );
  const modulesToBuild = moduleCfgs.filter((m) => m.constructType === 'build');

  modulesToServe.forEach((moduleToLoad) => {
    serveApp(moduleToLoad, servings, options.host ?? false);
  });

  modulesToBuildAndWatch.forEach((moduleToLoad) => {
    const moduleConfig = getNxModuleConfig(context, moduleToLoad);
    buildAndWatchApp(moduleToLoad, builds, moduleConfig, projConfig);
  });

  buildApps(modulesToBuild, builds);
}

function buildAndWatchApp(
  moduleToLoad: ExtendedModuleDefinition,
  builds: Promise<void>[],
  moduleConfig: ProjectConfiguration,
  projConfig: ProjectConfiguration
) {
  console.log(
    `Building ${moduleToLoad.name} to ${moduleToLoad.url} (watching)`
  );
  const cmd = `nx build ${moduleToLoad.name} --watch`;
  console.log('executing: ', cmd);
  let _resolve: () => void;
  promiseExec(cmd, (data) => {
    if (data.includes('Build at:')) {
      if (!projConfig.sourceRoot) {
        throw new Error('No sourceRoot found in project configuration');
      }
      fse.copySync(
        join('dist', moduleConfig.root),
        join(projConfig.sourceRoot, moduleToLoad.url)
      );
      _resolve();
    }
  });
  // watched builds are "done" when the first build is done
  builds.push(
    new Promise<void>((resolve) => {
      _resolve = resolve;
    })
  );
}

function buildApps(
  modulesToLoad: ExtendedModuleDefinition[],
  builds: Promise<void>[]
) {
  if (modulesToLoad.length === 0) {
    return;
  }
  console.log(`Building ${modulesToLoad.map((m) => m.name).join(', ')}`);
  builds.push(
    promiseExec(
      `nx run-many --target build --projects ${modulesToLoad
        .map((m) => m.projectName ?? m.name)
        .join(',')}`
    )
  );
}

async function buildHost(callerName: string) {
  console.log(`Building host ${callerName}`);
  await promiseExec(`nx build ${callerName}`);
}

function serveApp(
  moduleToLoad: ExtendedModuleDefinition,
  servings: Promise<void>[],
  host: boolean
) {
  const port = /localhost:(\d+)/.exec(moduleToLoad.url)?.[1];
  if (!port || Number.isNaN(Number.parseInt(port))) {
    throw new Error(`Invalid port in module ${moduleToLoad.name}`);
  }
  const portNumber = Number.parseInt(port);
  console.log(`Serving ${moduleToLoad.name} on port ${portNumber}`);
  servings.push(
    promiseExec(
      `nx serve ${
        moduleToLoad.projectName ?? moduleToLoad.name
      } --port ${portNumber}${
        host ? ' --host 0.0.0.0 --disable-host-check' : ''
      }`
    )
  );
}

function getNxModuleConfig(
  context: ExecutorContext,
  moduleDef: ExtendedModuleDefinition
) {
  const searchForName = moduleDef.projectName ?? moduleDef.name;
  const res = context.workspace.projects[searchForName];
  if (!res) {
    throw new Error(
      `Could not find project ${searchForName}. Try specifying of adjusting the projectName in the module definition.`
    );
  }
  return res;
}
