import { existsSync, readdirSync } from 'fs-extra';
import path = require('path');
import { resolvePath } from './path';

export async function getCfgFile(
  kind: string,
  projectRoot: string,
  srcFolder?: string,
  configName?: string
) {
  const absoluteEnvInDir = resolvePath(projectRoot, `src/${kind}`, srcFolder);

  // Copy [kind].*.json to [kind].json
  const cfgName = configName ?? 'default';
  const configFileName = `${kind}.${cfgName}.json`;

  const configJsonPath = path.join(absoluteEnvInDir, configFileName);

  if (!existsSync(configJsonPath)) {
    let cfgFiles: string[] = [];
    try {
      cfgFiles = readdirSync(absoluteEnvInDir);
    } catch (e) {
      cfgFiles = [`Error reading ${kind} folder "${absoluteEnvInDir}"`];
    }
    throw new Error(
      `${kind} file ${configJsonPath} does not exist. Found files: ${cfgFiles.join(
        ', '
      )}`
    );
  }

  return { configJsonPath, cfgName };
}
