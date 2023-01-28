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
  sessionData: "name createdAt",
  secretField: "password",
  initFirstItem: process.env.NODE_ENV === "production" ? void 0 : {
    fields: ["name", "email", "password"]
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
var lists = {
  User: withSlug(
    (0, import_core.list)({
      access: import_access2.allowAll,
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
        createdAt
      }
    })
  ),
  Post: withSlug(
    (0, import_core.list)({
      access: import_access2.allowAll,
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
        sticky: (0, import_fields2.checkbox)(),
        kind: (0, import_fields2.select)({
          validation: {
            isRequired: true
          },
          type: "enum",
          options: [
            {
              label: "Post",
              value: "POST"
            },
            {
              label: "Page",
              value: "PAGE"
            }
          ],
          defaultValue: "POST",
          ui: {
            displayMode: "segmented-control"
          }
        }),
        authors: (0, import_fields2.relationship)({
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
        publishedAt: (0, import_fields2.timestamp)({
          defaultValue: {
            kind: "now"
          },
          ui: {
            description: "Optionally customise this post's publish date."
          }
        })
      }
    })
  ),
  Tag: withSlug(
    (0, import_core.list)({
      access: import_access2.allowAll,
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
      access: import_access2.allowAll,
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
var host = (process.env.ASSET_BASE_URL ?? "") || "http://localhost:3000";
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
    telemetry: false
  })
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
