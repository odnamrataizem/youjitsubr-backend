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
  select,
} from '@keystone-6/core/fields';

import { createdAt, picture, rich, updatedAt, withSlug } from './fields';

export function extractTime(date: Date) {
  return [
    date.getFullYear().toString().padStart(4, '0'),
    (date.getMonth() + 1).toString().padStart(2, '0'),
  ] as const;
}

export const lists: Lists = {
  User: withSlug(
    list({
      access: allowAll,
      hooks: {
        validateInput({ resolvedData, addValidationError }) {
          if (!resolvedData.picture.id) {
            addValidationError('Missing required field: picture');
          }
        },
      },
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
      hooks: {
        async validateInput({
          item,
          operation,
          resolvedData,
          context,
          addValidationError,
        }) {
          if (resolvedData.kind === 'PAGE') {
            return;
          }

          if (!resolvedData.cover.id) {
            addValidationError('Missing required field: cover');
          }

          // Many fields
          for (const field of ['authors', 'tags'] as const) {
            if (operation === 'create' && !resolvedData[field]) {
              addValidationError(`Missing required relationship: ${field}`);
              continue;
            }

            const query =
              // eslint-disable-next-line no-await-in-loop
              await context.prisma.post.findFirst({
                where: {
                  id: { equals: item?.id },
                },
                select: {
                  _count: {
                    select: {
                      [field]: true,
                    },
                  },
                },
              });
            // @ts-expect-error - TS bug?
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const currentCount = query?._count?.[field] || 0;
            // @ts-expect-error - TS bug?
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            const deletedCount = resolvedData?.[field]?.disconnect?.length || 0;

            if (currentCount && currentCount === deletedCount) {
              addValidationError(`Missing required relationship: ${field}`);
            }
          }

          // Single fields
          for (const field of ['category'] as const) {
            const hasExistingField =
              // eslint-disable-next-line no-await-in-loop
              (await context.prisma.post.count({
                where: {
                  id: { equals: item?.id },
                  [field]: { isNot: null },
                },
              })) > 0;
            const noField = !resolvedData[field];
            // @ts-expect-error - TS bug?
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const fieldRemoved = resolvedData[field]?.disconnect;

            if (
              (operation === 'create' && noField) ||
              (operation === 'update' &&
                (fieldRemoved || (noField && !hasExistingField)))
            )
              addValidationError(`Missing required relationship: ${field}`);
          }
        },
      },
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
        kind: select({
          validation: {
            isRequired: true,
          },
          type: 'enum',
          options: [
            {
              label: 'Post',
              value: 'POST',
            },
            {
              label: 'Page',
              value: 'PAGE',
            },
          ],
          defaultValue: 'POST',
          ui: {
            displayMode: 'segmented-control',
          },
        }),
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
      hooks: {
        validateInput({ resolvedData, addValidationError }) {
          if (!resolvedData.cover.id) {
            addValidationError('Missing required field: picture');
          }
        },
      },
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
