import { config } from '@keystone-6/core';
import type { DatabaseProvider } from '@keystone-6/core/types';

import './config/_bootstrap-env';
import { withAuth, session } from './config/auth';
import { lists } from './config/schema';
import { storage } from './config/storage';

let provider: DatabaseProvider = 'sqlite';
const url = (process.env.DATABASE_URL ?? '') || 'file:./keystone.db';

if (url.startsWith('postgres:')) {
  provider = 'postgresql';
}

if (url.startsWith('mysql:')) {
  provider = 'mysql';
}

export default withAuth(
  config({
    db: {
      provider,
      url,
      enableLogging: process.env.NODE_ENV !== 'production',
      // TODO: set to `true` on first release
      useMigrations: false,
    },
    lists,
    session,
    storage,
    telemetry: false,
  }),
);
