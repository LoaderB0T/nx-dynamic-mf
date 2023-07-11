import { ExtendedModuleDefinition } from '../../types/module-def.type';

export function isBuilt(mod: ExtendedModuleDefinition) {
  return mod.constructType === 'prebuilt' || mod.constructType === 'build';
}
