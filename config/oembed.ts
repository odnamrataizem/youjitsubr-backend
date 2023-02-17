// eslint-disable-next-line @typescript-eslint/naming-convention
const OEmbed = (() => {
  if (!globalThis.HTMLElement) {
    return {
      register() {
        //
      },
    };
  }

  // eslint-disable-next-line @typescript-eslint/naming-convention
  return class OEmbed extends HTMLElement {
    static register() {
      customElements.define('o-embed', OEmbed);
    }

    static get observedAttributes() {
      return ['url'];
    }

    #root: ShadowRoot;
    #resizeObserver: ResizeObserver;
    #ready = false;
    #isDark = document.documentElement.classList.contains('dark');

    constructor() {
      super();

      this.#root = this.attachShadow({ mode: 'closed' });
      this.#resizeObserver = new ResizeObserver(entries => {
        const { height } = entries[0].contentRect;
        iframe.style.height = `${height}px`;
        iframe.style.aspectRatio = '';
      });
      const iframe = document.createElement('iframe');
      iframe.style.width = '100%';
      iframe.style.aspectRatio = '16 / 9';
      iframe.style.border = '0';
      iframe.style.verticalAlign = 'top';
      iframe.srcdoc = `<!DOCTYPE html><html class="${
        this.#isDark ? 'dark' : ''
      }" lang="pt-BR"><style>html{font-size:125%;color:#000}html.dark{color:#fff}body{margin:0;padding:0;display:flex;flex-direction:column;align-items:center}iframe,img{max-width:100%}.filler{width:100%;aspect-ratio:16 / 9;display:flex;justify-content:center;align-items:center}</style><body><div class="filler">...</div></body></html>`;
      this.#root.append(iframe);

      setTimeout(() => {
        const callback = () => {
          if (iframe.contentDocument?.readyState !== 'complete') {
            return;
          }

          this.#resizeObserver.observe(iframe.contentDocument.documentElement);
          this.#ready = true;
          iframe.contentDocument?.removeEventListener(
            'readystatechange',
            callback,
          );
          void this.updateUrl();
        };

        if (iframe.contentDocument?.readyState === 'complete') {
          callback();
          return;
        }

        iframe.contentDocument?.addEventListener('readystatechange', callback);
      }, 50);
    }

    attributeChangedCallback() {
      void this.updateUrl();
    }

    async updateUrl() {
      if (!this.#ready) {
        return;
      }

      const contents =
        this.#root.querySelector('iframe')?.contentDocument?.body;

      if (!contents) {
        return;
      }

      const url = encodeURIComponent(this.getAttribute('url') ?? '');
      const response = await fetch(`/oembed-proxy?url=${url}`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const data = await response.json();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const event = new CustomEvent('data', { detail: data });
      this.dispatchEvent(event);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      contents.innerHTML = data.html;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (data.type === 'video') {
        for (const iframe of contents.querySelectorAll('iframe')) {
          if (iframe.width === '100%') {
            continue;
          }

          iframe.style.width = '100%';
          iframe.style.height = 'auto';
          iframe.style.aspectRatio = `${iframe.width} / ${iframe.height}`;
        }
      }

      for (const image of contents.querySelectorAll('img')) {
        image.style.height = 'auto';
        image.style.aspectRatio = `${image.width} / ${image.height}`;
      }

      for (const script of contents.querySelectorAll('script')) {
        const newScript = document.createElement('script');

        for (const attribute of script.attributes) {
          newScript.setAttribute(attribute.name, attribute.value);
        }

        newScript.append(document.createTextNode(script.innerHTML));
        script.parentNode?.replaceChild(newScript, script);
      }
    }
  };
})();

export default OEmbed;
