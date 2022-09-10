import type { ExecutorContext, ProjectConfiguration } from '@nrwl/devkit';
import { exec } from 'child_process';
import { copyFileSync, readFileSync } from 'fs';
import * as fse from 'fs-extra';
import { ModuleCfg } from '../types/module-cfg.type';
import { ModuleDef } from '../types/module-def.type';
import { getConstructTypeFromUrl } from '../utils/get-construct-type-from-url';
import { getModulesToWatch } from './utils/get-modules-to-watch';

export interface ConstructExecutorOptions {
  modulesFolder: string;
  m?: string;
  modules?: string;
  watch?: boolean | string | string[];
  host?: boolean;
  build?: boolean;
}

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

  const modulesJsonName = `modules.${
    options.m ?? options.modules ?? 'default'
  }.json`;
  copyFileSync(
    `${projRoot}/${options.modulesFolder}/${modulesJsonName}`,
    `${projRoot}/${options.modulesFolder}/modules.json`
  );

  const modulesFilePath = `${projRoot}/${options.modulesFolder}/modules.json`;
  const modulesFile = readFileSync(modulesFilePath, 'utf8');
  const modulesToLoad = JSON.parse(modulesFile) as ModuleCfg[];

  const servings: Promise<void>[] = [];
  const builds: Promise<void>[] = [];

  const moduleCfgs = modulesToLoad.map((m) => {
    const moduleDef: ModuleDef = {
      ...m,
      constructType: getConstructTypeFromUrl(m.url),
    };
    return moduleDef;
  });

  getModulesToWatch(options.watch, moduleCfgs);
  buildAndServeModules(
    moduleCfgs,
    context,
    servings,
    options,
    builds,
    projConfig
  );

  try {
    await Promise.all(builds).then(() =>
      copyBuilds(
        moduleCfgs.filter((m) => m.constructType === 'build'),
        context,
        projConfig
      )
    );

    // only start serving host after builds are done
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

function copyBuilds(
  moduleDefs: ModuleDef[],
  context: ExecutorContext,
  projConfig: ProjectConfiguration
) {
  moduleDefs.forEach((moduleDef) => {
    const moduleConfig = context.workspace.projects[moduleDef.name];
    fse.copySync(
      `./dist/${moduleConfig.root}`,
      `${projConfig.sourceRoot}${moduleDef.url}`
    );
  });
}

function serveHost(
  servings: Promise<void>[],
  callerName: string,
  options: ConstructExecutorOptions
) {
  servings.push(
    new Promise<void>((resolve, reject) => {
      const child = exec(
        `nx serve ${callerName} --open${
          options.host ? ' --host 0.0.0.0 --disable-host-check' : ''
        }`
      );
      child.stdout?.pipe(process.stdout);
      child.on('exit', (code) => (code === 0 ? resolve() : reject(code)));
    })
  );
}

function buildAndServeModules(
  moduleCfgs: ModuleDef[],
  context: ExecutorContext,
  servings: Promise<void>[],
  options: ConstructExecutorOptions,
  builds: Promise<void>[],
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
    const moduleConfig = context.workspace.projects[moduleToLoad.name];
    buildAndWatchApp(moduleToLoad, builds, moduleConfig, projConfig);
  });

  buildApps(modulesToBuild, builds);
}

function buildAndWatchApp(
  moduleToLoad: ModuleDef,
  builds: Promise<void>[],
  moduleConfig: ProjectConfiguration,
  projConfig: ProjectConfiguration
) {
  console.log(
    `Building ${moduleToLoad.name} to ${moduleToLoad.url} (watching)`
  );
  const child = exec(`nx build ${moduleToLoad.name} --watch`);
  child.stdout?.pipe(process.stdout);
  let _resolve: () => void;
  child.stdout?.on('data', (data) => {
    if (data.includes('Build at:')) {
      fse.copySync(
        `./dist/${moduleConfig.root}`,
        `${projConfig.sourceRoot}${moduleToLoad.url}`
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

function buildApps(modulesToLoad: ModuleDef[], builds: Promise<void>[]) {
  if (modulesToLoad.length === 0) {
    return;
  }
  console.log(
    `Building ${modulesToLoad.map((m) => m.name).join(', ')} (watching)`
  );
  builds.push(
    new Promise<void>((resolve, reject) => {
      const child = exec(
        `nx run-many --target build --projects ${modulesToLoad
          .map((m) => m.name)
          .join(',')}`
      );
      child.stdout?.pipe(process.stdout);
      child.on('exit', (code) => (code === 0 ? resolve() : reject(code)));
    })
  );
}

async function buildHost(callerName: string) {
  console.log(`Building host ${callerName}`);
  await new Promise<void>((resolve, reject) => {
    const child = exec(`nx build ${callerName}`);
    child.stdout?.pipe(process.stdout);
    child.on('exit', (code) => (code === 0 ? resolve() : reject(code)));
  });
}

function serveApp(
  moduleToLoad: ModuleDef,
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
    new Promise<void>((resolve, reject) => {
      const child = exec(
        `nx serve ${moduleToLoad.name} --port ${portNumber}${
          host ? ' --host 0.0.0.0 --disable-host-check' : ''
        }`
      );
      child.stdout?.pipe(process.stdout);
      child.on('exit', (code) => (code === 0 ? resolve() : reject(code)));
    })
  );
}
