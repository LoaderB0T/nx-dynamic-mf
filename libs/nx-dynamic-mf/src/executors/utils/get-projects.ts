import { ExecutorContext } from '@nrwl/devkit';

export function getProjects(context: ExecutorContext) {
  return (context.projectsConfigurations ?? context.workspace)?.projects;
}

export function getProject(context: ExecutorContext, projectName: string) {
  const res = getProjects(context)?.[projectName];
  if (!res) {
    throw new Error(`No project configuration found for ${projectName}`);
  }
  return res;
}
