import type { BaseFields, list } from '@keystone-6/core';
import { allOperations, allowAll, denyAll } from '@keystone-6/core/access';
import { text, timestamp, image } from '@keystone-6/core/fields';
import type { BaseListTypeInfo } from '@keystone-6/core/types';
import { document } from '@keystone-6/fields-document';
import { slugify } from 'transliteration';

import { componentBlocks } from './component-blocks';

export const createdAt = timestamp({
  defaultValue: {
    kind: 'now',
  },
  access: {
    ...allOperations(denyAll),
    read: allowAll,
  },
  ui: {
    createView: {
      fieldMode: 'hidden',
    },
    itemView: {
      fieldMode: 'read',
    },
  },
  db: {
    isNullable: false,
  },
});

export const updatedAt = timestamp({
  defaultValue: {
    kind: 'now',
  },
  access: {
    ...allOperations(denyAll),
    read: allowAll,
  },
  ui: {
    createView: {
      fieldMode: 'hidden',
    },
    itemView: {
      fieldMode: 'read',
    },
  },
  db: {
    updatedAt: true,
    isNullable: false,
  },
});

export const picture = image({
  storage: 'myLocal',
});

export const rich = document({
  ui: {
    views: './config/component-blocks',
  },
  componentBlocks,
  formatting: {
    inlineMarks: {
      bold: true,
      italic: true,
      strikethrough: true,
      code: true,
      superscript: true,
      subscript: true,
      keyboard: true,
    },
    listTypes: true,
    headingLevels: [2, 3, 4, 5, 6],
    blockTypes: true,
    softBreaks: true,
  },
  layouts: [
    [1, 1],
    [1, 1, 1],
    [2, 1],
    [1, 2],
    [1, 2, 1],
  ],
  links: true,
  dividers: true,
});

export function withSlug<
  Fields extends BaseFields<ListTypeInfo>,
  ListTypeInfo extends BaseListTypeInfo,
>(config: ReturnType<typeof list<Fields, ListTypeInfo>>) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  const fields = Object.entries(config.fields);
  for (const [index, [fieldName]] of fields.entries()) {
    if (fieldName === 'name' || fieldName === 'title') {
      fields.splice(index + 1, 0, [
        'slug',
        text({
          isIndexed: 'unique',
          ui: {
            description:
              'A machine-friendly name. Autocalculated if empty (recommended).',
          },
        }),
      ]);
      break;
    }
  }

  config.fields = Object.fromEntries(fields);

  if (!('slug' in config.fields)) {
    return config;
  }

  const { resolveInput } = config.hooks ?? {};
  config.hooks = {
    ...config.hooks,
    resolveInput(parameters) {
      parameters.resolvedData =
        resolveInput?.(parameters) ?? parameters.resolvedData;

      const { resolvedData, inputData, item } = parameters;
      let slug = '';

      if (inputData.slug === '' || !item?.slug) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        slug =
          resolvedData.name ||
          item?.name ||
          resolvedData.title ||
          item?.title ||
          '';
      }

      if (slug) {
        slug = slugify(slug);
        // @ts-expect-error - `resolvedData.slug` isn't defined yet
        resolvedData.slug = slug;
      }

      return resolvedData;
    },
  };

  return config;
}
