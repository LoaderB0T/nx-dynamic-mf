export interface ConstructExecutorOptions {
  modulesFolder: string;
  m?: string;
  e?: string;
  modules?: string;
  watch?: boolean | string | string[];
  host?: boolean;
  build?: boolean;
  prebuilt?: boolean;
}
