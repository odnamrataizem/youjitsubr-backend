import { randomBytes } from 'node:crypto';

import { createAuth } from '@keystone-6/auth';
import { statelessSessions } from '@keystone-6/core/session';

let sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV !== 'production') {
  sessionSecret = randomBytes(32).toString('base64');
}

const { withAuth } = createAuth({
  listKey: 'User',
  identityField: 'email',
  sessionData: 'id active roles',
  secretField: 'password',
  initFirstItem:
    process.env.NODE_ENV === 'production'
      ? undefined
      : {
          fields: ['name', 'email', 'password'],
          itemData: { roles: ['SUPER'] },
        },
});

const sessionMaxAge = 2_592_000; // 30 days

const session = statelessSessions({
  maxAge: sessionMaxAge,
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  secret: sessionSecret!,
});

export { withAuth, session };
