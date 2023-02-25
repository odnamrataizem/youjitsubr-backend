/* eslint-disable @typescript-eslint/naming-convention */
import { createHmac } from 'node:crypto';

import type { Lists } from '.keystone/types';
import { list } from '@keystone-6/core';
import { allOperations, allowAll } from '@keystone-6/core/access';
import {
  checkbox,
  integer,
  multiselect,
  password,
  relationship,
  select,
  text,
  timestamp,
} from '@keystone-6/core/fields';
import range from 'lodash.range';
import fetch from 'node-fetch';

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

async function refreshPaths(paths: string[]) {
  const baseUrl = process.env.FRONTEND_BASE_URL;

  if (!baseUrl) {
    console.log(
      'Not refreshing paths: `FRONTEND_BASE_URL` environment variable not configured.',
    );
    return;
  }

  paths = [...new Set(paths)];

  const body = JSON.stringify(paths);
  const signature = createHmac('sha256', process.env.WEBHOOK_SECRET ?? '')
    .update(body)
    .digest('hex');

  console.log(`Revalidating paths (signature ${signature}):`);

  for (const path of paths) {
    console.log(`- ${path}`);
  }

  try {
    await fetch(`${baseUrl}/api/revalidate`, {
      headers: {
        'x-signature': signature,
      },
      body,
      method: 'POST',
    });
  } catch (error: unknown) {
    console.error(error);
  }
}

function extractTime(date: Date) {
  return [
    date.getFullYear().toString().padStart(4, '0'),
    (date.getMonth() + 1).toString().padStart(2, '0'),
  ] as const;
}

type TimeFolder = {
  year: string;
  month: string;
  length: number;
};

const POSTS_PER_PAGE = 30;
const PAGE_PREFIX = '~p';

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
          query: allowAll,
          create: ({ session }) => hasRole(session, 'ADMIN'),
          update: ({ session }) => hasRole(session, 'USER', 'ADMIN'),
          delete: ({ session }) => hasRole(session, 'ADMIN'),
        },
        item: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          update: ({ session, item }) => item.id === session?.data.id,
        },
      },
      hooks: {
        async validateInput({
          operation,
          resolvedData,
          context,
          addValidationError,
        }) {
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

          const supers = await context.prisma.user.findMany({
            select: {
              id: true,
            },
            where: {
              roles: {
                array_contains: 'SUPER',
              },
            },
          });

          if (
            resolvedData.roles &&
            operation === 'update' &&
            !(resolvedData.roles as string[]).includes('SUPER') &&
            supers.length === 1 &&
            supers[0].id === resolvedData.id
          ) {
            addValidationError('This is the last Super user!');
          }
        },
        async validateDelete({ item, context, addValidationError }) {
          const superCount = await context.prisma.user.count({
            where: {
              roles: {
                array_contains: 'SUPER',
              },
            },
          });

          if ((item.roles as string[]).includes('SUPER') && superCount === 1) {
            addValidationError('This is the last Super user!');
          }
        },
        async afterOperation({ item, originalItem, context }) {
          const paths = ['/', '/people'];

          const posts = await context.prisma.post.findMany({
            select: {
              id: true,
              slug: true,
              publishedAt: true,
              category: {
                select: {
                  slug: true,
                },
              },
            },
            where: {
              authors: {
                some: {
                  id: (item ?? originalItem).id,
                },
              },
              status: 'PUBLISHED',
            },
          });

          let subpaths: string[] = [];
          if (posts.length > 0) {
            const pages = Math.ceil(posts.length / POSTS_PER_PAGE);
            subpaths = range(2, pages + 1).map(p => `/${PAGE_PREFIX}${p}`);
          }

          if (originalItem) {
            const prefix = `/people/${originalItem.slug}`;
            paths.push(prefix, ...subpaths.map(p => prefix + p));
          }

          if (item) {
            const prefix = `/people/${item.slug}`;
            paths.push(prefix, ...subpaths.map(p => prefix + p));
          }

          paths.push(
            ...posts.map(
              post =>
                `/posts/${post.category?.slug ?? ''}/${extractTime(
                  post.publishedAt ?? new Date(),
                ).join('/')}/${post.slug}`,
            ),
          );

          await refreshPaths(paths);
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
      hooks: {
        validateInput({ operation, resolvedData, addValidationError }) {
          if (
            (operation === 'create' && !resolvedData.cover.id) ||
            (operation === 'update' && resolvedData.cover.id === null)
          ) {
            addValidationError('Missing required field: cover');
          }
        },
        async afterOperation({ item, originalItem }) {
          const paths: string[] = [];

          if (originalItem) {
            const prefix = `/${originalItem.slug}`;
            paths.push(prefix);
          }

          if (item) {
            const prefix = `/${item.slug}`;
            paths.push(prefix);
          }

          await refreshPaths(paths);
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
        resolveInput({ resolvedData, inputData, item }) {
          if (
            (inputData.status ?? item?.status) === 'PUBLISHED' &&
            !(inputData.publishedAt ?? item?.publishedAt)
          ) {
            resolvedData.publishedAt = new Date();
          }

          return resolvedData;
        },
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
        // eslint-disable-next-line complexity
        async afterOperation({
          operation,
          resolvedData,
          originalItem,
          item,
          context,
        }) {
          if (
            (operation === 'create' && item?.status === 'DRAFT') ||
            (operation === 'update' &&
              item?.status === 'DRAFT' &&
              item?.status === originalItem?.status) ||
            (operation === 'delete' && originalItem?.status === 'DRAFT')
          ) {
            return;
          }

          const paths: string[] = ['/', '/posts', '/posts/~all'];

          for (const it of [originalItem, item]) {
            if (it?.status !== 'PUBLISHED') {
              continue;
            }

            // eslint-disable-next-line no-await-in-loop
            const category = await context.prisma.category.findFirst({
              select: {
                id: true,
                slug: true,
              },
              where: {
                id: it.categoryId ?? '',
              },
            });
            paths.push(
              `/posts/${category?.slug ?? ''}/${extractTime(
                it.publishedAt ?? new Date(),
              ).join('/')}/${it.slug}`,
            );

            // eslint-disable-next-line no-await-in-loop
            const posts = await context.prisma.post.findMany({
              select: {
                publishedAt: true,
              },
              where: {
                categoryId: it.categoryId,
                status: 'PUBLISHED',
              },
            });

            const folders = posts
              // eslint-disable-next-line unicorn/no-array-reduce
              .reduce<TimeFolder[]>((previous, current) => {
                const [year, month] = extractTime(
                  current.publishedAt ?? new Date(),
                );

                let yearItem = previous.find(
                  item => item.year === year && !item.month,
                );
                if (!yearItem) {
                  yearItem = { year, month: '', length: 0 };
                  previous.push(yearItem);
                }

                yearItem.length++;

                let monthItem = previous.find(
                  item => item.year === year && item.month === month,
                );
                if (!monthItem) {
                  monthItem = { year, month, length: 0 };
                  previous.push(monthItem);
                }

                monthItem.length++;

                return previous;
              }, [])
              .map(
                ({ year, month, length }) =>
                  [
                    [year, month].filter(Boolean),
                    Array.from({ length }),
                  ] as const,
              );

            const subpaths: string[] = [];
            for (const [folder, posts] of folders) {
              const pages = Math.ceil(posts.length / POSTS_PER_PAGE);
              const folderPath = folder.filter(Boolean).join('/');

              const prefix = `/${folderPath}`;
              subpaths.push(
                prefix,
                ...range(2, pages + 2).map(p => `${prefix}/${PAGE_PREFIX}${p}`),
              );
            }

            const prefix = `/posts/${category?.slug ?? ''}`;
            paths.push(prefix, ...subpaths.map(p => prefix + p));
          }

          if (operation !== 'update' || resolvedData?.tags) {
            const tags = await context.prisma.tag.findMany({
              select: {
                id: true,
                slug: true,
              },
              where: {
                posts: {
                  some: {
                    id: item?.id,
                  },
                },
              },
            });

            for (const tag of tags) {
              // eslint-disable-next-line no-await-in-loop
              const postCount = await context.prisma.post.count({
                where: {
                  tags: {
                    some: {
                      id: tag.id,
                    },
                  },
                  status: 'PUBLISHED',
                },
              });
              const pages = Math.ceil(postCount / POSTS_PER_PAGE);
              const subpaths = range(2, pages + 2).map(
                p => `/${PAGE_PREFIX}${p}`,
              );
              paths.push(...subpaths.map(p => `/tags/${tag.slug}${p}`));
            }
          }

          if (operation !== 'update' || resolvedData?.authors) {
            const users = await context.prisma.user.findMany({
              select: {
                id: true,
                slug: true,
              },
              where: {
                posts: {
                  some: {
                    id: item?.id,
                  },
                },
              },
            });

            for (const user of users) {
              // eslint-disable-next-line no-await-in-loop
              const postCount = await context.prisma.post.count({
                where: {
                  authors: {
                    some: {
                      id: user.id,
                    },
                  },
                  status: 'PUBLISHED',
                },
              });
              const pages = Math.ceil(postCount / POSTS_PER_PAGE);
              const subpaths = range(2, pages + 2).map(
                p => `/${PAGE_PREFIX}${p}`,
              );
              paths.push(...subpaths.map(p => `/people/${user.slug}${p}`));
            }
          }

          await refreshPaths(paths);
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
        status: select({
          validation: {
            isRequired: true,
          },
          defaultValue: 'DRAFT',
          type: 'enum',
          options: [
            { label: 'Draft', value: 'DRAFT' },
            { label: 'Published', value: 'PUBLISHED' },
          ],
          ui: {
            displayMode: 'segmented-control',
          },
        }),
        publishedAt: timestamp({
          ui: {
            description: "Optionally customise this post's publish date.",
          },
        }),
        sticky: checkbox({
          ui: {
            description: 'If checked, this post will be displayed at the top.',
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
      hooks: {
        async afterOperation({ item, originalItem, context }) {
          const paths = ['/', '/tags'];

          const posts = await context.prisma.post.findMany({
            select: {
              id: true,
              slug: true,
              publishedAt: true,
              category: {
                select: {
                  slug: true,
                },
              },
            },
            where: {
              tags: {
                some: {
                  id: (item ?? originalItem).id,
                },
              },
              status: 'PUBLISHED',
            },
          });

          let subpaths: string[] = [];
          if (posts.length > 0) {
            const pages = Math.ceil(posts.length / POSTS_PER_PAGE);
            subpaths = range(2, pages + 1).map(p => `/${PAGE_PREFIX}${p}`);
          }

          if (originalItem) {
            const prefix = `/tags/${originalItem.slug}`;
            paths.push(prefix, ...subpaths.map(p => prefix + p));
          }

          if (item) {
            const prefix = `/tags/${item.slug}`;
            paths.push(prefix, ...subpaths.map(p => prefix + p));
          }

          paths.push(
            ...posts.map(
              post =>
                `/posts/${post.category?.slug ?? ''}/${extractTime(
                  post.publishedAt ?? new Date(),
                ).join('/')}/${post.slug}`,
            ),
          );

          await refreshPaths(paths);
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
        async afterOperation({ item, originalItem, context }) {
          const paths = ['/', '/posts'];

          const posts = await context.prisma.post.findMany({
            select: {
              id: true,
              slug: true,
              publishedAt: true,
              category: {
                select: {
                  slug: true,
                },
              },
            },
            where: {
              category: {
                id: (item ?? originalItem).id,
              },
              status: 'PUBLISHED',
            },
          });

          let subpaths: string[] = [];
          if (posts.length > 0) {
            const pages = Math.ceil(posts.length / POSTS_PER_PAGE);
            subpaths = range(2, pages + 1).map(p => `/${PAGE_PREFIX}${p}`);
          }

          const folders = posts
            // eslint-disable-next-line unicorn/no-array-reduce
            .reduce<TimeFolder[]>((previous, current) => {
              const [year, month] = extractTime(
                current.publishedAt ?? new Date(),
              );

              let yearItem = previous.find(
                item => item.year === year && !item.month,
              );
              if (!yearItem) {
                yearItem = { year, month: '', length: 0 };
                previous.push(yearItem);
              }

              yearItem.length++;

              let monthItem = previous.find(
                item => item.year === year && item.month === month,
              );
              if (!monthItem) {
                monthItem = { year, month, length: 0 };
                previous.push(monthItem);
              }

              monthItem.length++;

              return previous;
            }, [])
            .map(
              ({ year, month, length }) =>
                [
                  [year, month].filter(Boolean),
                  Array.from({ length }),
                ] as const,
            );

          for (const [folder, posts] of folders) {
            if (posts.length > 0) {
              const pages = Math.ceil(posts.length / POSTS_PER_PAGE);
              const folderPath = folder.filter(Boolean).join('/');
              const prefix = `/${folderPath}`;
              subpaths.push(
                prefix,
                ...range(2, pages + 1).map(p => `${prefix}/${PAGE_PREFIX}${p}`),
              );
            }
          }

          if (originalItem) {
            const prefix = `/posts/${originalItem.slug}`;
            paths.push(prefix, ...subpaths.map(p => prefix + p));
          }

          if (item) {
            const prefix = `/posts/${item.slug}`;
            paths.push(prefix, ...subpaths.map(p => prefix + p));
          }

          paths.push(
            ...posts.map(
              post =>
                `/posts/${post.category?.slug ?? ''}/${extractTime(
                  post.publishedAt ?? new Date(),
                ).join('/')}/${post.slug}`,
            ),
          );

          await refreshPaths(paths);
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
