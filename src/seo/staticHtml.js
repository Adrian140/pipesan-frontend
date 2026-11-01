// Static HTML snapshots that scripts/prerender.mjs writes into each page's #root.
// Crawlers that do not run JavaScript (most AI crawlers) read this; React replaces it on load.
// Lives under src/ so Tailwind keeps the classes used here.

import {
  ORGANIZATION,
  STATIC_PAGES,
  productPath,
  productShortName,
  productSpecList,
} from './meta.js';

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const NAV = ['/', '/products', '/categories', '/technical-specs', '/b2b', '/about', '/contact', '/support'];

function navHtml() {
  const links = NAV.map((path) => {
    const page = STATIC_PAGES.find((p) => p.path === path);
    const label = path === '/' ? 'Home' : page.h1;
    return `<a class="hover:text-white" href="${path}">${esc(label)}</a>`;
  }).join('');
  return `<header class="bg-graphite-950 text-gray-300"><nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Main"><a class="font-extrabold text-white mr-4" href="/">PipeSan</a>${links}</nav></header>`;
}

function footerHtml() {
  const a = ORGANIZATION.address;
  return `<footer class="bg-graphite-950 text-gray-400 text-sm"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10"><p><strong class="text-white">PipeSan</strong> · ${esc(ORGANIZATION.legalName)}, ${esc(a.streetAddress)}, ${esc(a.postalCode)} ${esc(a.addressLocality)}, ${esc(a.addressRegion)}, Romania · VAT ${esc(ORGANIZATION.vatID)}</p><p class="mt-2"><a href="mailto:${esc(ORGANIZATION.email)}">${esc(ORGANIZATION.email)}</a> · <a href="tel:${esc(ORGANIZATION.telephone)}">+33 675 11 62 18</a> · <a href="/terms">Terms of sale</a> · <a href="/shipping">Shipping</a> · <a href="/returns">Returns</a> · <a href="/withdrawal">Withdraw from contract here</a> · <a href="/legal-notice">Legal notice</a> · <a href="/privacy-policy">Privacy policy</a></p></div></footer>`;
}

function shell(main) {
  return `${navHtml()}<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 min-h-[60vh]">${main}</main>${footerHtml()}`;
}

function money(product) {
  const price = Number(product.price);
  const sale = product.sale_price == null ? null : Number(product.sale_price);
  const value = Number.isFinite(sale) && sale > 0 && sale < price ? sale : price;
  return Number.isFinite(value) && value > 0 ? `${value.toFixed(2)} ${esc(product.currency || 'EUR')}` : '';
}

function inStock(product) {
  return product.stock_status !== 'out_of_stock' && product.in_stock !== false;
}

function productListHtml(products) {
  if (!products.length) return '';
  const items = products
    .map((p) => {
      const price = money(p);
      return `<li class="py-3 border-b border-gray-100"><a class="font-semibold text-text-primary hover:text-primary" href="${productPath(p)}">${esc(productShortName(p))}</a>${price ? ` <span class="text-text-secondary">— ${price}</span>` : ''}${inStock(p) ? '' : ' <span class="text-gray-500">(out of stock)</span>'}</li>`;
    })
    .join('');
  return `<ul class="mt-6">${items}</ul>`;
}

function categoryListHtml(categories) {
  if (!categories.length) return '';
  const items = categories
    .map(
      (c) =>
        `<li class="py-3"><a class="font-semibold text-text-primary hover:text-primary" href="/products?category=${esc(c.slug)}">${esc(c.name)}</a>${c.description ? `<p class="text-text-secondary">${esc(c.description)}</p>` : ''}</li>`
    )
    .join('');
  return `<ul class="mt-6 space-y-2">${items}</ul>`;
}

export function staticPageHtml(page, { products = [], categories = [] } = {}) {
  let body = `<h1 class="text-4xl md:text-5xl font-extrabold text-text-primary mb-6">${esc(page.h1)}</h1><p class="text-xl text-text-secondary max-w-3xl">${esc(page.description)}</p>`;
  if (page.path === '/' || page.path === '/categories') {
    body += `<h2 class="text-2xl font-extrabold text-text-primary mt-12">Categories</h2>${categoryListHtml(categories)}`;
  }
  if (page.path === '/' || page.path === '/products') {
    const list = page.path === '/' ? products.filter(inStock).slice(0, 12) : products;
    body += `<h2 class="text-2xl font-extrabold text-text-primary mt-12">${page.path === '/' ? 'In stock now' : 'All products'}</h2>${productListHtml(list)}`;
  }
  return shell(body);
}

export function productPageHtml(product, category) {
  const specs = productSpecList(product);
  const bullets = Array.isArray(product.bullet_points) ? product.bullet_points.filter(Boolean) : [];
  const price = money(product);
  const crumbs = [
    `<a href="/">Home</a>`,
    `<a href="/products">Products</a>`,
    ...(category ? [`<a href="/products?category=${esc(category.slug)}">${esc(category.name)}</a>`] : []),
  ].join(' / ');
  const image = Array.isArray(product.images) ? product.images.find((x) => typeof x === 'string') : null;

  let body = `<nav class="text-sm text-text-secondary mb-6" aria-label="Breadcrumb">${crumbs}</nav>`;
  body += `<div class="grid lg:grid-cols-2 gap-12">`;
  if (image) {
    body += `<img class="w-full rounded-2xl bg-gray-50" src="${esc(image)}" alt="${esc(productShortName(product))}" width="800" height="800">`;
  }
  body += `<div><h1 class="text-2xl sm:text-3xl font-extrabold text-text-primary leading-tight mb-4">${esc(product.name)}</h1>`;
  if (product.sku) body += `<p class="font-mono text-sm text-text-secondary">SKU: ${esc(product.sku)}</p>`;
  if (price) body += `<p class="text-3xl font-extrabold text-text-primary mt-4">${price}</p>`;
  body += `<p class="mt-2 ${inStock(product) ? 'text-green-700' : 'text-gray-500'}">${inStock(product) ? 'In stock' : 'Out of stock'}</p>`;
  if (bullets.length) {
    body += `<h2 class="text-xl font-extrabold text-text-primary mt-8 mb-3">Key features</h2><ul class="list-disc pl-5 space-y-2 text-text-secondary">${bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`;
  }
  body += `</div></div>`;
  if (specs.length) {
    body += `<h2 class="text-2xl font-extrabold text-text-primary mt-12 mb-4">Specifications</h2><table class="w-full max-w-3xl text-left"><tbody>${specs.map(([k, v]) => `<tr class="border-b border-gray-100"><th class="py-2 pr-6 font-semibold">${esc(k)}</th><td class="py-2 text-text-secondary">${esc(v)}</td></tr>`).join('')}</tbody></table>`;
  }
  if (product.description) {
    body += `<h2 class="text-2xl font-extrabold text-text-primary mt-12 mb-4">Description</h2>${String(product.description).split(/\n{2,}/).map((para) => `<p class="text-text-secondary max-w-3xl mb-4">${esc(para)}</p>`).join('')}`;
  }
  return shell(body);
}
