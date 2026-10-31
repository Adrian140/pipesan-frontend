// Runs after `vite build`. Writes one static HTML file per public page and per product
// (title, meta, canonical, JSON-LD and readable content), plus sitemap.xml, robots.txt,
// llms.txt and llms-full.txt. If Supabase is unreachable the build still succeeds with
// the static pages only.

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ORGANIZATION,
  PRIVATE_PATH_PREFIXES,
  SITE_URL,
  STATIC_PAGES,
  absoluteUrl,
  breadcrumbJsonLd,
  organizationJsonLd,
  productJsonLd,
  productMeta,
  productPath,
  productShortName,
  productSpecList,
  websiteJsonLd,
  DEFAULT_IMAGE,
} from '../src/seo/meta.js';
import { esc, productPageHtml, staticPageHtml } from '../src/seo/staticHtml.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

async function loadEnv() {
  // Vercel injects env vars; locally fall back to .env.
  if (process.env.VITE_SUPABASE_URL) return;
  try {
    const text = await fs.readFile(path.join(root, '.env'), 'utf8');
    for (const line of text.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  } catch {
    // no .env: fine
  }
}

async function fetchTable(table, query) {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set');
  const res = await fetch(`${url}/rest/v1/${table}?${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`${table}: HTTP ${res.status}`);
  return res.json();
}

async function loadCatalog() {
  try {
    const [products, categories] = await Promise.all([
      fetchTable(
        'products',
        'select=*&is_active=eq.true&or=(is_draft.is.null,is_draft.eq.false)&order=name.asc'
      ),
      fetchTable('categories', 'select=id,name,slug,description,sort_order&is_active=eq.true&order=sort_order.asc'),
    ]);
    return { products, categories };
  } catch (err) {
    console.warn(`[prerender] catalog unavailable, building static pages only: ${err.message}`);
    return { products: [], categories: [] };
  }
}

function headHtml({ title, description, path: pagePath, image, type = 'website', noindex = false, jsonLd = [] }) {
  const url = pagePath != null ? absoluteUrl(pagePath) : null;
  const img = image || DEFAULT_IMAGE;
  const tags = [
    `<title>${esc(title)}</title>`,
    description && `<meta name="description" content="${esc(description)}" />`,
    `<meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}" />`,
    url && !noindex && `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="${type}" />`,
    url && `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    description && `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${esc(img)}" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    description && `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(img)}" />`,
    ...jsonLd.map(
      (item) =>
        `<script type="application/ld+json" data-seo="jsonld">${JSON.stringify(item).replace(/</g, '\\u003c')}</script>`
    ),
  ];
  return tags.filter(Boolean).join('\n    ');
}

function render(template, head, body = '') {
  return template
    .replace(/<!--seo:start-->[\s\S]*?<!--seo:end-->/, head)
    .replace('<!--app-html-->', body);
}

async function writePage(routePath, html) {
  const file =
    routePath === '/'
      ? path.join(dist, 'index.html')
      : path.join(dist, routePath.replace(/^\//, ''), 'index.html');
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, html);
}

function sitemapXml(pages, products) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = pages.map(
    (p) =>
      `  <url><loc>${absoluteUrl(p.path)}</loc><lastmod>${today}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`
  );
  for (const p of products) {
    const images = (Array.isArray(p.images) ? p.images : [])
      .filter((x) => typeof x === 'string' && /^https?:\/\//.test(x))
      .slice(0, 5)
      .map((src) => `<image:image><image:loc>${esc(src)}</image:loc></image:image>`)
      .join('');
    const lastmod = (p.updated_at || p.created_at || today).slice(0, 10);
    urls.push(
      `  <url><loc>${absoluteUrl(productPath(p))}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority>${images}</url>`
    );
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join('\n')}
</urlset>
`;
}

function robotsTxt() {
  const disallow = PRIVATE_PATH_PREFIXES.map((p) => `Disallow: ${p}`).join('\n');
  // Search and AI assistants are explicitly welcome: being cited by them is the goal.
  const aiBots = [
    'Googlebot',
    'Bingbot',
    'Google-Extended',
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'Claude-SearchBot',
    'Claude-User',
    'PerplexityBot',
    'Perplexity-User',
    'Applebot',
    'Applebot-Extended',
    'CCBot',
  ];
  const group = `${aiBots.map((ua) => `User-agent: ${ua}`).join('\n')}\nAllow: /\n${disallow}`;
  return `# PipeSan – ${SITE_URL}
User-agent: *
Allow: /
${disallow}

${group}

Sitemap: ${SITE_URL}/sitemap.xml
`;
}

function money(p) {
  const price = Number(p.price);
  const sale = p.sale_price == null ? null : Number(p.sale_price);
  const v = Number.isFinite(sale) && sale > 0 && sale < price ? sale : price;
  return Number.isFinite(v) && v > 0 ? `${v.toFixed(2)} ${p.currency || 'EUR'}` : 'price on request';
}

function stockLabel(p) {
  return p.stock_status === 'out_of_stock' || p.in_stock === false ? 'out of stock' : 'in stock';
}

function llmsTxt(products, categories) {
  const a = ORGANIZATION.address;
  const pageLinks = STATIC_PAGES.filter((p) => !['/privacy-policy', '/terms', '/services-pricing'].includes(p.path))
    .map((p) => `- [${p.h1}](${absoluteUrl(p.path)}): ${p.description}`)
    .join('\n');
  const catLines = categories
    .map((c) => `- [${c.name}](${SITE_URL}/products?category=${c.slug})${c.description ? `: ${c.description}` : ''}`)
    .join('\n');
  const productLines = products
    .map((p) => `- [${productShortName(p)}](${absoluteUrl(productPath(p))}): ${money(p)}, ${stockLabel(p)}`)
    .join('\n');
  return `# PipeSan

> PipeSan is an EU online shop for brass plumbing parts: ball valves, 3-way corner valves, BSP (G) reducers and adapters, Geka quick couplings and accessories, mostly in CW617N brass. It sells to installers, resellers (B2B, with EU VAT invoicing) and private customers (B2C), and ships across the European Union.

Company: PipeSan, operated by ${ORGANIZATION.legalName}, ${a.streetAddress}, ${a.postalCode} ${a.addressLocality}, ${a.addressRegion}, Romania. VAT ${ORGANIZATION.vatID}. Contact: ${ORGANIZATION.email}, +33 675 11 62 18. Prices are in EUR.

Full product details (specifications, descriptions): ${SITE_URL}/llms-full.txt

## Pages

${pageLinks}

## Categories

${catLines || '- See the catalogue'}

## Products

${productLines || `- See ${SITE_URL}/products`}
`;
}

function llmsFullTxt(products, categoriesById) {
  const blocks = products.map((p) => {
    const cat = categoriesById.get(p.category_id);
    const specs = productSpecList(p)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join('\n');
    const bullets = (Array.isArray(p.bullet_points) ? p.bullet_points : [])
      .filter(Boolean)
      .map((b) => `- ${b}`)
      .join('\n');
    return `## ${productShortName(p)}

URL: ${absoluteUrl(productPath(p))}
Full name: ${p.name}
SKU: ${p.sku || 'n/a'}
Category: ${cat?.name || 'n/a'}
Price: ${money(p)}
Availability: ${stockLabel(p)}
${specs ? `\nSpecifications:\n${specs}\n` : ''}${bullets ? `\nKey features:\n${bullets}\n` : ''}${p.description ? `\n${String(p.description).trim()}\n` : ''}`;
  });
  return `# PipeSan – full product catalogue

> Every active product sold on ${SITE_URL}, with specifications. Generated at build time on ${new Date().toISOString().slice(0, 10)}.

${blocks.join('\n')}`;
}

async function main() {
  await loadEnv();
  const template = (await fs.readFile(path.join(dist, 'index.html'), 'utf8')).replace(
    'https://api.pipesan.eu',
    process.env.VITE_SUPABASE_URL ? new URL(process.env.VITE_SUPABASE_URL).origin : 'https://api.pipesan.eu'
  );
  const { products, categories } = await loadCatalog();
  const categoriesById = new Map(categories.map((c) => [c.id, c]));

  // Shells the client router fills in: private pages, products added since the last build, 404.
  await fs.writeFile(path.join(dist, '_spa.html'), render(template, headHtml({ title: 'PipeSan' })));
  await fs.writeFile(
    path.join(dist, '_private.html'),
    render(template, headHtml({ title: 'PipeSan', noindex: true }))
  );
  await fs.writeFile(
    path.join(dist, '404.html'),
    render(template, headHtml({ title: 'Page not found | PipeSan', noindex: true }))
  );

  for (const page of STATIC_PAGES) {
    const jsonLd =
      page.path === '/'
        ? [organizationJsonLd(), websiteJsonLd()]
        : [breadcrumbJsonLd([{ name: 'Home', path: '/' }, { name: page.h1, path: page.path }])];
    const head = headHtml({ title: page.title, description: page.description, path: page.path, jsonLd });
    await writePage(page.path, render(template, head, staticPageHtml(page, { products, categories })));
  }

  for (const product of products) {
    const category = categoriesById.get(product.category_id) || null;
    const meta = productMeta(product);
    const jsonLd = [
      productJsonLd(product, category),
      breadcrumbJsonLd([
        { name: 'Home', path: '/' },
        { name: 'Products', path: '/products' },
        ...(category ? [{ name: category.name, path: `/products?category=${category.slug}` }] : []),
        { name: productShortName(product), path: meta.path },
      ]),
    ];
    const html = render(template, headHtml({ ...meta, jsonLd }), productPageHtml(product, category));
    await writePage(meta.path, html);
    // Legacy /products/<uuid> URLs serve the same page with the slug URL as canonical.
    if (product.slug && product.slug !== product.id) await writePage(`/products/${product.id}`, html);
  }

  await fs.writeFile(path.join(dist, 'sitemap.xml'), sitemapXml(STATIC_PAGES, products));
  await fs.writeFile(path.join(dist, 'robots.txt'), robotsTxt());
  await fs.writeFile(path.join(dist, 'llms.txt'), llmsTxt(products, categories));
  await fs.writeFile(path.join(dist, 'llms-full.txt'), llmsFullTxt(products, categoriesById));

  console.log(
    `[prerender] ${STATIC_PAGES.length} pages, ${products.length} products, ${categories.length} categories → sitemap.xml, robots.txt, llms.txt`
  );
}

main().catch((err) => {
  console.error('[prerender] failed:', err);
  process.exit(1);
});
