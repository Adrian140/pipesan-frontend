import { useEffect } from 'react';
import { DEFAULT_IMAGE, absoluteUrl } from './meta';

// Keeps <head> in sync with the current page. The prerendered HTML ships the same tags,
// so crawlers that do not run JavaScript still get them.

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function setJsonLd(items) {
  document.head.querySelectorAll('script[data-seo="jsonld"]').forEach((el) => el.remove());
  for (const item of items) {
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.dataset.seo = 'jsonld';
    el.textContent = JSON.stringify(item);
    document.head.appendChild(el);
  }
}

export function applySeo({ title, description, path, image, type = 'website', noindex = false, jsonLd = [] }) {
  if (typeof document === 'undefined') return;
  const url = path != null ? absoluteUrl(path) : null;
  if (title) document.title = title;
  setMeta('name', 'description', description);
  setMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large');
  setCanonical(noindex ? null : url);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:type', type);
  setMeta('property', 'og:url', url);
  setMeta('property', 'og:image', image || DEFAULT_IMAGE);
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', image || DEFAULT_IMAGE);
  setJsonLd(jsonLd);
}

export function useSeo(seo) {
  const key = seo ? JSON.stringify(seo) : '';
  useEffect(() => {
    if (seo) applySeo(seo);
  }, [key]);
}
