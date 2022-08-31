import { ModuleDef } from '../types/module-def.type';

export const getModulesToWatch = (watch: undefined | boolean | string | string[], modules: ModuleDef[]): void => {
  if (!watch) {
    return;
  }

  const moduleNamesToWatch: string[] = [];
  const modulesToBuild = modules.filter(m => m.constructType === 'build');
  if (watch === true) {
    moduleNamesToWatch.push(...modulesToBuild.map(m => m.name));
  }

  if (typeof watch === 'string') {
    if (watch.includes(',')) {
      moduleNamesToWatch.push(...watch.split(','));
    } else {
      moduleNamesToWatch.push(watch);
    }
  }

  const invalidNames = moduleNamesToWatch.filter(p => !modules.find(m => m.name === p));
  if (invalidNames.length > 0) {
    throw new Error(`Invalid module names for watch: ${invalidNames.join(', ')}`);
  }
  const invalidBuildNames = moduleNamesToWatch.filter(p => !modulesToBuild.find(m => m.name === p));
  if (invalidBuildNames.length > 0) {
    console.warn(`Invalid module names for watch, because they are served: ${invalidBuildNames.join(', ')}`);
    invalidBuildNames.forEach(p => moduleNamesToWatch.splice(moduleNamesToWatch.indexOf(p), 1));
  }

  modules.forEach(m => {
    if (moduleNamesToWatch.includes(m.name)) {
      m.constructType = 'buildAndWatch';
    }
  });
};
