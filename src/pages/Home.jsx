// FILE: src/pages/Home.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import HeroSection from '../components/home/HeroSection';
import WhyChooseUs from '../components/home/WhyChooseUs';
import OrderProcess from '../components/home/OrderProcess';
import Testimonials from '../components/home/Testimonials';
import Section from '../components/layout/Section';
import { CheckCircle } from 'lucide-react';
import { apiClient } from '../config/api';
import { useLanguage } from '../contexts/LanguageContext';

const T = {
  fr: {
    heroTitle: 'PipeSan - Pièces de Plomberie Professionnelles',
    heroSubtitle:
      "Robinets, raccords, connecteurs et composants d'installation professionnels. Livraison rapide EU avec spécifications techniques complètes et certifications CE.",

    // WHY
    whyChooseTitle: 'Pourquoi choisir PipeSan pour les pièces de plomberie professionnelles',
    whyChooseSubtitle:
      'Composants et pièces d’installation conçus pour les professionnels européens',
    feature1Title: 'Garantie de Qualité Professionnelle',
    feature1Desc:
      'Produits certifiés CE, fiches techniques complètes et assurance qualité pour installations professionnelles',
    feature2Title: 'Livraison Rapide en Europe',
    feature2Desc:
      "Entrepôts stratégiques en Europe pour une livraison rapide des composants d'installation",
    feature3Title: 'Support Technique & Expertise',
    feature3Desc:
      'Équipe de support technique avec expertise en installations et spécifications de composants',
    feature4Title: 'Fiable pour les Professionnels',
    feature4Desc: 'Fournisseur fiable avec une qualité constante et une documentation complète',

    // ORDER
    orderTitle: 'Comment Commander',
    orderSubtitle: 'Un processus simple en 6 étapes, de la sélection à l’installation',
    s1: 'Parcourir', s1d: 'Parcourez notre vaste catalogue de pièces professionnelles',
    s2: 'Sélectionner', s2d: 'Choisissez des produits avec des spécifications techniques détaillées',
    s3: 'Configurer', s3d: 'Sélectionnez variantes, quantités et options de livraison',
    s4: 'Commander', s4d: 'Paiement sécurisé avec plusieurs méthodes',
    s5: 'Expédier', s5d: 'Traitement rapide et expédition vers votre site',
    s6: 'Installer', s6d: 'Installation professionnelle avec nos pièces de qualité',

    // TESTIMONIALS (doar titluri/subtitluri traduse)
    testiTitle: 'Ce que disent nos clients professionnels',
    testiSubtitle: 'De încredere pentru instalatori profesioniști din întreaga Europă',

    // Restul deja aveai:
    homeProductsTitle: 'Catégories de Produits Professionnels',
    featuredServices: 'Services en Vedette',
    brassSteelTitle: 'Composants en Laiton & Acier',
    brass1: 'Vannes à boisseau sphérique et raccords en laiton CW617N',
    brass2: 'Composants en acier inoxydable 316L',
    brass3: 'Filetages BSP et NPT',
    brass4: 'Pressions admissibles jusqu’à PN40',
    toolsTitle: 'Outils & Accessoires Professionnels',
    tools1: 'Outils professionnels d’installation',
    tools2: 'Joints et solutions d’étanchéité',
    tools3: 'Flexibles și racorduri',
    tools4: 'Documentation technique incluse',
    ctaTitle: 'Prêt à sourcer des pièces de plomberie professionnelles en Europe ?',
    ctaSubtitle:
      'Parcourez notre vaste catalogue de pièces de plomberie professionnelles. Composants certifiés CE, fiches techniques et livraison rapide dans toute l’Europe pour les installateurs.',
    btnRequestCatalog: 'Demander le Catalogue',
    btnBrowseProducts: 'Parcourir les Produits',
  },

  en: {
    heroTitle: 'PipeSan - Professional Plumbing Parts',
    heroSubtitle:
      'Valves, fittings, connectors and professional installation components. Fast EU delivery with complete technical specifications and CE certifications.',

    // WHY
    whyChooseTitle: 'Why Choose PipeSan for Professional Plumbing Parts',
    whyChooseSubtitle:
      'Professional plumbing components and installation parts designed for European professionals',
    feature1Title: 'Professional Quality Guarantee',
    feature1Desc:
      'CE certified products with technical specifications and quality assurance for professional installations',
    feature2Title: 'Fast European Delivery',
    feature2Desc:
      'Strategic warehouse locations across Europe for rapid delivery of plumbing parts and components',
    feature3Title: 'Technical Support & Expertise',
    feature3Desc:
      'Professional technical support team with expertise in plumbing installations and component specifications',
    feature4Title: 'Trusted by Professionals',
    feature4Desc: 'Reliable supplier with consistent quality and documentation',

    // ORDER
    orderTitle: 'How to Order',
    orderSubtitle: 'Simple 6-step process from selection to installation',
    s1: 'Browse', s1d: 'Browse our extensive catalog of professional parts',
    s2: 'Select', s2d: 'Choose products with detailed technical specifications',
    s3: 'Configure', s3d: 'Select variants, quantities and delivery options',
    s4: 'Order', s4d: 'Secure checkout with multiple payment methods',
    s5: 'Ship', s5d: 'Fast processing and dispatch to your location',
    s6: 'Install', s6d: 'Professional installation with our quality parts',

    // TESTI
    testiTitle: 'What Our Professional Clients Say',
    testiSubtitle: 'Trusted by professional installers across Europe',

    // restul
    homeProductsTitle: 'Professional Product Categories',
    featuredServices: 'Featured Services',
    brassSteelTitle: 'Brass & Steel Components',
    brass1: 'CW617N brass ball valves and fittings',
    brass2: '316L stainless steel components',
    brass3: 'BSP and NPT threaded connections',
    brass4: 'Pressure ratings up to PN40',
    toolsTitle: 'Professional Tools & Accessories',
    tools1: 'Professional installation tools',
    tools2: 'Gaskets and sealing solutions',
    tools3: 'Flexible hoses and connections',
    tools4: 'Technical documentation included',
    ctaTitle: 'Ready to Source Professional Plumbing Parts in Europe?',
    ctaSubtitle:
      'Browse our extensive catalog of professional plumbing parts. CE certified components, technical specifications and fast delivery across Europe for professional installers.',
    btnRequestCatalog: 'Request Catalog',
    btnBrowseProducts: 'Browse Products',
  },

  it: {
    heroTitle: 'PipeSan - Componenti Idraulici Professionali',
    heroSubtitle:
      'Valvole, raccordi, connettori e componenti per installazioni professionali. Consegna rapida EU con specifiche tecniche complete e certificazioni CE.',

    whyChooseTitle: 'Perché scegliere PipeSan per componenti idraulici professionali',
    whyChooseSubtitle:
      'Componenti e parti di installazione progettati per professionisti europei',
    feature1Title: 'Garanzia di Qualità Professionale',
    feature1Desc:
      'Prodotti certificati CE con specifiche tecniche e garanzia di qualità per installazioni professionali',
    feature2Title: 'Consegna Rapida in Europa',
    feature2Desc:
      'Magazzini strategici in tutta Europa per consegne rapide',
    feature3Title: 'Supporto Tecnico & Competenza',
    feature3Desc:
      'Team di supporto tecnico con esperienza in installazioni e specifiche dei componenti',
    feature4Title: 'Affidato dai Professionisti',
    feature4Desc: 'Fornitore affidabile con qualità costante e documentazione',

    orderTitle: 'Come Ordinare',
    orderSubtitle: 'Processo semplice in 6 passaggi dalla selezione all’installazione',
    s1: 'Sfoglia', s1d: 'Sfoglia il nostro ampio catalogo di componenti professionali',
    s2: 'Seleziona', s2d: 'Scegli prodotti con specifiche tecniche dettagliate',
    s3: 'Configura', s3d: 'Seleziona varianti, quantità e opzioni di consegna',
    s4: 'Ordina', s4d: 'Checkout sicuro con più metodi di pagamento',
    s5: 'Spedisci', s5d: 'Elaborazione rapida e spedizione presso la tua sede',
    s6: 'Installa', s6d: 'Installazione professionale con i nostri componenti di qualità',

    testiTitle: 'Cosa dicono i nostri clienti professionali',
    testiSubtitle: 'Scelto da installatori professionisti in tutta Europa',

    homeProductsTitle: 'Categorie di Prodotti Professionali',
    featuredServices: 'Servizi in Evidenza',
    brassSteelTitle: 'Componenti in Ottone & Acciaio',
    brass1: 'Valvole a sfera e raccordi in ottone CW617N',
    brass2: 'Componenti in acciaio inox 316L',
    brass3: 'Filettature BSP e NPT',
    brass4: 'Pressioni fino a PN40',
    toolsTitle: 'Utensili & Accessori Professionali',
    tools1: 'Utensili professionali di installazione',
    tools2: 'Guarnizioni e soluzioni di tenuta',
    tools3: 'Tubi flessibili e raccordi',
    tools4: 'Documentazione tecnica inclusa',
    ctaTitle: 'Pronto a procurarti componenti idraulici professionali in Europa?',
    ctaSubtitle:
      'Sfoglia il nostro ampio catalogo di componenti idraulici professionali. Componenti certificati CE, specifiche tecniche e consegna rapida in tutta Europa.',
    btnRequestCatalog: 'Richiedi Catalogo',
    btnBrowseProducts: 'Sfoglia Prodotti',
  },

  de: {
    heroTitle: 'PipeSan - Professionelle Sanitärteile',
    heroSubtitle:
      'Ventile, Fittings, Verbinder und professionelle Installationskomponenten. Schnelle EU-Lieferung mit vollständigen technischen Spezifikationen und CE-Zertifizierungen.',

    whyChooseTitle: 'Warum PipeSan für professionelle Sanitärteile',
    whyChooseSubtitle:
      'Professionelle Komponenten und Installationsmaterial für europäische Fachleute',
    feature1Title: 'Professionelle Qualitätsgarantie',
    feature1Desc:
      'CE-zertifizierte Produkte mit technischen Spezifikationen und Qualitätssicherung',
    feature2Title: 'Schnelle EU-Lieferung',
    feature2Desc:
      'Strategische Lager in Europa für schnelle Lieferung',
    feature3Title: 'Technischer Support & Expertise',
    feature3Desc:
      'Technisches Support-Team mit Expertise in Installationen und Spezifikationen',
    feature4Title: 'Bewährt bei Profis',
    feature4Desc: 'Zuverlässiger Lieferant mit konsistenter Qualität und Dokumentation',

    orderTitle: 'So bestellen Sie',
    orderSubtitle: 'Einfacher 6-Schritte-Prozess von Auswahl bis Installation',
    s1: 'Durchsuchen', s1d: 'Durchsuchen Sie unseren umfangreichen Katalog',
    s2: 'Auswählen', s2d: 'Produkte mit detaillierten Spezifikationen wählen',
    s3: 'Konfigurieren', s3d: 'Varianten, Mengen und Lieferung festlegen',
    s4: 'Bestellen', s4d: 'Sicherer Checkout mit mehreren Zahlungsmethoden',
    s5: 'Versand', s5d: 'Schnelle Bearbeitung und Versand',
    s6: 'Installieren', s6d: 'Professionelle Installation mit unseren Qualitätsprodukten',

    testiTitle: 'Was unsere Profikunden sagen',
    testiSubtitle: 'Von professionellen Installateuren in Europa vertraut',

    homeProductsTitle: 'Professionelle Produktkategorien',
    featuredServices: 'Hervorgehobene Services',
    brassSteelTitle: 'Messing- & Stahlkomponenten',
    brass1: 'Kugelhähne und Fittings aus CW617N-Messing',
    brass2: 'Bauteile aus Edelstahl 316L',
    brass3: 'BSP- und NPT-Gewinde',
    brass4: 'Druckstufen bis PN40',
    toolsTitle: 'Professionelles Werkzeug & Zubehör',
    tools1: 'Professionelle Installationswerkzeuge',
    tools2: 'Dichtungen und Abdichtungslösungen',
    tools3: 'Flexible Schläuche und Verbindungen',
    tools4: 'Technische Dokumentation inklusive',
    ctaTitle: 'Bereit, professionelle Sanitärteile in Europa zu beschaffen?',
    ctaSubtitle:
      'Durchsuchen Sie unseren umfangreichen Katalog professioneller Sanitärkomponenten. CE-zertifizierte Bauteile, technische Daten und schnelle EU-Lieferung.',
    btnRequestCatalog: 'Katalog anfordern',
    btnBrowseProducts: 'Produkte durchsuchen',
  },

  es: {
    heroTitle: 'PipeSan - Componentes de Fontanería Profesional',
    heroSubtitle:
      'Válvulas, accesorios, conectores y componentes para instalaciones profesionales. Entrega rápida en la UE con especificaciones técnicas completas y certificaciones CE.',

    whyChooseTitle: 'Por qué elegir PipeSan para componentes profesionales',
    whyChooseSubtitle:
      'Componentes y piezas de instalación diseñadas para profesionales europeos',
    feature1Title: 'Garantía de Calidad Profesional',
    feature1Desc:
      'Productos certificados CE con especificaciones técnicas y aseguramiento de calidad',
    feature2Title: 'Entrega Rápida en Europa',
    feature2Desc:
      'Almacenes estratégicos en Europa para entregas rápidas',
    feature3Title: 'Soporte Técnico & Expertos',
    feature3Desc:
      'Equipo de soporte técnico con experiencia en instalaciones y especificaciones',
    feature4Title: 'De confianza por Profesionales',
    feature4Desc: 'Proveedor fiable con calidad constante y documentación',

    orderTitle: 'Cómo Hacer un Pedido',
    orderSubtitle: 'Proceso sencillo de 6 pasos desde la selección a la instalación',
    s1: 'Explorar', s1d: 'Explora nuestro amplio catálogo de piezas profesionales',
    s2: 'Seleccionar', s2d: 'Elige productos con especificaciones técnicas detalladas',
    s3: 'Configurar', s3d: 'Elige variantes, cantidades y opciones de entrega',
    s4: 'Pagar', s4d: 'Pago seguro con múltiples métodos',
    s5: 'Enviar', s5d: 'Procesamiento rápido y envío a tu ubicación',
    s6: 'Instalar', s6d: 'Instalación profesional con nuestras piezas de calidad',

    testiTitle: 'Lo que dicen nuestros clientes profesionales',
    testiSubtitle: 'De confianza por instaladores profesionales en Europa',

    homeProductsTitle: 'Categorías de Productos Profesionales',
    featuredServices: 'Servicios Destacados',
    brassSteelTitle: 'Componentes de Latón y Acero',
    brass1: 'Válvulas de bola y accesorios de latón CW617N',
    brass2: 'Componentes de acero inoxidable 316L',
    brass3: 'Conexiones roscadas BSP y NPT',
    brass4: 'Presiones hasta PN40',
    toolsTitle: 'Herramientas y Accesorios Profesionales',
    tools1: 'Herramientas profesionales de instalación',
    tools2: 'Juntas y soluciones de sellado',
    tools3: 'Mangueras flexibles y conexiones',
    tools4: 'Documentación técnica incluida',
    ctaTitle: '¿Listo para abastecerte de componentes de fontanería profesionales en Europa?',
    ctaSubtitle:
      'Explora nuestro amplio catálogo de piezas profesionales. Componentes certificados CE, especificaciones técnicas y entrega rápida en toda Europa.',
    btnRequestCatalog: 'Solicitar Catálogo',
    btnBrowseProducts: 'Explorar Productos',
  },

  ro: {
    heroTitle: 'PipeSan - Componente de Instalații Profesionale',
    heroSubtitle:
      'Robinete, racorduri, conectori și componente pentru instalații profesionale. Livrare rapidă în UE cu specificații tehnice complete și certificări CE.',

    whyChooseTitle: 'De ce PipeSan pentru componente profesionale de instalații',
    whyChooseSubtitle:
      'Componente și piese de instalații proiectate pentru profesioniștii din Europa',
    feature1Title: 'Garanția Calității Profesionale',
    feature1Desc:
      'Produse certificate CE cu specificații tehnice complete și asigurarea calității',
    feature2Title: 'Livrare Rapidă în Europa',
    feature2Desc:
      'Depozite strategice în Europa pentru livrare rapidă a componentelor',
    feature3Title: 'Suport Tehnic & Expertiză',
    feature3Desc:
      'Echipă de suport tehnic cu expertiză în instalații și specificații de componente',
    feature4Title: 'De Încredere pentru Profesioniști',
    feature4Desc: 'Furnizor de încredere cu calitate constantă și documentație',

    orderTitle: 'Cum Comanzi',
    orderSubtitle: 'Proces simplu în 6 pași, de la selecție la instalare',
    s1: 'Răsfoiește', s1d: 'Răsfoiește catalogul nostru de piese profesionale',
    s2: 'Selectează', s2d: 'Alege produse cu specificații tehnice detaliate',
    s3: 'Configurează', s3d: 'Selectează variantele, cantitățile și opțiunile de livrare',
    s4: 'Comandă', s4d: 'Checkout securizat cu metode multiple de plată',
    s5: 'Expediere', s5d: 'Procesare rapidă și expediere către locația ta',
    s6: 'Instalează', s6d: 'Montaj profesional cu piesele noastre de calitate',

    testiTitle: 'Ce spun clienții noștri profesioniști',
    testiSubtitle: 'De încredere pentru instalatori profesioniști din întreaga Europă',

    homeProductsTitle: 'Categorii de Produse Profesionale',
    featuredServices: 'Servicii Evidențiate',
    brassSteelTitle: 'Componente din Alamă & Oțel',
    brass1: 'Robinete cu bilă și fitinguri din alamă CW617N',
    brass2: 'Componente din inox 316L',
    brass3: 'Filete BSP și NPT',
    brass4: 'Presiuni admise până la PN40',
    toolsTitle: 'Unelte & Accesorii Profesionale',
    tools1: 'Unelte profesionale pentru instalare',
    tools2: 'Garnituri și soluții de etanșare',
    tools3: 'Furtunuri flexibile și racorduri',
    tools4: 'Documentație tehnică inclusă',
    ctaTitle: 'Ești gata să achiziționezi piese profesionale de instalații în Europa?',
    ctaSubtitle:
      'Răsfoiește catalogul nostru de piese profesionale. Componente certificate CE, specificații tehnice și livrare rapidă în toată Europa.',
    btnRequestCatalog: 'Solicită Catalogul',
    btnBrowseProducts: 'Răsfoiește Produsele',
  },
};

function Home() {
  const { currentLanguage } = useLanguage();
  const t = useMemo(() => T[currentLanguage] || T.fr, [currentLanguage]);

  // ---- texts pentru secțiuni
  const whyTitle = t.whyChooseTitle;
  const whySubtitle = t.whyChooseSubtitle;
  const whyFeatures = [
    { title: t.feature1Title, description: t.feature1Desc },
    { title: t.feature2Title, description: t.feature2Desc },
    { title: t.feature3Title, description: t.feature3Desc },
    { title: t.feature4Title, description: t.feature4Desc },
  ];

  const orderTitle = t.orderTitle;
  const orderSubtitle = t.orderSubtitle;
  const orderSteps = [
    { step: t.s1, description: t.s1d },
    { step: t.s2, description: t.s2d },
    { step: t.s3, description: t.s3d },
    { step: t.s4, description: t.s4d },
    { step: t.s5, description: t.s5d },
    { step: t.s6, description: t.s6d },
  ];

  const testiTitle = t.testiTitle;
  const testiSubtitle = t.testiSubtitle;
  const testiItems = [
    // recenziile rămân în original (cum ai cerut), doar headline/subheadline se traduc
    { name: 'Jean-Pierre Dubois', company: 'Dubois Plomberie', text: 'PipeSan provides excellent quality brass fittings with fast delivery. Perfect for our professional installations!', rating: 5 },
    { name: 'Marco Rossi', company: 'Rossi Impianti', text: 'Outstanding technical support and product quality. The specifications are always accurate and complete.', rating: 5 },
    { name: 'Klaus Mueller', company: 'Mueller Sanitär GmbH', text: 'Reliable supplier with CE certified products. Great for both B2B and professional installations.', rating: 5 },
  ];

  const [content, setContent] = useState({});
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [contentData, servicesData] = await Promise.all([
          apiClient.admin.getContent(),
          apiClient.admin.getServices(),
        ]);
        setContent(contentData || {});
        setServices((servicesData || []).slice(0, 3));
      } catch (e) {
        console.error('Error fetching home data:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <HeroSection
        title={content.hero_title || t.heroTitle}
        subtitle={content.hero_subtitle || t.heroSubtitle}
        ctaLabel={t.btnBrowseProducts}
      />

      {/* ✅ acum trecem textele traduse ca props */}
      <WhyChooseUs title={whyTitle} subtitle={whySubtitle} features={whyFeatures} />
      <OrderProcess title={orderTitle} subtitle={orderSubtitle} steps={orderSteps} />
      <Testimonials title={testiTitle} subtitle={testiSubtitle} testimonials={testiItems} />

      {/* ... restul paginii (deja ok) */}
      <Section>
        {/* ... */}
      </Section>

      <Section background="primary">
        {/* ... */}
      </Section>
    </div>
  );
}

export default Home;
