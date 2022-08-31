import { ConstructType } from '../types/construct.type';

export const getConstructTypeFromUrl = (url: string): ConstructType => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (!(url.startsWith('http://localhost') || url.startsWith('https://localhost'))) {
      // Skipping because external URL
      return 'none';
    }
    return 'serve';
  }
  return 'build';
};
