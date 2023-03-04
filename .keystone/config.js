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
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
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
var import_node_path = require("node:path");
var import_node_stream = require("node:stream");
var import_oembed_extractor = require("@extractus/oembed-extractor");
var import_core2 = require("@keystone-6/core");
var import_node_fetch2 = __toESM(require("node-fetch"));

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
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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

// config/component-blocks.tsx
var import_component_blocks = require("@keystone-6/fields-document/component-blocks");
var import_primitives = require("@keystone-6/fields-document/primitives");
var import_ImageIcon = require("@keystone-ui/icons/icons/ImageIcon");
var import_Trash2Icon = require("@keystone-ui/icons/icons/Trash2Icon");
var import_TypeIcon = require("@keystone-ui/icons/icons/TypeIcon");
var import_tooltip = require("@keystone-ui/tooltip");
var import_react = __toESM(require("react"));

// config/oembed.ts
var OEmbed = (() => {
  if (!globalThis.HTMLElement) {
    return {
      register() {
      }
    };
  }
  return class OEmbed2 extends HTMLElement {
    static register() {
      customElements.define("o-embed", OEmbed2);
    }
    static get observedAttributes() {
      return ["url"];
    }
    #root;
    #resizeObserver;
    #ready = false;
    #isDark = document.documentElement.classList.contains("dark");
    constructor() {
      super();
      this.#root = this.attachShadow({ mode: "closed" });
      this.#resizeObserver = new ResizeObserver((entries) => {
        const { height } = entries[0].contentRect;
        iframe.style.height = `${height}px`;
        iframe.style.aspectRatio = "";
      });
      const iframe = document.createElement("iframe");
      iframe.style.width = "100%";
      iframe.style.aspectRatio = "16 / 9";
      iframe.style.border = "0";
      iframe.style.verticalAlign = "top";
      iframe.srcdoc = `<!DOCTYPE html><html class="${this.#isDark ? "dark" : ""}" lang="pt-BR"><style>html{font-size:125%;color:#000}html.dark{color:#fff}body{margin:0;padding:0;display:flex;flex-direction:column;align-items:center}iframe,img{max-width:100%}.filler{width:100%;aspect-ratio:16 / 9;display:flex;justify-content:center;align-items:center}</style><body><div class="filler">...</div></body></html>`;
      this.#root.append(iframe);
      setTimeout(() => {
        const callback = () => {
          if (iframe.contentDocument?.readyState !== "complete") {
            return;
          }
          this.#resizeObserver.observe(iframe.contentDocument.documentElement);
          this.#ready = true;
          iframe.contentDocument?.removeEventListener(
            "readystatechange",
            callback
          );
          void this.updateUrl();
        };
        if (iframe.contentDocument?.readyState === "complete") {
          callback();
          return;
        }
        iframe.contentDocument?.addEventListener("readystatechange", callback);
      }, 50);
    }
    attributeChangedCallback() {
      void this.updateUrl();
    }
    async updateUrl() {
      if (!this.#ready) {
        return;
      }
      const contents = this.#root.querySelector("iframe")?.contentDocument?.body;
      if (!contents) {
        return;
      }
      const url2 = encodeURIComponent(this.getAttribute("url") ?? "");
      const response = await fetch(`/oembed-proxy?url=${url2}`);
      const data = await response.json();
      const event = new CustomEvent("data", { detail: data });
      this.dispatchEvent(event);
      contents.innerHTML = data.html;
      if (data.type === "video") {
        for (const iframe of contents.querySelectorAll("iframe")) {
          if (iframe.width === "100%") {
            continue;
          }
          iframe.style.width = "100%";
          iframe.style.height = "auto";
          iframe.style.aspectRatio = `${iframe.width} / ${iframe.height}`;
        }
      }
      for (const image2 of contents.querySelectorAll("img")) {
        image2.style.height = "auto";
        image2.style.aspectRatio = `${image2.width} / ${image2.height}`;
      }
      for (const script of contents.querySelectorAll("script")) {
        const newScript = document.createElement("script");
        for (const attribute of script.attributes) {
          newScript.setAttribute(attribute.name, attribute.value);
        }
        newScript.append(document.createTextNode(script.innerHTML));
        script.parentNode?.replaceChild(newScript, script);
      }
    }
  };
})();
var oembed_default = OEmbed;

// config/component-blocks.tsx
oembed_default.register();
function isImage(url2) {
  try {
    return /\.(?:gif|jpe?g|png|webp)$/.test(new URL(url2).pathname);
  } catch {
    return false;
  }
}
function Embed({ url: url2, alt, data }) {
  const element = (0, import_react.useRef)(null);
  const [image2, setImage] = (0, import_react.useState)(null);
  (0, import_react.useEffect)(() => {
    function onData(event) {
      data.onChange(JSON.stringify(event.detail));
    }
    setImage(null);
    if (isImage(url2)) {
      fetch(`/fetch-image?url=${url2}`, { method: "POST" }).then(async (response) => {
        if (!response.ok) {
          return;
        }
        const detail = await response.json();
        setImage(
          /* @__PURE__ */ import_react.default.createElement(
            "img",
            {
              alt,
              src: detail.src,
              width: detail.width,
              height: detail.height,
              style: {
                maxWidth: "100%",
                height: "auto",
                margin: "0 auto",
                display: "block",
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
                aspectRatio: `${detail.width} / ${detail.height}`
              }
            }
          )
        );
        data.onChange(JSON.stringify({ ...detail, type: "uploaded-image" }));
      }).catch((error) => {
        console.error(error);
      });
    }
    element.current?.addEventListener("data", onData);
    return () => {
      element.current?.removeEventListener("data", onData);
    };
  }, [url2]);
  if (url2 === "") {
    return /* @__PURE__ */ import_react.default.createElement(
      "div",
      {
        style: {
          aspectRatio: "16 / 9",
          width: "100%",
          border: "5px dashed",
          opacity: "0.25",
          borderRadius: "5px"
        }
      }
    );
  }
  return isImage(url2) ? /* @__PURE__ */ import_react.default.createElement(import_react.default.Fragment, null, image2 ?? /* @__PURE__ */ import_react.default.createElement(
    "img",
    {
      src: url2,
      alt,
      style: {
        maxWidth: "100%",
        height: "auto",
        margin: "0 auto",
        display: "block"
      }
    }
  )) : (
    // @ts-expect-error: web component
    /* @__PURE__ */ import_react.default.createElement("o-embed", { ref: element, url: url2 })
  );
}
var componentBlocks = {
  embed: (0, import_component_blocks.component)({
    chromeless: true,
    preview({ fields: fields2 }) {
      return /* @__PURE__ */ import_react.default.createElement("figure", null, /* @__PURE__ */ import_react.default.createElement(import_component_blocks.NotEditable, null, /* @__PURE__ */ import_react.default.createElement(
        "div",
        {
          style: {
            margin: "0 auto",
            maxWidth: "500px",
            pointerEvents: "none"
          }
        },
        /* @__PURE__ */ import_react.default.createElement(
          Embed,
          {
            url: fields2.src.value,
            alt: fields2.alt.value,
            data: fields2.data
          }
        )
      )), /* @__PURE__ */ import_react.default.createElement("figcaption", { style: { textAlign: "center" } }, fields2.caption.element));
    },
    label: "Embed",
    schema: {
      src: import_component_blocks.fields.text({
        label: "Embed URL",
        defaultValue: ""
      }),
      data: import_component_blocks.fields.text({
        label: "Embed data",
        defaultValue: ""
      }),
      alt: import_component_blocks.fields.text({
        label: "Alt text",
        defaultValue: ""
      }),
      caption: import_component_blocks.fields.child({ kind: "inline", placeholder: "Enter text..." })
    },
    toolbar({ props, onRemove }) {
      return /* @__PURE__ */ import_react.default.createElement(import_primitives.ToolbarGroup, null, /* @__PURE__ */ import_react.default.createElement(import_tooltip.Tooltip, { content: "Embed URL", weight: "subtle" }, (attributes) => /* @__PURE__ */ import_react.default.createElement(
        import_primitives.ToolbarButton,
        {
          onMouseDown: () => {
            const url2 = prompt("Enter URL:", props.fields.src.value);
            if (url2 === null) {
              return;
            }
            let urlObject;
            try {
              urlObject = new URL(url2 ?? "");
            } catch {
              alert("Invalid URL.");
              return;
            }
            props.fields.src.onChange(urlObject.href);
          },
          ...attributes
        },
        /* @__PURE__ */ import_react.default.createElement(import_ImageIcon.ImageIcon, { size: "small" })
      )), /* @__PURE__ */ import_react.default.createElement(import_tooltip.Tooltip, { content: "Alt text", weight: "subtle" }, (attributes) => /* @__PURE__ */ import_react.default.createElement(
        import_primitives.ToolbarButton,
        {
          onMouseDown: () => {
            const text3 = prompt("Enter text:", props.fields.alt.value);
            if (!text3) {
              return;
            }
            props.fields.alt.onChange(text3);
          },
          ...attributes
        },
        /* @__PURE__ */ import_react.default.createElement(import_TypeIcon.TypeIcon, { size: "small" })
      )), /* @__PURE__ */ import_react.default.createElement(import_primitives.ToolbarSeparator, null), /* @__PURE__ */ import_react.default.createElement(import_tooltip.Tooltip, { content: "Remove", weight: "subtle" }, (attributes) => /* @__PURE__ */ import_react.default.createElement(
        import_primitives.ToolbarButton,
        {
          variant: "destructive",
          onMouseDown: onRemove,
          ...attributes
        },
        /* @__PURE__ */ import_react.default.createElement(import_Trash2Icon.Trash2Icon, { size: "small" })
      )));
    }
  })
};

// config/fields.ts
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
  ui: {
    views: "./config/component-blocks"
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
  const fields2 = Object.entries(config2.fields);
  for (const [index, [fieldName]] of fields2.entries()) {
    if (fieldName === "name" || fieldName === "title") {
      fields2.splice(index + 1, 0, [
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
  config2.fields = Object.fromEntries(fields2);
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
  return (
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    session2?.data.active && (roles.includes("SUPER") || roles.some((r) => role.includes(r)))
  );
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
          update: ({ session: session2, item }) => (
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            item.id === session2?.data.id || hasRole(session2, "SUPER")
          )
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
          if (resolvedData.roles && operation === "update" && !resolvedData.roles.includes("SUPER") && supers.length === 1 && supers[0].id === resolvedData.id) {
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
                post.publishedAt ?? /* @__PURE__ */ new Date()
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
        validateInput({ operation, resolvedData, addValidationError }) {
          if (operation === "create" && !resolvedData.cover.id || operation === "update" && resolvedData.cover.id === null) {
            addValidationError("Missing required field: cover");
          }
        },
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
        lead: (0, import_fields2.text)({
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
            return (
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              query?.authors.some((item2) => item2.id === session2?.data.id) ?? false
            );
          }
        }
      },
      hooks: {
        resolveInput({ resolvedData, inputData, item }) {
          if ((inputData.status ?? item?.status) === "PUBLISHED" && !(inputData.publishedAt ?? item?.publishedAt)) {
            resolvedData.publishedAt = /* @__PURE__ */ new Date();
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
            const query = (
              // eslint-disable-next-line no-await-in-loop
              await context.prisma.post.findFirst({
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
              })
            );
            const currentCount = query?._count?.[field] || 0;
            const deletedCount = resolvedData?.[field]?.disconnect?.length || 0;
            if (currentCount && currentCount === deletedCount) {
              addValidationError(`Missing required relationship: ${field}`);
            }
          }
          for (const field of ["category"]) {
            const hasExistingField = (
              // eslint-disable-next-line no-await-in-loop
              await context.prisma.post.count({
                where: {
                  id: { equals: item?.id },
                  [field]: { isNot: null }
                }
              }) > 0
            );
            const noField = !resolvedData[field];
            const fieldRemoved = resolvedData[field]?.disconnect;
            if (operation === "create" && noField || operation === "update" && (fieldRemoved || noField && !hasExistingField))
              addValidationError(`Missing required relationship: ${field}`);
          }
        },
        // eslint-disable-next-line complexity
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
                it.publishedAt ?? /* @__PURE__ */ new Date()
              ).join("/")}/${it.slug}`
            );
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
                current.publishedAt ?? /* @__PURE__ */ new Date()
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
              const prefix2 = `/${folderPath}`;
              subpaths.push(
                prefix2,
                ...(0, import_lodash.default)(2, pages + 2).map((p) => `${prefix2}/${PAGE_PREFIX}${p}`)
              );
            }
            const prefix = `/posts/${category?.slug ?? ""}`;
            paths.push(prefix, ...subpaths.map((p) => prefix + p));
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
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
              (item) => item.id === session2.data.id
            ),
            update: ({ session: session2, inputData }) => hasRole(session2, "ADMIN") || !inputData.authors?.create && !inputData.authors?.set && !maybeArray(inputData.authors?.disconnect ?? []).some(
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
                post.publishedAt ?? /* @__PURE__ */ new Date()
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
              current.publishedAt ?? /* @__PURE__ */ new Date()
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
              const prefix = `/${folderPath}`;
              subpaths.push(
                prefix,
                ...(0, import_lodash.default)(2, pages + 1).map((p) => `${prefix}/${PAGE_PREFIX}${p}`)
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
                post.publishedAt ?? /* @__PURE__ */ new Date()
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
      // TODO: set to `true` on first release
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
    },
    server: {
      extendExpressApp(app, context) {
        app.post("/fetch-image", async (request, response) => {
          if (!context.session) {
            response.status(403).send();
            return;
          }
          let url2;
          try {
            url2 = new URL(request.query.url);
          } catch (error) {
            console.error(error);
            response.status(400).send();
            return;
          }
          const fileResponse = await (0, import_node_fetch2.default)(url2.href);
          if (!fileResponse.ok) {
            response.status(500).send();
            return;
          }
          try {
            const chunks = [];
            for await (const chunk of fileResponse.body) {
              chunks.push(chunk);
            }
            const fileContents = import_node_stream.Readable.from(Buffer.concat(chunks));
            const imageStorage = context.images("myLocal");
            const result = await imageStorage.getDataFromStream(
              fileContents,
              (0, import_node_path.basename)(url2.pathname)
            );
            response.send({
              ...result,
              src: await imageStorage.getUrl(result.id, result.extension)
            });
          } catch (error) {
            console.error(error);
            response.status(500).send(error);
          }
        });
        app.get("/oembed-proxy", async (request, response) => {
          if (!context.session) {
            response.status(403).send();
            return;
          }
          let url2;
          try {
            url2 = new URL(request.query.url);
          } catch (error) {
            console.error(error);
            response.status(400).send();
            return;
          }
          try {
            response.send(
              await (0, import_oembed_extractor.extract)(url2.href, {
                maxwidth: 1e3,
                maxheight: 1e3
              })
            );
          } catch (error) {
            console.error(error);
            response.status(500).send(error);
          }
        });
      }
    }
  })
);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
