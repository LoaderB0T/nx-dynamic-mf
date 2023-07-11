export interface ConstructExecutorOptions {
  modulesFolder: string;
  m?: string;
  modules?: string;
  watch?: boolean | string | string[];
  host?: boolean;
  build?: boolean;
  prebuilt?: boolean;
}
