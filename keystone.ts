import { basename } from 'node:path';
import { Readable } from 'node:stream';

import { extract } from '@extractus/oembed-extractor';
import { config } from '@keystone-6/core';
import type { DatabaseProvider } from '@keystone-6/core/types';
import fetch from 'node-fetch';

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
    ui: {
      isAccessAllowed({ session }) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
        return session?.data?.active ?? false;
      },
    },
    server: {
      extendExpressApp(app, context) {
        app.post('/fetch-image', async (request, response) => {
          if (!context.session) {
            response.status(403).send();
            return;
          }

          let url: URL;
          try {
            url = new URL(request.query.url as string);
          } catch (error: unknown) {
            console.error(error);
            response.status(400).send();
            return;
          }

          const fileResponse = await fetch(url.href);

          if (!fileResponse.ok) {
            response.status(500).send();
            return;
          }

          try {
            const chunks: Buffer[] = [];
            for await (const chunk of fileResponse.body) {
              chunks.push(chunk as Buffer);
            }

            const fileContents = Readable.from(Buffer.concat(chunks));

            const imageStorage = context.images('myLocal');
            const result = await imageStorage.getDataFromStream(
              fileContents,
              basename(url.pathname),
            );
            response.send({
              ...result,
              src: await imageStorage.getUrl(result.id, result.extension),
            });
          } catch (error: unknown) {
            console.error(error);
            response.status(500).send(error);
          }
        });

        app.get('/oembed-proxy', async (request, response) => {
          if (!context.session) {
            response.status(403).send();
            return;
          }

          let url: URL;
          try {
            url = new URL(request.query.url as string);
          } catch (error: unknown) {
            console.error(error);
            response.status(400).send();
            return;
          }

          try {
            response.send(
              await extract(url.href, {
                maxwidth: 1000,
                maxheight: 1000,
              }),
            );
          } catch (error: unknown) {
            console.error(error);
            response.status(500).send(error);
          }
        });
      },
    },
  }),
);
