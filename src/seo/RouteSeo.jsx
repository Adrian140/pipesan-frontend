import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSeo } from './useSeo';
import {
  breadcrumbJsonLd,
  isPrivatePath,
  organizationJsonLd,
  staticPageMeta,
  websiteJsonLd,
} from './meta';

// Head tags for every route except product pages, which set their own from the product data.
export function RouteSeo() {
  const { pathname } = useLocation();
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const page = staticPageMeta(path);

  let seo = null;
  if (page) {
    const jsonLd =
      path === '/'
        ? [organizationJsonLd(), websiteJsonLd()]
        : [breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: page.h1, path }])];
    seo = { title: page.title, description: page.description, path, jsonLd };
  } else if (isPrivatePath(path)) {
    seo = { title: 'PipeSan', path, noindex: true };
  }
  // /products/:slug is handled by ProductDetail; unknown paths by NotFound.

  useSeo(seo);
  return null;
}

export function NotFound({ title = 'Page not found' }) {
  useSeo({ title: `${title} | PipeSan`, noindex: true });
  return (
    <div className="min-h-[60vh] max-w-3xl mx-auto px-4 py-24 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary mb-4">404</p>
      <h1 className="text-3xl md:text-4xl font-extrabold text-text-primary mb-4">{title}</h1>
      <p className="text-text-secondary mb-8">The page you are looking for does not exist or has moved.</p>
      <Link
        to="/products"
        className="inline-block bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
      >
        Browse products
      </Link>
    </div>
  );
}
