import { ConstructType } from '../construct/types/construct.type';

export const getConstructTypeFromUrl = (
  url: string,
  prebuilt?: boolean
): ConstructType => {
  if (prebuilt) {
    return 'prebuilt';
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (
      !(
        url.startsWith('http://localhost') ||
        url.startsWith('https://localhost')
      )
    ) {
      // Skipping because external URL
      return 'none';
    }
    return 'serve';
  }
  return 'build';
};
