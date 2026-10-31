// Shared SEO data: used by the app at runtime (useSeo) and by scripts/prerender.mjs at build time.
// Keep this file free of React, import.meta and browser globals so Node can import it.

export const SITE_URL = 'https://www.pipesan.eu';
export const SITE_NAME = 'PipeSan';
export const DEFAULT_IMAGE = `${SITE_URL}/apple-touch-icon.png`;

export const ORGANIZATION = {
  name: 'PipeSan',
  legalName: 'FISH VALLEY S.R.L.',
  email: 'contact@pipesan.eu',
  telephone: '+33675116218',
  vatID: 'RO39535603',
  address: {
    streetAddress: 'Sat Lemna de Jos, Nr. 159A',
    addressLocality: 'Bucovăț',
    addressRegion: 'Dolj',
    postalCode: '207128',
    addressCountry: 'RO',
  },
};

// Public, indexable pages. `changefreq`/`priority` feed the sitemap.
export const STATIC_PAGES = [
  {
    path: '/',
    title: 'PipeSan – Brass Valves, BSP Fittings & Plumbing Parts | EU Shop',
    description:
      'PipeSan sells brass ball valves, 3-way corner valves, BSP reducers and Geka quick couplings in CW617N brass. Technical specs on every product, B2B and B2C, shipped across the EU.',
    h1: 'Brass valves, BSP fittings and plumbing parts for Europe',
    priority: '1.0',
    changefreq: 'daily',
  },
  {
    path: '/products',
    title: 'Plumbing Parts Catalogue – Valves, BSP Fittings, Geka Couplings | PipeSan',
    description:
      'Browse the PipeSan catalogue: brass ball valves, corner valves, BSP reducers and adapters, Geka quick couplings and accessories, with prices, stock and technical specifications.',
    h1: 'Plumbing parts catalogue',
    priority: '0.9',
    changefreq: 'daily',
  },
  {
    path: '/categories',
    title: 'Product Categories – Valves, BSP Reducers, Geka Couplings | PipeSan',
    description:
      'Shop PipeSan by category: brass valves, BSP reducers and adapters, Geka quick couplings and plumbing accessories in CW617N brass.',
    h1: 'Product categories',
    priority: '0.8',
    changefreq: 'weekly',
  },
  {
    path: '/technical-specs',
    title: 'Technical Specifications – Threads, Pressure Ratings, Materials | PipeSan',
    description:
      'Reference guide to BSP and NPT threads, DN sizes, PN pressure ratings and CW617N brass used across PipeSan valves and fittings.',
    h1: 'Technical specifications',
    priority: '0.6',
    changefreq: 'monthly',
  },
  {
    path: '/b2b',
    title: 'B2B Plumbing Supply for Installers & Resellers | PipeSan',
    description:
      'Volume pricing, invoicing with EU VAT and fast delivery for installers, plumbers and resellers buying valves and fittings from PipeSan.',
    h1: 'B2B solutions',
    priority: '0.7',
    changefreq: 'monthly',
  },
  {
    path: '/about',
    title: 'About PipeSan – EU Supplier of Brass Valves & Fittings',
    description:
      'PipeSan is an EU supplier of brass valves, BSP fittings and plumbing accessories, registered in Romania (VAT RO39535603) and shipping across Europe.',
    h1: 'About PipeSan',
    priority: '0.5',
    changefreq: 'yearly',
  },
  {
    path: '/contact',
    title: 'Contact PipeSan – Plumbing Parts Support & Quotes',
    description:
      'Contact PipeSan by email at contact@pipesan.eu or phone +33 675 11 62 18 for product questions, B2B quotes and order support.',
    h1: 'Contact PipeSan',
    priority: '0.5',
    changefreq: 'yearly',
  },
  {
    path: '/support',
    title: 'Customer Support & FAQ – Orders, Shipping, Returns | PipeSan',
    description:
      'Answers about ordering, EU shipping, returns, invoices and technical questions on PipeSan valves and fittings.',
    h1: 'Customer support',
    priority: '0.5',
    changefreq: 'monthly',
  },
  {
    path: '/services',
    title: 'Plumbing Services & Components | PipeSan',
    description:
      'Professional plumbing components and services from PipeSan, with technical specifications and fast EU delivery.',
    h1: 'Professional plumbing services',
    priority: '0.4',
    changefreq: 'monthly',
  },
  {
    path: '/services-pricing',
    title: 'Services Pricing | PipeSan',
    description: 'Pricing for PipeSan services for professional installers and resellers.',
    h1: 'Services pricing',
    priority: '0.3',
    changefreq: 'monthly',
  },
  {
    path: '/blog',
    title: 'Plumbing Guides – Installation, Standards, Materials | PipeSan Blog',
    description:
      'Guides from the PipeSan technical team on installing pipe fittings, European plumbing standards and choosing brass or stainless steel.',
    h1: 'PipeSan blog',
    priority: '0.4',
    changefreq: 'weekly',
  },
  {
    path: '/privacy-policy',
    title: 'Privacy Policy | PipeSan',
    description: 'How PipeSan collects, uses and protects personal data under the GDPR.',
    h1: 'Privacy policy',
    priority: '0.1',
    changefreq: 'yearly',
  },
  {
    path: '/terms',
    title: 'Terms of Service | PipeSan',
    description: 'Terms and conditions for buying from the PipeSan online store.',
    h1: 'Terms of service',
    priority: '0.1',
    changefreq: 'yearly',
  },
];

// Pages that only make sense for a signed-in or mid-checkout visitor.
export const PRIVATE_PATH_PREFIXES = [
  '/checkout',
  '/order-success',
  '/login',
  '/register',
  '/forgot-password',
  '/email-verified',
  '/reset-password',
  '/dashboard',
  '/admin',
];

export function isPrivatePath(path) {
  return PRIVATE_PATH_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
}

export function absoluteUrl(path) {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path === '/' ? '/' : path.replace(/\/+$/, '')}`;
}

export function staticPageMeta(path) {
  return STATIC_PAGES.find((p) => p.path === path) || null;
}

export function productPath(product) {
  return `/products/${product.slug || product.id}`;
}

export function truncate(text, max = 158) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 80 ? cut.lastIndexOf(' ') : cut.length)}…`;
}

// Product names are long, pipe-separated Amazon-style titles; the first segment is the real name.
export function productShortName(product) {
  return String(product.name || '').split('|')[0].trim();
}

function productImages(product) {
  const imgs = Array.isArray(product.images) ? product.images : [];
  return imgs
    .map((x) => (typeof x === 'string' ? x : x?.url))
    .filter((x) => typeof x === 'string' && /^https?:\/\//.test(x));
}

function productPriceValue(product) {
  const price = Number(product.price);
  const sale = product.sale_price == null ? null : Number(product.sale_price);
  return Number.isFinite(sale) && sale > 0 && sale < price ? sale : price;
}

function productInStock(product) {
  if (product.stock_status === 'out_of_stock' || product.in_stock === false) return false;
  if (product.manage_stock && Number(product.stock_quantity ?? 0) <= 0) return false;
  return true;
}

export function productMeta(product) {
  const short = productShortName(product);
  const title = product.meta_title || `${truncate(short, 60)} | PipeSan`;
  const description =
    product.meta_description ||
    truncate(product.short_description || product.description || product.name);
  return {
    path: productPath(product),
    title,
    description,
    image: productImages(product)[0] || DEFAULT_IMAGE,
    type: 'product',
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: ORGANIZATION.name,
    legalName: ORGANIZATION.legalName,
    url: `${SITE_URL}/`,
    logo: DEFAULT_IMAGE,
    email: ORGANIZATION.email,
    telephone: ORGANIZATION.telephone,
    vatID: ORGANIZATION.vatID,
    address: { '@type': 'PostalAddress', ...ORGANIZATION.address },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: ORGANIZATION.email,
      telephone: ORGANIZATION.telephone,
      availableLanguage: ['en', 'fr', 'de', 'it', 'es', 'ro'],
      areaServed: 'EU',
    },
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: `${SITE_URL}/`,
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/products?search={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function productJsonLd(product, category) {
  const price = productPriceValue(product);
  const url = absoluteUrl(productPath(product));
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: product.name,
    description: truncate(product.description || product.short_description || product.name, 5000),
    sku: product.sku || undefined,
    image: productImages(product),
    url,
    brand: { '@type': 'Brand', name: product.manufacturer || 'PipeSan' },
    category: category?.name || undefined,
    material: product.material || undefined,
  };
  if (Number.isFinite(price) && price > 0) {
    data.offers = {
      '@type': 'Offer',
      url,
      price: price.toFixed(2),
      priceCurrency: product.currency || 'EUR',
      // Catalogue prices include VAT.
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: price.toFixed(2),
        priceCurrency: product.currency || 'EUR',
        valueAddedTaxIncluded: true,
      },
      availability: productInStock(product)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${SITE_URL}/#organization` },
    };
  }
  // No aggregateRating: Google requires the rated reviews to be visible on the page,
  // and the stored rating counts do not match public reviews yet.
  const specs = productSpecList(product);
  if (specs.length) {
    data.additionalProperty = specs.map(([name, value]) => ({
      '@type': 'PropertyValue',
      name,
      value,
    }));
  }
  return JSON.parse(JSON.stringify(data));
}

export function productSpecList(product) {
  const rows = [
    ['Material', product.material],
    ['Connection', product.outlet_connection],
    ['Max pressure', product.max_pressure],
    ['Ports', product.ports],
    ['Dimensions', product.dimensions],
    ['Manufacturer', product.manufacturer],
  ];
  const specs = product.specifications;
  if (specs && typeof specs === 'object' && !Array.isArray(specs)) {
    for (const [k, v] of Object.entries(specs)) {
      if (v != null && typeof v !== 'object') rows.push([k, v]);
    }
  }
  return rows
    .map(([k, v]) => [String(k), String(v ?? '').trim()])
    .filter(([, v]) => v && v !== '—');
}
