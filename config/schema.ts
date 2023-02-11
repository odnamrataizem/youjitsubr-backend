/* eslint-disable @typescript-eslint/naming-convention */
import type { Lists } from '.keystone/types';
import { list } from '@keystone-6/core';
import { allOperations, allowAll } from '@keystone-6/core/access';
import {
  checkbox,
  integer,
  multiselect,
  password,
  relationship,
  text,
  timestamp,
} from '@keystone-6/core/fields';

import { createdAt, picture, rich, updatedAt, withSlug } from './fields';

function hasRole(session: any, ...role: string[]): boolean {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const roles: string[] = session?.data.roles ?? [];

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return (
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    session?.data.active &&
    (roles.includes('SUPER') || roles.some(r => role.includes(r)))
  );
}

function maybeArray<T>(item: T | T[] | readonly T[]) {
  if (Array.isArray(item)) {
    return item;
  }

  return [item] as readonly T[];
}

export const lists: Lists = {
  User: withSlug(
    list({
      access: {
        operation: {
          ...allOperations(({ session }) => hasRole(session, 'ADMIN')),
          query: allowAll,
        },
      },
      hooks: {
        validateInput({ operation, resolvedData, addValidationError }) {
          if (
            (operation === 'create' && !resolvedData.picture.id) ||
            (operation === 'update' && resolvedData.picture.id === null)
          ) {
            addValidationError('Missing required field: picture');
          }

          if (
            !(resolvedData.roles as unknown[])?.length &&
            (operation === 'create' ||
              (operation === 'update' && resolvedData.roles !== undefined))
          ) {
            addValidationError('Missing required field: roles');
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
        roles: multiselect({
          access: {
            create: ({ session }) => hasRole(session, 'SUPER'),
            update: ({ session }) => hasRole(session, 'SUPER'),
          },
          type: 'enum',
          options: [
            { label: 'Super', value: 'SUPER' },
            { label: 'Admin', value: 'ADMIN' },
            { label: 'User', value: 'USER' },
          ],
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
        active: checkbox({
          defaultValue: true,
        }),
        createdAt,
      },
    }),
  ),
  Page: withSlug(
    list({
      access: {
        operation: {
          ...allOperations(({ session }) => hasRole(session, 'ADMIN')),
          query: allowAll,
        },
      },
      fields: {
        title: text({
          validation: {
            isRequired: true,
          },
        }),
        content: rich,
        cover: picture,
        weight: integer({
          validation: {
            isRequired: true,
          },
        }),
        createdAt,
        updatedAt,
      },
    }),
  ),
  Post: withSlug(
    list({
      access: {
        operation: {
          ...allOperations(({ session }) => hasRole(session, 'USER', 'ADMIN')),
          query: allowAll,
        },
        item: {
          async update({ session, context, item }) {
            if (!session) {
              return false;
            }

            if (hasRole(session, 'ADMIN')) {
              return true;
            }

            const query = await context.prisma.post.findFirst({
              where: {
                id: { equals: item.id },
              },
              select: {
                authors: {
                  select: {
                    id: true,
                  },
                },
              },
            });

            return (
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              query?.authors.some(item => item.id === session?.data.id) ?? false
            );
          },
        },
      },
      hooks: {
        async validateInput({
          item,
          operation,
          resolvedData,
          context,
          addValidationError,
        }) {
          if (
            (operation === 'create' && !resolvedData.cover.id) ||
            (operation === 'update' && resolvedData.cover.id === null)
          ) {
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
        authors: relationship({
          access: {
            create: ({ session, inputData }) =>
              hasRole(session, 'ADMIN') ||
              (!inputData.authors?.create &&
                maybeArray(inputData.authors?.connect ?? []).some(
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  item => item.id === session.data.id,
                )),
            update: ({ session, inputData }) =>
              hasRole(session, 'ADMIN') ||
              (!inputData.authors?.create &&
                !inputData.authors?.set &&
                !maybeArray(inputData.authors?.disconnect ?? []).some(
                  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                  item => item.id === session.data.id,
                )),
          },
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
      access: {
        operation: {
          ...allOperations(({ session }) => Boolean(session)),
          query: allowAll,
        },
      },
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
      access: {
        operation: {
          ...allOperations(({ session }) => hasRole(session, 'ADMIN')),
          query: allowAll,
        },
      },
      hooks: {
        validateInput({ operation, resolvedData, addValidationError }) {
          if (
            (operation === 'create' && !resolvedData.cover.id) ||
            (operation === 'update' && resolvedData.cover.id === null)
          ) {
            addValidationError('Missing required field: cover');
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
