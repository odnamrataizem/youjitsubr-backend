/* eslint-disable @typescript-eslint/naming-convention */
import type { Lists } from '.keystone/types';
import { list } from '@keystone-6/core';
import { allowAll } from '@keystone-6/core/access';
import {
  text,
  relationship,
  password,
  timestamp,
  checkbox,
} from '@keystone-6/core/fields';

import { createdAt, picture, rich, updatedAt, withSlug } from './fields';

export const lists: Lists = {
  User: withSlug(
    list({
      access: allowAll,
      fields: {
        name: text({
          validation: {
            isRequired: true,
          },
        }),
        description: rich,
        picture,
        email: text({
          validation: {
            isRequired: true,
          },
          isIndexed: 'unique',
        }),
        password: password({
          validation: {
            isRequired: true,
            rejectCommon: true,
          },
        }),
        posts: relationship({
          ref: 'Post.authors',
          many: true,
          ui: {
            createView: {
              fieldMode: 'hidden',
            },
            itemView: {
              fieldMode: 'hidden',
            },
          },
        }),
        createdAt,
      },
    }),
  ),

  Post: withSlug(
    list({
      access: allowAll,
      fields: {
        title: text({
          validation: {
            isRequired: true,
          },
        }),
        lead: text({
          validation: {
            isRequired: true,
          },
        }),
        content: rich,
        cover: picture,
        sticky: checkbox(),
        authors: relationship({
          ref: 'User.posts',
          many: true,
        }),
        category: relationship({
          ref: 'Category.posts',
        }),
        tags: relationship({
          ref: 'Tag.posts',
          many: true,
          ui: {
            displayMode: 'cards',
            cardFields: ['name'],
            inlineEdit: {
              fields: ['name'],
            },
            linkToItem: true,
            inlineConnect: true,
            inlineCreate: {
              fields: ['name'],
            },
          },
        }),
        createdAt,
        updatedAt,
        publishedAt: timestamp({
          defaultValue: {
            kind: 'now',
          },
          ui: {
            description: "Optionally customise this post's publish date.",
          },
        }),
      },
    }),
  ),
  Tag: withSlug(
    list({
      access: allowAll,
      ui: {
        isHidden: true,
      },
      fields: {
        name: text({
          validation: {
            isRequired: true,
          },
        }),
        posts: relationship({
          ref: 'Post.tags',
          many: true,
        }),
        createdAt,
      },
    }),
  ),
  Category: withSlug(
    list({
      access: allowAll,
      fields: {
        name: text({
          validation: {
            isRequired: true,
          },
        }),
        description: rich,
        cover: picture,
        posts: relationship({
          ref: 'Post.category',
          many: true,
          ui: {
            createView: {
              fieldMode: 'hidden',
            },
            itemView: {
              fieldMode: 'hidden',
            },
          },
        }),
        createdAt,
      },
    }),
  ),
};
