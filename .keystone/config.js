"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// keystone.ts
var keystone_exports = {};
__export(keystone_exports, {
  default: () => keystone_default
});
module.exports = __toCommonJS(keystone_exports);
var import_core2 = require("@keystone-6/core");

// config/_bootstrap-env.ts
var import_dotenv = __toESM(require("dotenv"));
import_dotenv.default.config();

// config/auth.ts
var import_node_crypto = require("node:crypto");
var import_auth = require("@keystone-6/auth");
var import_session = require("@keystone-6/core/session");
var sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV !== "production") {
  sessionSecret = (0, import_node_crypto.randomBytes)(32).toString("base64");
}
var { withAuth } = (0, import_auth.createAuth)({
  listKey: "User",
  identityField: "email",
  sessionData: "id active roles",
  secretField: "password",
  initFirstItem: process.env.NODE_ENV === "production" ? void 0 : {
    fields: ["name", "email", "password"],
    itemData: { roles: ["SUPER"] }
  }
});
var sessionMaxAge = 2592e3;
var session = (0, import_session.statelessSessions)({
  maxAge: sessionMaxAge,
  secret: sessionSecret
});

// config/schema.ts
var import_node_crypto2 = require("node:crypto");
var import_core = require("@keystone-6/core");
var import_access2 = require("@keystone-6/core/access");
var import_fields2 = require("@keystone-6/core/fields");
var import_lodash = __toESM(require("lodash.range"));
var import_node_fetch = __toESM(require("node-fetch"));

// config/fields.ts
var import_access = require("@keystone-6/core/access");
var import_fields = require("@keystone-6/core/fields");
var import_fields_document = require("@keystone-6/fields-document");
var import_transliteration = require("transliteration");
var createdAt = (0, import_fields.timestamp)({
  defaultValue: {
    kind: "now"
  },
  access: {
    ...(0, import_access.allOperations)(import_access.denyAll),
    read: import_access.allowAll
  },
  ui: {
    createView: {
      fieldMode: "hidden"
    },
    itemView: {
      fieldMode: "read"
    }
  },
  db: {
    isNullable: false
  }
});
var updatedAt = (0, import_fields.timestamp)({
  defaultValue: {
    kind: "now"
  },
  access: {
    ...(0, import_access.allOperations)(import_access.denyAll),
    read: import_access.allowAll
  },
  ui: {
    createView: {
      fieldMode: "hidden"
    },
    itemView: {
      fieldMode: "read"
    }
  },
  db: {
    updatedAt: true,
    isNullable: false
  }
});
var picture = (0, import_fields.image)({
  storage: "myLocal"
});
var rich = (0, import_fields_document.document)({
  formatting: {
    inlineMarks: {
      bold: true,
      italic: true,
      strikethrough: true,
      code: true,
      superscript: true,
      subscript: true,
      keyboard: true
    },
    listTypes: true,
    headingLevels: [2, 3, 4, 5, 6],
    blockTypes: true,
    softBreaks: true
  },
  layouts: [
    [1, 1],
    [1, 1, 1],
    [2, 1],
    [1, 2],
    [1, 2, 1]
  ],
  links: true,
  dividers: true
});
function withSlug(config2) {
  const fields = Object.entries(config2.fields);
  for (const [index, [fieldName]] of fields.entries()) {
    if (fieldName === "name" || fieldName === "title") {
      fields.splice(index + 1, 0, [
        "slug",
        (0, import_fields.text)({
          isIndexed: "unique",
          ui: {
            description: "A machine-friendly name. Autocalculated if empty (recommended)."
          }
        })
      ]);
      break;
    }
  }
  config2.fields = Object.fromEntries(fields);
  if (!("slug" in config2.fields)) {
    return config2;
  }
  const { resolveInput } = config2.hooks ?? {};
  config2.hooks = {
    ...config2.hooks,
    resolveInput(parameters) {
      parameters.resolvedData = resolveInput?.(parameters) ?? parameters.resolvedData;
      const { resolvedData, inputData, item } = parameters;
      let slug = "";
      if (inputData.slug === "" || !item?.slug) {
        slug = resolvedData.name || item?.name || resolvedData.title || item?.title || "";
      }
      if (slug) {
        slug = (0, import_transliteration.slugify)(slug);
        resolvedData.slug = slug;
      }
      return resolvedData;
    }
  };
  return config2;
}

// config/schema.ts
function hasRole(session2, ...role) {
  const roles = session2?.data.roles ?? [];
  return session2?.data.active && (roles.includes("SUPER") || roles.some((r) => role.includes(r)));
}
async function refreshPaths(paths) {
  const baseUrl = process.env.FRONTEND_BASE_URL;
  if (!baseUrl) {
    console.log(
      "Not refreshing paths: `FRONTEND_BASE_URL` environment variable not configured."
    );
    return;
  }
  paths = [...new Set(paths)];
  const body = JSON.stringify(paths);
  const signature = (0, import_node_crypto2.createHmac)("sha256", process.env.WEBHOOK_SECRET ?? "").update(body).digest("hex");
  console.log(`Revalidating paths (signature ${signature}):`);
  for (const path of paths) {
    console.log(`- ${path}`);
  }
  try {
    await (0, import_node_fetch.default)(`${baseUrl}/api/revalidate`, {
      headers: {
        "x-signature": signature
      },
      body,
      method: "POST"
    });
  } catch (error) {
    console.error(error);
  }
}
function extractTime(date) {
  return [
    date.getFullYear().toString().padStart(4, "0"),
    (date.getMonth() + 1).toString().padStart(2, "0")
  ];
}
var POSTS_PER_PAGE = 30;
var PAGE_PREFIX = "~p";
function maybeArray(item) {
  if (Array.isArray(item)) {
    return item;
  }
  return [item];
}
var lists = {
  User: withSlug(
    (0, import_core.list)({
      access: {
        operation: {
          query: import_access2.allowAll,
          create: ({ session: session2 }) => hasRole(session2, "ADMIN"),
          update: ({ session: session2 }) => hasRole(session2, "USER", "ADMIN"),
          delete: ({ session: session2 }) => hasRole(session2, "ADMIN")
        },
        item: {
          update: ({ session: session2, item }) => item.id === session2?.data.id
        }
      },
      hooks: {
        async validateInput({
          operation,
          resolvedData,
          context,
          addValidationError
        }) {
          if (operation === "create" && !resolvedData.picture.id || operation === "update" && resolvedData.picture.id === null) {
            addValidationError("Missing required field: picture");
          }
          if (!resolvedData.roles?.length && (operation === "create" || operation === "update" && resolvedData.roles !== void 0)) {
            addValidationError("Missing required field: roles");
          }
          const supers = await context.prisma.user.findMany({
            select: {
              id: true
            },
            where: {
              roles: {
                array_contains: "SUPER"
              }
            }
          });
          if (operation === "update" && !resolvedData.roles.includes("SUPER") && supers.length === 1 && supers[0].id === resolvedData.id) {
            addValidationError("This is the last Super user!");
          }
        },
        async validateDelete({ item, context, addValidationError }) {
          const superCount = await context.prisma.user.count({
            where: {
              roles: {
                array_contains: "SUPER"
              }
            }
          });
          if (item.roles.includes("SUPER") && superCount === 1) {
            addValidationError("This is the last Super user!");
          }
        },
        async afterOperation({ item, originalItem, context }) {
          const paths = ["/", "/people"];
          const posts = await context.prisma.post.findMany({
            select: {
              id: true,
              slug: true,
              publishedAt: true,
              category: {
                select: {
                  slug: true
                }
              }
            },
            where: {
              authors: {
                some: {
                  id: (item ?? originalItem).id
                }
              },
              status: "PUBLISHED"
            }
          });
          let subpaths = [];
          if (posts.length > 0) {
            const pages = Math.ceil(posts.length / POSTS_PER_PAGE);
            subpaths = (0, import_lodash.default)(2, pages + 1).map((p) => `/${PAGE_PREFIX}${p}`);
          }
          if (originalItem) {
            const prefix = `/people/${originalItem.slug}`;
            paths.push(prefix, ...subpaths.map((p) => prefix + p));
          }
          if (item) {
            const prefix = `/people/${item.slug}`;
            paths.push(prefix, ...subpaths.map((p) => prefix + p));
          }
          paths.push(
            ...posts.map(
              (post) => `/posts/${post.category?.slug ?? ""}/${extractTime(
                post.publishedAt ?? new Date()
              ).join("/")}/${post.slug}`
            )
          );
          await refreshPaths(paths);
        }
      },
      fields: {
        name: (0, import_fields2.text)({
          validation: {
            isRequired: true
          }
        }),
        description: rich,
        picture,
        email: (0, import_fields2.text)({
          validation: {
            isRequired: true
          },
          isIndexed: "unique"
        }),
        password: (0, import_fields2.password)({
          validation: {
            isRequired: true,
            rejectCommon: true
          }
        }),
        roles: (0, import_fields2.multiselect)({
          access: {
            create: ({ session: session2 }) => hasRole(session2, "SUPER"),
            update: ({ session: session2 }) => hasRole(session2, "SUPER")
          },
          type: "enum",
          options: [
            { label: "Super", value: "SUPER" },
            { label: "Admin", value: "ADMIN" },
            { label: "User", value: "USER" }
          ]
        }),
        posts: (0, import_fields2.relationship)({
          ref: "Post.authors",
          many: true,
          ui: {
            createView: {
              fieldMode: "hidden"
            },
            itemView: {
              fieldMode: "hidden"
            }
          }
        }),
        active: (0, import_fields2.checkbox)({
          defaultValue: true
        }),
        createdAt
      }
    })
  ),
  Page: withSlug(
    (0, import_core.list)({
      access: {
        operation: {
          ...(0, import_access2.allOperations)(({ session: session2 }) => hasRole(session2, "ADMIN")),
          query: import_access2.allowAll
        }
      },
      hooks: {
        async afterOperation({ item, originalItem }) {
          const paths = [];
          if (originalItem) {
            const prefix = `/${originalItem.slug}`;
            paths.push(prefix);
          }
          if (item) {
            const prefix = `/${item.slug}`;
            paths.push(prefix);
          }
          await refreshPaths(paths);
        }
      },
      fields: {
        title: (0, import_fields2.text)({
          validation: {
            isRequired: true
          }
        }),
        content: rich,
        cover: picture,
        weight: (0, import_fields2.integer)({
          validation: {
            isRequired: true
          }
        }),
        createdAt,
        updatedAt
      }
    })
  ),
  Post: withSlug(
    (0, import_core.list)({
      access: {
        operation: {
          ...(0, import_access2.allOperations)(({ session: session2 }) => hasRole(session2, "USER", "ADMIN")),
          query: import_access2.allowAll
        },
        item: {
          async update({ session: session2, context, item }) {
            if (!session2) {
              return false;
            }
            if (hasRole(session2, "ADMIN")) {
              return true;
            }
            const query = await context.prisma.post.findFirst({
              where: {
                id: { equals: item.id }
              },
              select: {
                authors: {
                  select: {
                    id: true
                  }
                }
              }
            });
            return query?.authors.some((item2) => item2.id === session2?.data.id) ?? false;
          }
        }
      },
      hooks: {
        resolveInput({ resolvedData, inputData, item }) {
          if ((inputData.status ?? item?.status) === "PUBLISHED" && !(inputData.publishedAt ?? item?.publishedAt)) {
            resolvedData.publishedAt = new Date();
          }
          return resolvedData;
        },
        async validateInput({
          item,
          operation,
          resolvedData,
          context,
          addValidationError
        }) {
          if (operation === "create" && !resolvedData.cover.id || operation === "update" && resolvedData.cover.id === null) {
            addValidationError("Missing required field: cover");
          }
          for (const field of ["authors", "tags"]) {
            if (operation === "create" && !resolvedData[field]) {
              addValidationError(`Missing required relationship: ${field}`);
              continue;
            }
            const query = await context.prisma.post.findFirst({
              where: {
                id: { equals: item?.id }
              },
              select: {
                _count: {
                  select: {
                    [field]: true
                  }
                }
              }
            });
            const currentCount = query?._count?.[field] || 0;
            const deletedCount = resolvedData?.[field]?.disconnect?.length || 0;
            if (currentCount && currentCount === deletedCount) {
              addValidationError(`Missing required relationship: ${field}`);
            }
          }
          for (const field of ["category"]) {
            const hasExistingField = await context.prisma.post.count({
              where: {
                id: { equals: item?.id },
                [field]: { isNot: null }
              }
            }) > 0;
            const noField = !resolvedData[field];
            const fieldRemoved = resolvedData[field]?.disconnect;
            if (operation === "create" && noField || operation === "update" && (fieldRemoved || noField && !hasExistingField))
              addValidationError(`Missing required relationship: ${field}`);
          }
        },
        async afterOperation({
          operation,
          resolvedData,
          originalItem,
          item,
          context
        }) {
          if (operation === "create" && item?.status === "DRAFT" || operation === "update" && item?.status === "DRAFT" && item?.status === originalItem?.status || operation === "delete" && originalItem?.status === "DRAFT") {
            return;
          }
          const paths = ["/", "/posts", "/posts/~all"];
          for (const it of [originalItem, item]) {
            if (it?.status !== "PUBLISHED") {
              continue;
            }
            const category = await context.prisma.category.findFirst({
              select: {
                id: true,
                slug: true
              },
              where: {
                id: it.categoryId ?? ""
              }
            });
            paths.push(
              `/posts/${category?.slug ?? ""}/${extractTime(
                it.publishedAt ?? new Date()
              ).join("/")}/${it.slug}`
            );
            if (originalItem?.categoryId !== item?.categoryId) {
              const posts = await context.prisma.post.findMany({
                select: {
                  publishedAt: true
                },
                where: {
                  categoryId: it.categoryId,
                  status: "PUBLISHED"
                }
              });
              const folders = posts.reduce((previous, current) => {
                const [year, month] = extractTime(
                  current.publishedAt ?? new Date()
                );
                let yearItem = previous.find(
                  (item2) => item2.year === year && !item2.month
                );
                if (!yearItem) {
                  yearItem = { year, month: "", length: 0 };
                  previous.push(yearItem);
                }
                yearItem.length++;
                let monthItem = previous.find(
                  (item2) => item2.year === year && item2.month === month
                );
                if (!monthItem) {
                  monthItem = { year, month, length: 0 };
                  previous.push(monthItem);
                }
                monthItem.length++;
                return previous;
              }, []).map(
                ({ year, month, length }) => [
                  [year, month].filter(Boolean),
                  Array.from({ length })
                ]
              );
              const subpaths = [];
              for (const [folder, posts2] of folders) {
                const pages = Math.ceil(posts2.length / POSTS_PER_PAGE);
                const folderPath = folder.filter(Boolean).join("/");
                subpaths.push(
                  ...(0, import_lodash.default)(2, pages + 2).map(
                    (p) => `/${folderPath}/${PAGE_PREFIX}${p}`
                  )
                );
              }
              paths.push(...subpaths.map((p) => `/posts/${it.slug}${p}`));
            }
          }
          if (operation !== "update" || resolvedData?.tags) {
            const tags = await context.prisma.tag.findMany({
              select: {
                id: true,
                slug: true
              },
              where: {
                posts: {
                  some: {
                    id: item?.id
                  }
                }
              }
            });
            for (const tag of tags) {
              const postCount = await context.prisma.post.count({
                where: {
                  tags: {
                    some: {
                      id: tag.id
                    }
                  },
                  status: "PUBLISHED"
                }
              });
              const pages = Math.ceil(postCount / POSTS_PER_PAGE);
              const subpaths = (0, import_lodash.default)(2, pages + 2).map(
                (p) => `/${PAGE_PREFIX}${p}`
              );
              paths.push(...subpaths.map((p) => `/tags/${tag.slug}${p}`));
            }
          }
          if (operation !== "update" || resolvedData?.authors) {
            const users = await context.prisma.user.findMany({
              select: {
                id: true,
                slug: true
              },
              where: {
                posts: {
                  some: {
                    id: item?.id
                  }
                }
              }
            });
            for (const user of users) {
              const postCount = await context.prisma.post.count({
                where: {
                  authors: {
                    some: {
                      id: user.id
                    }
                  },
                  status: "PUBLISHED"
                }
              });
              const pages = Math.ceil(postCount / POSTS_PER_PAGE);
              const subpaths = (0, import_lodash.default)(2, pages + 2).map(
                (p) => `/${PAGE_PREFIX}${p}`
              );
              paths.push(...subpaths.map((p) => `/people/${user.slug}${p}`));
            }
          }
          await refreshPaths(paths);
        }
      },
      fields: {
        title: (0, import_fields2.text)({
          validation: {
            isRequired: true
          }
        }),
        lead: (0, import_fields2.text)({
          validation: {
            isRequired: true
          }
        }),
        content: rich,
        cover: picture,
        authors: (0, import_fields2.relationship)({
          access: {
            create: ({ session: session2, inputData }) => hasRole(session2, "ADMIN") || !inputData.authors?.create && maybeArray(inputData.authors?.connect ?? []).some(
              (item) => item.id === session2.data.id
            ),
            update: ({ session: session2, inputData }) => hasRole(session2, "ADMIN") || !inputData.authors?.create && !inputData.authors?.set && !maybeArray(inputData.authors?.disconnect ?? []).some(
              (item) => item.id === session2.data.id
            )
          },
          ref: "User.posts",
          many: true
        }),
        category: (0, import_fields2.relationship)({
          ref: "Category.posts"
        }),
        tags: (0, import_fields2.relationship)({
          ref: "Tag.posts",
          many: true,
          ui: {
            displayMode: "cards",
            cardFields: ["name"],
            inlineEdit: {
              fields: ["name"]
            },
            linkToItem: true,
            inlineConnect: true,
            inlineCreate: {
              fields: ["name"]
            }
          }
        }),
        createdAt,
        updatedAt,
        status: (0, import_fields2.select)({
          validation: {
            isRequired: true
          },
          defaultValue: "DRAFT",
          type: "enum",
          options: [
            { label: "Draft", value: "DRAFT" },
            { label: "Published", value: "PUBLISHED" }
          ],
          ui: {
            displayMode: "segmented-control"
          }
        }),
        publishedAt: (0, import_fields2.timestamp)({
          ui: {
            description: "Optionally customise this post's publish date."
          }
        }),
        sticky: (0, import_fields2.checkbox)({
          ui: {
            description: "If checked, this post will be displayed at the top."
          }
        })
      }
    })
  ),
  Tag: withSlug(
    (0, import_core.list)({
      access: {
        operation: {
          ...(0, import_access2.allOperations)(({ session: session2 }) => Boolean(session2)),
          query: import_access2.allowAll
        }
      },
      hooks: {
        async afterOperation({ item, originalItem, context }) {
          const paths = ["/", "/tags"];
          const posts = await context.prisma.post.findMany({
            select: {
              id: true,
              slug: true,
              publishedAt: true,
              category: {
                select: {
                  slug: true
                }
              }
            },
            where: {
              tags: {
                some: {
                  id: (item ?? originalItem).id
                }
              },
              status: "PUBLISHED"
            }
          });
          let subpaths = [];
          if (posts.length > 0) {
            const pages = Math.ceil(posts.length / POSTS_PER_PAGE);
            subpaths = (0, import_lodash.default)(2, pages + 1).map((p) => `/${PAGE_PREFIX}${p}`);
          }
          if (originalItem) {
            const prefix = `/tags/${originalItem.slug}`;
            paths.push(prefix, ...subpaths.map((p) => prefix + p));
          }
          if (item) {
            const prefix = `/tags/${item.slug}`;
            paths.push(prefix, ...subpaths.map((p) => prefix + p));
          }
          paths.push(
            ...posts.map(
              (post) => `/posts/${post.category?.slug ?? ""}/${extractTime(
                post.publishedAt ?? new Date()
              ).join("/")}/${post.slug}`
            )
          );
          await refreshPaths(paths);
        }
      },
      ui: {
        isHidden: true
      },
      fields: {
        name: (0, import_fields2.text)({
          validation: {
            isRequired: true
          }
        }),
        posts: (0, import_fields2.relationship)({
          ref: "Post.tags",
          many: true
        }),
        createdAt
      }
    })
  ),
  Category: withSlug(
    (0, import_core.list)({
      access: {
        operation: {
          ...(0, import_access2.allOperations)(({ session: session2 }) => hasRole(session2, "ADMIN")),
          query: import_access2.allowAll
        }
      },
      hooks: {
        validateInput({ operation, resolvedData, addValidationError }) {
          if (operation === "create" && !resolvedData.cover.id || operation === "update" && resolvedData.cover.id === null) {
            addValidationError("Missing required field: cover");
          }
        },
        async afterOperation({ item, originalItem, context }) {
          const paths = ["/", "/posts"];
          const posts = await context.prisma.post.findMany({
            select: {
              id: true,
              slug: true,
              publishedAt: true,
              category: {
                select: {
                  slug: true
                }
              }
            },
            where: {
              category: {
                id: (item ?? originalItem).id
              },
              status: "PUBLISHED"
            }
          });
          let subpaths = [];
          if (posts.length > 0) {
            const pages = Math.ceil(posts.length / POSTS_PER_PAGE);
            subpaths = (0, import_lodash.default)(2, pages + 1).map((p) => `/${PAGE_PREFIX}${p}`);
          }
          const folders = posts.reduce((previous, current) => {
            const [year, month] = extractTime(
              current.publishedAt ?? new Date()
            );
            let yearItem = previous.find(
              (item2) => item2.year === year && !item2.month
            );
            if (!yearItem) {
              yearItem = { year, month: "", length: 0 };
              previous.push(yearItem);
            }
            yearItem.length++;
            let monthItem = previous.find(
              (item2) => item2.year === year && item2.month === month
            );
            if (!monthItem) {
              monthItem = { year, month, length: 0 };
              previous.push(monthItem);
            }
            monthItem.length++;
            return previous;
          }, []).map(
            ({ year, month, length }) => [
              [year, month].filter(Boolean),
              Array.from({ length })
            ]
          );
          for (const [folder, posts2] of folders) {
            if (posts2.length > 0) {
              const pages = Math.ceil(posts2.length / POSTS_PER_PAGE);
              const folderPath = folder.filter(Boolean).join("/");
              subpaths.push(
                ...(0, import_lodash.default)(2, pages + 1).map(
                  (p) => `/${folderPath}/${PAGE_PREFIX}${p}`
                )
              );
            }
          }
          if (originalItem) {
            const prefix = `/posts/${originalItem.slug}`;
            paths.push(prefix, ...subpaths.map((p) => prefix + p));
          }
          if (item) {
            const prefix = `/posts/${item.slug}`;
            paths.push(prefix, ...subpaths.map((p) => prefix + p));
          }
          paths.push(
            ...posts.map(
              (post) => `/posts/${post.category?.slug ?? ""}/${extractTime(
                post.publishedAt ?? new Date()
              ).join("/")}/${post.slug}`
            )
          );
          await refreshPaths(paths);
        }
      },
      fields: {
        name: (0, import_fields2.text)({
          validation: {
            isRequired: true
          }
        }),
        description: rich,
        cover: picture,
        posts: (0, import_fields2.relationship)({
          ref: "Post.category",
          many: true,
          ui: {
            createView: {
              fieldMode: "hidden"
            },
            itemView: {
              fieldMode: "hidden"
            }
          }
        }),
        createdAt
      }
    })
  )
};

// config/storage.ts
var import_mkdirp = require("mkdirp");
var storagePath = "public/images";
(0, import_mkdirp.mkdirpSync)(storagePath);
var host = (process.env.ASSET_BASE_URL ?? "") || `http://localhost:${process.env.PORT ?? 3e3}`;
var storage = {
  myLocal: {
    kind: "local",
    type: "image",
    generateUrl: (path) => `${host}/images${path}`,
    serverRoute: {
      path: "/images"
    },
    storagePath
  }
};

// keystone.ts
var provider = "sqlite";
var url = (process.env.DATABASE_URL ?? "") || "file:./keystone.db";
if (url.startsWith("postgres:")) {
  provider = "postgresql";
}
if (url.startsWith("mysql:")) {
  provider = "mysql";
}
var keystone_default = withAuth(
  (0, import_core2.config)({
    db: {
      provider,
      url,
      enableLogging: process.env.NODE_ENV !== "production",
      useMigrations: false
    },
    lists,
    session,
    storage,
    telemetry: false,
    ui: {
      isAccessAllowed({ session: session2 }) {
        return session2?.data?.active ?? false;
      }
    }
  })
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
