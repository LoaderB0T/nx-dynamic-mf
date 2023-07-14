export interface ConstructExecutorOptions {
  modulesSrcFolder?: string;
  modulesOutFolder?: string;
  envSrcFolder?: string;
  envOutFolder?: string;
  m?: string;
  e?: string;
  watch?: boolean | string | string[];
  host?: boolean;
  build?: boolean;
  prebuilt?: boolean;
}
