import {
  component,
  fields,
  NotEditable,
} from '@keystone-6/fields-document/component-blocks';
import {
  ToolbarGroup,
  ToolbarButton,
  ToolbarSeparator,
} from '@keystone-6/fields-document/primitives';
import { ImageIcon } from '@keystone-ui/icons/icons/ImageIcon';
import { Trash2Icon } from '@keystone-ui/icons/icons/Trash2Icon';
import { TypeIcon } from '@keystone-ui/icons/icons/TypeIcon';
import { Tooltip } from '@keystone-ui/tooltip';
import React, { useEffect, useRef, useState } from 'react';

import OEmbed from './oembed';

OEmbed.register();

// eslint-disable-next-line unicorn/prevent-abbreviations
type EmbedProps = {
  url: string;
  alt: string;
  data: any;
};

function isImage(url: string) {
  try {
    return /\.(?:gif|jpe?g|png|webp)$/.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

function Embed({ url, alt, data }: EmbedProps) {
  const element = useRef<HTMLElement>(null);
  const [image, setImage] = useState<React.ReactNode>(null);

  useEffect(() => {
    function onData(event: Event) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      data.onChange(JSON.stringify((event as CustomEvent).detail));
    }

    setImage(null);

    if (isImage(url)) {
      fetch(`/fetch-image?url=${url}`, { method: 'POST' })
        .then(async response => {
          if (!response.ok) {
            return;
          }

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const detail = await response.json();
          setImage(
            <img
              alt={alt}
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              src={detail.src}
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              width={detail.width}
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              height={detail.height}
              style={{
                maxWidth: '100%',
                height: 'auto',
                margin: '0 auto',
                display: 'block',
                // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unsafe-member-access
                aspectRatio: `${detail.width} / ${detail.height}`,
              }}
            />,
          );
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
          data.onChange(JSON.stringify({ ...detail, type: 'uploaded-image' }));
        })
        .catch(error => {
          console.error(error);
        });
    }

    element.current?.addEventListener('data', onData);

    return () => {
      element.current?.removeEventListener('data', onData);
    };
  }, [url]);

  if (url === '') {
    return (
      <div
        style={{
          aspectRatio: '16 / 9',
          width: '100%',
          border: '5px dashed',
          opacity: '0.25',
          borderRadius: '5px',
        }}
      />
    );
  }

  return isImage(url) ? (
    <>
      {image ?? (
        <img
          src={url}
          alt={alt}
          style={{
            maxWidth: '100%',
            height: 'auto',
            margin: '0 auto',
            display: 'block',
          }}
        />
      )}
    </>
  ) : (
    // @ts-expect-error: web component
    <o-embed ref={element} url={url} />
  );
}

export const componentBlocks = {
  embed: component({
    chromeless: true,
    preview({ fields }) {
      return (
        <figure>
          <NotEditable>
            <div
              style={{
                margin: '0 auto',
                maxWidth: '500px',
                pointerEvents: 'none',
              }}
            >
              <Embed
                url={fields.src.value}
                alt={fields.alt.value}
                data={fields.data}
              />
            </div>
          </NotEditable>
          <figcaption style={{ textAlign: 'center' }}>
            {fields.caption.element}
          </figcaption>
        </figure>
      );
    },
    label: 'Embed',
    schema: {
      src: fields.text({
        label: 'Embed URL',
        defaultValue: '',
      }),
      data: fields.text({
        label: 'Embed data',
        defaultValue: '',
      }),
      alt: fields.text({
        label: 'Alt text',
        defaultValue: '',
      }),
      caption: fields.child({ kind: 'inline', placeholder: 'Enter text...' }),
    },
    toolbar({ props, onRemove }) {
      return (
        <ToolbarGroup>
          <Tooltip content="Embed URL" weight="subtle">
            {attributes => (
              <ToolbarButton
                onMouseDown={() => {
                  // eslint-disable-next-line no-alert
                  const url = prompt('Enter URL:', props.fields.src.value);

                  if (url === null) {
                    return;
                  }

                  let urlObject: URL;

                  try {
                    urlObject = new URL(url ?? '');
                  } catch {
                    // eslint-disable-next-line no-alert
                    alert('Invalid URL.');
                    return;
                  }

                  props.fields.src.onChange(urlObject.href);
                }}
                {...attributes}
              >
                <ImageIcon size="small" />
              </ToolbarButton>
            )}
          </Tooltip>
          <Tooltip content="Alt text" weight="subtle">
            {attributes => (
              <ToolbarButton
                onMouseDown={() => {
                  // eslint-disable-next-line no-alert
                  const text = prompt('Enter text:', props.fields.alt.value);

                  if (!text) {
                    return;
                  }

                  props.fields.alt.onChange(text);
                }}
                {...attributes}
              >
                <TypeIcon size="small" />
              </ToolbarButton>
            )}
          </Tooltip>
          <ToolbarSeparator />
          <Tooltip content="Remove" weight="subtle">
            {attributes => (
              <ToolbarButton
                variant="destructive"
                onMouseDown={onRemove}
                {...attributes}
              >
                <Trash2Icon size="small" />
              </ToolbarButton>
            )}
          </Tooltip>
        </ToolbarGroup>
      );
    },
  }),
};
