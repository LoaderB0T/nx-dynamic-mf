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
  serveHost(servings, callerName, options);

  try {
    await Promise.all(builds);
    await Promise.all(servings);
  } catch (error) {
    console.error(`Error building referenced projects.`);
    console.error(error);
    return { success: false };
  }

  return { success: true };
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
  moduleCfgs.forEach((moduleToLoad) => {
    const moduleConfig = context.workspace.projects[moduleToLoad.name];
    if (moduleToLoad.constructType === 'none') {
      return;
    }
    if (moduleToLoad.constructType === 'serve') {
      serveApp(moduleToLoad, servings, options.host ?? false);
    }
    if (
      moduleToLoad.constructType === 'build' ||
      moduleToLoad.constructType === 'buildAndWatch'
    ) {
      buildApp(moduleToLoad, builds, moduleConfig, projConfig);
    }
  });
}

function buildApp(
  moduleToLoad: ModuleDef,
  builds: Promise<void>[],
  moduleConfig: ProjectConfiguration,
  projConfig: ProjectConfiguration
) {
  const watch = moduleToLoad.constructType === 'buildAndWatch';
  console.log(
    `Building ${moduleToLoad.name} to ${moduleToLoad.url}${
      watch ? ' (watching)' : ''
    }`
  );
  builds.push(
    new Promise<void>((resolve, reject) => {
      const child = exec(
        `nx build ${moduleToLoad.name}${watch ? ' --watch' : ''}`
      );
      child.stdout?.pipe(process.stdout);
      child.on('exit', (code) => (code === 0 ? resolve() : reject(code)));
      if (watch) {
        child.stdout?.on('data', (data) => {
          if (data.includes('Build at:')) {
            fse.copySync(
              `./dist/${moduleConfig.root}`,
              `${projConfig.sourceRoot}${moduleToLoad.url}`
            );
          }
        });
      }
    }).then(() => {
      if (!watch) {
        fse.copySync(
          `./dist/${moduleConfig.root}`,
          `${projConfig.sourceRoot}${moduleToLoad.url}`
        );
      }
    })
  );
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
