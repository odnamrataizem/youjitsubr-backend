import type { StorageConfig } from '@keystone-6/core/types';
import { mkdirpSync } from 'mkdirp';

const storagePath = 'public/images';
mkdirpSync(storagePath);

const host = (process.env.ASSET_BASE_URL ?? '') || 'http://localhost:3000';

export const storage: Record<string, StorageConfig> = {
  myLocal: {
    kind: 'local',
    type: 'image',
    generateUrl: path => `${host}/images${path}`,
    serverRoute: {
      path: '/images',
    },
    storagePath,
  },
};
