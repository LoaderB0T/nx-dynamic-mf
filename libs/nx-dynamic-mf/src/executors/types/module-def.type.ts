import { ModuleDefinition } from 'ng-dynamic-mf';
import { ConstructType } from '../construct/types/construct.type';

export type ExtendedModuleDefinition = ModuleDefinition & {
  constructType: ConstructType;
};
