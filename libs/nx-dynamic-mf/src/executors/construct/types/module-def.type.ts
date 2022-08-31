import { ConstructType } from './construct.type';
import { ModuleCfg } from './module-cfg.type';

export type ModuleDef = ModuleCfg & {
  constructType: ConstructType;
};
