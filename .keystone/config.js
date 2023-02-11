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
var import_core = require("@keystone-6/core");
var import_access2 = require("@keystone-6/core/access");
var import_fields2 = require("@keystone-6/core/fields");

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
          ...(0, import_access2.allOperations)(({ session: session2 }) => hasRole(session2, "ADMIN")),
          query: import_access2.allowAll
        }
      },
      hooks: {
        validateInput({ operation, resolvedData, addValidationError }) {
          if (operation === "create" && !resolvedData.picture.id || operation === "update" && resolvedData.picture.id === null) {
            addValidationError("Missing required field: picture");
          }
          if (!resolvedData.roles?.length && (operation === "create" || operation === "update" && resolvedData.roles !== void 0)) {
            addValidationError("Missing required field: roles");
          }
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
          console.log(
            inputData.status ?? item?.status,
            inputData.publishedAt ?? item?.publishedAt
          );
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
        sticky: (0, import_fields2.checkbox)()
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
