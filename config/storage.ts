import type { StorageConfig } from '@keystone-6/core/types';
import mkdirp from 'mkdirp';

mkdirp.sync('public/images');

export const storage: Record<string, StorageConfig> = {
  myLocal: {
    kind: 'local',
    type: 'image',
    generateUrl: path => `http://localhost:3000/images${path}`,
    serverRoute: {
      path: '/images',
    },
    storagePath: 'public/images',
  },
};
