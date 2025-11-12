// FILE: src/components/TermsOfService.jsx
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { FileText, Scale, AlertTriangle, Shield } from 'lucide-react';


/**
 * Dicționar simplu. Am tradus concis tot conținutul esențial.
 * Dacă vrei, poți ajusta liber textele de mai jos.
 */
const T = {
  fr: {
    title: 'Conditions Générales',
    updated: 'Dernière mise à jour',
    introTitle: '1. Introduction',
    intro:
      'Ces Conditions Générales (« Conditions ») régissent l’utilisation des services fournis par Prep Center France via le site prep-center.eu et les services de préparation FBA. En accédant à nos services, vous acceptez ces Conditions.',
    servicesTitle: '2. Nos Services',
    servicesBullets: [
      'Préparation Amazon FBA (réception, contrôle qualité, étiquetage FNSKU)',
      'Emballage et protection (polybagging, calage)',
      'Stockage temporaire',
      'Expéditions vers les centres de distribution Amazon',
      'FBM pour plusieurs places de marché (Amazon, eBay, Shopify)',
      'Conseil Private Label & sourcing produits',
    ],
    accountTitle: '3. Création de Compte',
    accountBullets: [
      'Maintenir la confidentialité de vos identifiants',
      'Assumer la responsabilité des activités de votre compte',
      'Informer immédiatement en cas d’utilisation non autorisée',
      'Mettre à jour les coordonnées et la facturation',
    ],
    pricingTitle: '4. Tarifs et Paiements',
    pricingWarnTitle: 'Tarifs & Facturation :',
    pricingWarnBullets: [
      "Les prix sont affichés en EUR et hors TVA",
      "La facturation s’effectue au maximum toutes les 2 semaines",
      "Les paiements sont traités via des prestataires de paiement agréés",
      "Les factures impayées peuvent entraîner la suspension des services",
    ],
    refundTitle: 'Politique de Remboursement :',
    refundText:
      'Les services rendus (préparation, étiquetage, expédition) ne sont pas remboursables. En cas d’erreur de notre part, correction gratuite ou avoir pour services futurs.',
    handlingTitle: '5. Manipulation des Produits',
    clientRespTitle: 'Responsabilités du Client :',
    clientRespBullets: [
      'Fournir des informations complètes et exactes',
      'Respecter les règles Amazon FBA et la loi',
      'S’assurer que les produits ne sont pas dangereux/interdits',
      'Communiquer des instructions claires de préparation',
    ],
    ourRespTitle: 'Nos Responsabilités :',
    ourRespBullets: [
      'Manipulation professionnelle et soignée',
      'Respect des standards de qualité Amazon FBA',
      'Signalement rapide des problèmes',
      'Sécurité et intégrité des produits en stockage',
    ],
    liabilityTitle: '6. Limitation de Responsabilité',
    liabilityBullets: [
      'Responsabilité limitée à la valeur des services fournis',
      'Pas de responsabilité pour pertes indirectes/consécutives',
      'Assurance produits à la charge du client',
      'Aucune garantie d’acceptation par Amazon',
      'Force majeure exonératoire',
    ],
    prohibitedTitle: '7. Produits Interdits',
    dangerous: 'Produits Dangereux :',
    dangerousBullets: [
      'Substances chimiques dangereuses',
      'Matériaux inflammables',
      'Batteries lithium défectueuses',
      'Produits radioactifs',
    ],
    illegal: 'Produits Illégaux :',
    illegalBullets: [
      'Produits contrefaits',
      'Substances interdites',
      'Armes et munitions',
      'Produits pour adultes',
    ],
    privacyTitle: '8. Protection des Données',
    privacyText:
      'Nous respectons strictement le RGPD. Voir notre ',
    privacyLink: 'Politique de Confidentialité',
    terminationTitle: '9. Résiliation',
    terminationText:
      'Chaque partie peut mettre fin au contrat avec un préavis de 30 jours. En cas de violation grave, nous pouvons suspendre/fermer le compte immédiatement.',
    terminationBulletsTitle: 'En cas de résiliation :',
    terminationBullets: [
      'Retour des produits à l’adresse indiquée (aux frais du client)',
      'Les factures impayées restent dues',
      'Les données du compte sont archivées selon la politique de confidentialité',
    ],
    lawTitle: '10. Droit Applicable',
    lawText:
      'Ces Conditions sont régies par le droit français et/ou roumain selon la nature du service. Les litiges seront réglés à l’amiable ou par les tribunaux compétents en France ou en Roumanie.',
    contactTitle: '11. Contact',
    contactText: 'Pour toute question concernant ces Conditions :',
    contact: {
      emailLabel: 'Email',
      phoneLabel: 'Téléphone',
      addressLabel: 'Adresse',
      email: 'contact@pipesan.eu',
      phone: '+33 675 11 62 18',
      address:
        'Sat Leamna de jos, Comuna Bucovat, nr.159 A, Région Dolj, Roumanie',
    },
    changesTitle: '12. Modifications',
    changesText:
      'Nous pouvons modifier ces Conditions. Les changements seront notifiés par email et publiés sur le site au moins 30 jours avant leur entrée en vigueur. La poursuite d’utilisation vaut acceptation.',
  },

  en: {
    title: 'Terms of Service',
    updated: 'Last updated',
    introTitle: '1. Introduction',
    intro:
      'These Terms govern the services provided by Prep Center France via prep-center.eu and FBA preparation. By using our services you agree to these Terms.',
    servicesTitle: '2. Our Services',
    servicesBullets: [
      'Amazon FBA prep (receiving, QC, FNSKU labeling)',
      'Packaging & protection (polybagging, dunnage)',
      'Temporary storage',
      'Shipments to Amazon FCs',
      'FBM for multiple marketplaces (Amazon, eBay, Shopify)',
      'Private Label consulting & product sourcing',
    ],
    accountTitle: '3. Account Registration',
    accountBullets: [
      'Keep credentials confidential',
      'You are responsible for account activity',
      'Notify us of any unauthorized use',
      'Keep contact & billing info up to date',
    ],
    pricingTitle: '4. Pricing & Payments',
    pricingWarnTitle: 'Pricing & Invoicing:',
    pricingWarnBullets: [
       "Prices are displayed in EUR and exclude VAT",
  "Invoicing occurs at most every 2 weeks",
  "Payments are processed by authorized payment processors",
  "Overdue invoices may lead to suspension of services",
    ],
    refundTitle: 'Refund Policy:',
    refundText:
      'Rendered services (prep, labeling, shipping) are non-refundable. If we make an error, we correct it or credit future services.',
    handlingTitle: '5. Product Handling',
    clientRespTitle: 'Client Responsibilities:',
    clientRespBullets: [
      'Provide complete and accurate product info',
      'Comply with Amazon FBA rules and laws',
      'Ensure products are not dangerous/illegal',
      'Provide clear prep instructions',
    ],
    ourRespTitle: 'Our Responsibilities:',
    ourRespBullets: [
      'Careful, professional handling',
      'Respect Amazon FBA quality standards',
      'Promptly report issues',
      'Secure storage and integrity',
    ],
    liabilityTitle: '6. Limitation of Liability',
    liabilityBullets: [
      'Liability limited to the value of services provided',
      'No liability for indirect/consequential losses',
      'Product insurance is client’s responsibility',
      'No guarantee of Amazon acceptance',
      'Force majeure applies',
    ],
    prohibitedTitle: '7. Prohibited Items',
    dangerous: 'Dangerous Goods:',
    dangerousBullets: [
      'Hazardous chemicals',
      'Flammable materials',
      'Defective lithium batteries',
      'Radioactive products',
    ],
    illegal: 'Illegal Items:',
    illegalBullets: [
      'Counterfeit goods',
      'Prohibited substances',
      'Weapons & ammunition',
      'Adult products',
    ],
    privacyTitle: '8. Data Protection',
    privacyText: 'We strictly comply with GDPR. See our ',
    privacyLink: 'Privacy Policy',
    terminationTitle: '9. Termination',
    terminationText:
      'Either party may terminate with 30 days’ notice. For material breach we may suspend or close the account immediately.',
    terminationBulletsTitle: 'Upon termination:',
    terminationBullets: [
      'Remaining products returned (at client’s cost)',
      'Outstanding invoices remain due',
      'Account data archived per privacy policy',
    ],
    lawTitle: '10. Governing Law',
    lawText:
      'French and/or Romanian law applies depending on service. Disputes by negotiation or competent courts in France/Romania.',
    contactTitle: '11. Contact',
    contactText: 'For questions regarding these Terms:',
    contact: {
      emailLabel: 'Email',
      phoneLabel: 'Phone',
      addressLabel: 'Address',
      email: 'contact@pipesan.eu',
      phone: '+33 675 11 62 18',
      address:
        'Sat Leamna de jos, Comuna Bucovat, nr.159 A, Dolj Region, Romania',
    },
    changesTitle: '12. Changes',
    changesText:
      'We may update these Terms with at least 30 days’ notice by email and on the site. Continued use constitutes acceptance.',
  },

  it: {
    title: 'Termini e Condizioni',
    updated: 'Ultimo aggiornamento',
    introTitle: '1. Introduzione',
    intro:
      'Questi Termini regolano i servizi di Prep Center France su prep-center.eu e la preparazione FBA. Usando i servizi accetti i Termini.',
    servicesTitle: '2. I Nostri Servizi',
    servicesBullets: [
      'Preparazione Amazon FBA (ricezione, QC, etichettatura FNSKU)',
      'Imballaggio e protezione',
      'Stoccaggio temporaneo',
      'Spedizioni ai centri Amazon',
      'FBM per più marketplace',
      'Consulenza Private Label & sourcing',
    ],
    accountTitle: '3. Registrazione Account',
    accountBullets: [
      'Mantieni riservate le credenziali',
      'Responsabile delle attività del tuo account',
      'Notifica uso non autorizzato',
      'Aggiorna contatti e fatturazione',
    ],
    pricingTitle: '4. Prezzi e Pagamenti',
    pricingWarnTitle: 'Prezzi & Fatturazione:',
    pricingWarnBullets: [
      "I prezzi sono espressi in EUR e sono IVA esclusa",
  "La fatturazione avviene al massimo ogni 2 settimane",
  "I pagamenti sono elaborati da processori di pagamento autorizzati",
  "Le fatture scadute possono comportare la sospensione dei servizi",
    ],
    refundTitle: 'Politica di Rimborso:',
    refundText:
      'Servizi resi non rimborsabili. Errori nostri → correzione o credito futuro.',
    handlingTitle: '5. Gestione Prodotti',
    clientRespTitle: 'Responsabilità del Cliente:',
    clientRespBullets: [
      'Info prodotto complete e accurate',
      'Rispetto regole Amazon FBA e leggi',
      'Prodotti non pericolosi/illegali',
      'Istruzioni chiare di preparazione',
    ],
    ourRespTitle: 'Le Nostre Responsabilità:',
    ourRespBullets: [
      'Manipolazione professionale',
      'Standard qualità Amazon FBA',
      'Segnalazione rapida dei problemi',
      'Sicurezza in magazzino',
    ],
    liabilityTitle: '6. Limitazione di Responsabilità',
    liabilityBullets: [
      'Limitata al valore dei servizi',
      'No perdite indirette/consequenziali',
      'Assicurazione a carico del cliente',
      'Nessuna garanzia di accettazione Amazon',
      'Forza maggiore',
    ],
    prohibitedTitle: '7. Prodotti Vietati',
    dangerous: 'Prodotti Pericolosi:',
    dangerousBullets: [
      'Sostanze pericolose',
      'Materiali infiammabili',
      'Batterie al litio difettose',
      'Prodotti radioattivi',
    ],
    illegal: 'Prodotti Illegali:',
    illegalBullets: [
      'Prodotti contraffatti',
      'Sostanze proibite',
      'Armi e munizioni',
      'Prodotti per adulti',
    ],
    privacyTitle: '8. Protezione Dati',
    privacyText: 'Conformità rigorosa al GDPR. Vedi la nostra ',
    privacyLink: 'Informativa sulla Privacy',
    terminationTitle: '9. Cessazione',
    terminationText:
      'Ciascuna parte può recedere con preavviso di 30 giorni. In caso di violazioni gravi, sospensione/chiusura immediata.',
    terminationBulletsTitle: 'Alla cessazione:',
    terminationBullets: [
      'Reso dei prodotti (a carico del cliente)',
      'Fatture insolute dovute',
      'Dati archiviati secondo privacy',
    ],
    lawTitle: '10. Legge Applicabile',
    lawText:
      'Legge francese/rumena. Controversie al negoziato o tribunali competenti.',
    contactTitle: '11. Contatto',
    contactText: 'Per domande su questi Termini:',
    contact: {
      emailLabel: 'Email',
      phoneLabel: 'Telefono',
      addressLabel: 'Indirizzo',
      email: 'contact@pipesan.eu',
      phone: '+33 675 11 62 18',
      address:
        'Sat Leamna de jos, Comuna Bucovat, nr.159 A, Regione Dolj, Romania',
    },
    changesTitle: '12. Modifiche',
    changesText:
      'Possiamo aggiornare i Termini con 30 giorni di preavviso. L’uso continuato implica accettazione.',
  },

  de: {
    title: 'Allgemeine Geschäftsbedingungen',
    updated: 'Zuletzt aktualisiert',
    introTitle: '1. Einführung',
    intro:
      'Diese Bedingungen regeln die Dienste von Prep Center France über prep-center.eu und FBA-Preparation. Durch Nutzung stimmen Sie zu.',
    servicesTitle: '2. Unsere Leistungen',
    servicesBullets: [
      'Amazon FBA-Prep (Wareneingang, QC, FNSKU-Label)',
      'Verpackung & Schutz',
      'Temporäre Lagerung',
      'Versand an Amazon-Zentren',
      'FBM für mehrere Marktplätze',
      'Private Label Beratung & Sourcing',
    ],
    accountTitle: '3. Kontoerstellung',
    accountBullets: [
      'Zugangsdaten vertraulich halten',
      'Verantwortung für Kontonutzung',
      'Unbefugte Nutzung melden',
      'Kontaktdaten & Abrechnung aktualisieren',
    ],
    pricingTitle: '4. Preise & Zahlungen',
    pricingWarnTitle: 'Preise & Abrechnung:',
    pricingWarnBullets: [
      "Preise werden in EUR angezeigt und verstehen sich exkl. MwSt.",
  "Die Abrechnung erfolgt spätestens alle 2 Wochen",
  "Zahlungen werden über autorisierte Zahlungsdienstleister abgewickelt",
  "Überfällige Rechnungen können zur Aussetzung der Dienstleistungen führen",
    ],
    refundTitle: 'Rückerstattungen:',
    refundText:
      'Erbrachte Leistungen sind nicht erstattungsfähig. Bei unserem Fehler: Korrektur oder Gutschrift.',
    handlingTitle: '5. Produkt-Handling',
    clientRespTitle: 'Pflichten des Kunden:',
    clientRespBullets: [
      'Vollständige und korrekte Produktinfos',
      'Einhaltung Amazon FBA & Gesetze',
      'Keine gefährlichen/illegalen Produkte',
      'Klare Prep-Anweisungen',
    ],
    ourRespTitle: 'Unsere Pflichten:',
    ourRespBullets: [
      'Sorgfältige, professionelle Handhabung',
      'Amazon FBA Qualitätsstandards',
      'Schnelle Problem-Meldung',
      'Sichere Lagerung',
    ],
    liabilityTitle: '6. Haftungsbeschränkung',
    liabilityBullets: [
      'Haftung auf Leistungswert begrenzt',
      'Keine Haftung für indirekte Schäden',
      'Produktversicherung beim Kunden',
      'Keine Amazon-Garantie',
      'Höhere Gewalt',
    ],
    prohibitedTitle: '7. Verbotene Produkte',
    dangerous: 'Gefahrgut:',
    dangerousBullets: [
      'Gefährliche Chemikalien',
      'Entzündliche Stoffe',
      'Defekte Lithiumbatterien',
      'Radioaktive Produkte',
    ],
    illegal: 'Illegale Produkte:',
    illegalBullets: [
      'Fälschungen',
      'Verbotene Substanzen',
      'Waffen & Munition',
      'Erwachsenenprodukte',
    ],
    privacyTitle: '8. Datenschutz',
    privacyText: 'Strikte DSGVO-Konformität. Siehe unsere ',
    privacyLink: 'Datenschutzerklärung',
    terminationTitle: '9. Kündigung',
    terminationText:
      'Kündigung mit 30 Tagen Frist. Bei schwerem Verstoß sofortige Sperrung/Schließung möglich.',
    terminationBulletsTitle: 'Bei Kündigung:',
    terminationBullets: [
      'Rücksendung der Waren (auf Kosten des Kunden)',
      'Offene Rechnungen bleiben fällig',
      'Datenarchivierung gem. Datenschutz',
    ],
    lawTitle: '10. Anwendbares Recht',
    lawText:
      'Französisches/rumänisches Recht. Streitfälle vor zuständigen Gerichten.',
    contactTitle: '11. Kontakt',
    contactText: 'Fragen zu diesen Bedingungen:',
    contact: {
      emailLabel: 'E-Mail',
      phoneLabel: 'Telefon',
      addressLabel: 'Adresse',
      email: 'contact@pipesan.eu',
      phone: '+33 675 11 62 18',
      address:
        'Sat Leamna de jos, Comuna Bucovat, nr.159 A, Region Dolj, Rumänien',
    },
    changesTitle: '12. Änderungen',
    changesText:
      'Änderungen mit 30 Tagen Vorlauf; Nutzung bedeutet Zustimmung.',
  },

  es: {
    title: 'Términos y Condiciones',
    updated: 'Última actualización',
    introTitle: '1. Introducción',
    intro:
      'Estos Términos rigen los servicios de Prep Center France en prep-center.eu y preparación FBA. Al usar los servicios aceptas estos Términos.',
    servicesTitle: '2. Nuestros Servicios',
    servicesBullets: [
      'Preparación Amazon FBA (recepción, QC, FNSKU)',
      'Embalaje y protección',
      'Almacenamiento temporal',
      'Envíos a centros de Amazon',
      'FBM para múltiples marketplaces',
      'Consultoría Private Label y sourcing',
    ],
    accountTitle: '3. Registro de Cuenta',
    accountBullets: [
      'Mantener credenciales confidenciales',
      'Responsable por la actividad de la cuenta',
      'Notificar uso no autorizado',
      'Actualizar contacto y facturación',
    ],
    pricingTitle: '4. Precios y Pagos',
    pricingWarnTitle: 'Precios & Facturación:',
    pricingWarnBullets: [
      "Los precios se muestran en EUR y no incluyen IVA",
  "La facturación se realiza como máximo cada 2 semanas",
  "Los pagos se procesan a través de proveedores de pago autorizados",
  "Las facturas vencidas pueden conllevar la suspensión de los servicios",
    ],
    refundTitle: 'Política de Reembolso:',
    refundText:
      'Servicios prestados no reembolsables. Si fallamos, corregimos o damos crédito futuro.',
    handlingTitle: '5. Manipulación de Productos',
    clientRespTitle: 'Responsabilidades del Cliente:',
    clientRespBullets: [
      'Información de producto completa y exacta',
      'Cumplir con normas de Amazon FBA y leyes',
      'Productos no peligrosos/ilegales',
      'Instrucciones claras de preparación',
    ],
    ourRespTitle: 'Nuestras Responsabilidades:',
    ourRespBullets: [
      'Manipulación profesional',
      'Estándares de calidad Amazon FBA',
      'Reporte rápido de problemas',
      'Almacenaje seguro',
    ],
    liabilityTitle: '6. Limitación de Responsabilidad',
    liabilityBullets: [
      'Limitada al valor de los servicios',
      'Sin responsabilidad por pérdidas indirectas',
      'Seguro de productos a cargo del cliente',
      'Sin garantía de aceptación por Amazon',
      'Fuerza mayor',
    ],
    prohibitedTitle: '7. Productos Prohibidos',
    dangerous: 'Peligrosos:',
    dangerousBullets: [
      'Químicos peligrosos',
      'Materiales inflamables',
      'Baterías de litio defectuosas',
      'Productos radiactivos',
    ],
    illegal: 'Ilegales:',
    illegalBullets: [
      'Productos falsificados',
      'Sustancias prohibidas',
      'Armas y munición',
      'Productos para adultos',
    ],
    privacyTitle: '8. Protección de Datos',
    privacyText: 'Cumplimos estrictamente RGPD. Ver ',
    privacyLink: 'Política de Privacidad',
    terminationTitle: '9. Terminación',
    terminationText:
      'Cualquiera puede terminar con 30 días de aviso. Por incumplimiento grave, suspensión/cierre inmediato.',
    terminationBulletsTitle: 'Al terminar:',
    terminationBullets: [
      'Devolución de productos (a cargo del cliente)',
      'Facturas pendientes siguen debidas',
      'Datos archivados según privacidad',
    ],
    lawTitle: '10. Ley Aplicable',
    lawText:
      'Ley francesa/rumana. Disputas por negociación o tribunales competentes.',
    contactTitle: '11. Contacto',
    contactText: 'Para preguntas sobre estos Términos:',
    contact: {
      emailLabel: 'Email',
      phoneLabel: 'Teléfono',
      addressLabel: 'Dirección',
      email: 'contact@pipesan.eu',
      phone: '+33 675 11 62 18',
      address:
        'Sat Leamna de jos, Comuna Bucovat, nr.159 A, Región Dolj, Rumanía',
    },
    changesTitle: '12. Cambios',
    changesText:
      'Podemos actualizar los Términos con 30 días de aviso. El uso continuado implica aceptación.',
  },

  ro: {
    title: 'Termeni și Condiții',
    updated: 'Ultima actualizare',
    introTitle: '1. Introducere',
    intro:
      'Acești Termeni reglementează serviciile oferite de Prep Center France prin prep-center.eu și serviciile FBA. Folosind serviciile, acceptați acești Termeni.',
    servicesTitle: '2. Serviciile Noastre',
    servicesBullets: [
      'Prelucrare Amazon FBA (recepție, QC, etichetare FNSKU)',
      'Ambalare și protecție',
      'Depozitare temporară',
      'Expediere către centrele Amazon',
      'FBM pentru mai multe marketplace-uri',
      'Consultanță Private Label & sourcing',
    ],
    accountTitle: '3. Înregistrarea Contului',
    accountBullets: [
      'Păstrarea confidențialității datelor',
      'Responsabil pentru activitatea contului',
      'Notificare la utilizare neautorizată',
      'Actualizare date de contact și facturare',
    ],
    pricingTitle: '4. Prețuri și Plăți',
    pricingWarnTitle: 'Prețuri & Facturare:',
    pricingWarnBullets: [
        'Prețurile sunt afișate în EUR și nu includ TVA',
        'Facturarea se face la maximum 2 săptămâni',
        'Plățile sunt procesate prin procesatori de plăți autorizați',
        'Facturile restante pot duce la suspendarea serviciilor',
    ],
    refundTitle: 'Politica de Rambursare:',
    refundText:
      'Serviciile prestate nu sunt rambursabile. La erorile noastre: corectăm sau oferim credit.',
    handlingTitle: '5. Manipularea Produselor',
    clientRespTitle: 'Responsabilitățile Clientului:',
    clientRespBullets: [
      'Informații complete și corecte despre produse',
      'Respectarea regulilor Amazon FBA și a legii',
      'Produse nepericuloase/neinterzise',
      'Instrucțiuni clare de pregătire',
    ],
    ourRespTitle: 'Responsabilitățile Noastre:',
    ourRespBullets: [
      'Manipulare atentă și profesională',
      'Respectarea standardelor Amazon FBA',
      'Raportarea promptă a problemelor',
      'Securitate în depozitare',
    ],
    liabilityTitle: '6. Limitarea Răspunderii',
    liabilityBullets: [
      'Limitată la valoarea serviciilor',
      'Fără răspundere pentru pierderi indirecte',
      'Asigurarea produselor aparține clientului',
      'Nu garantăm acceptarea produselor de către Amazon; dacă problema nu este de ambalare, nu este responsabilitatea noastră să verificăm conformitatea produselor',
    ],
    prohibitedTitle: '7. Produse Interzise',
    dangerous: 'Produse Periculoase:',
    dangerousBullets: [
      'Substanțe periculoase',
      'Materiale inflamabile',
      'Baterii litiu defecte',
      'Produse radioactive',
    ],
    illegal: 'Produse Ilegale:',
    illegalBullets: [
      'Produse contrafăcute',
      'Substanțe interzise',
      'Arme și muniție',
      'Produse pentru adulți',
    ],
    privacyTitle: '8. Protecția Datelor',
    privacyText: 'Respectăm strict GDPR. Vezi ',
    privacyLink: 'Politica de Confidențialitate',
    terminationTitle: '9. Încetarea Serviciilor',
    terminationText:
      'Oricare parte poate înceta cu preaviz de 30 zile. Pentru încălcări grave: suspendare/închidere imediată.',
    terminationBulletsTitle: 'La încetare:',
    terminationBullets: [
      'Returnarea produselor (pe cheltuiala clientului)',
      'Facturile restante rămân datorate',
      'Datele sunt arhivate conform politicii de confidențialitate',
    ],
    lawTitle: '10. Legea Aplicabilă',
    lawText:
      'Legea franceză și/sau română. Litigiile la instanțele competente.',
    contactTitle: '11. Contact',
    contactText: 'Întrebări despre acești Termeni:',
    contact: {
      emailLabel: 'Email',
      phoneLabel: 'Telefon',
      addressLabel: 'Adresă',
      email: 'contact@pipesan.eu',
      phone: '+33 675 11 62 18',
      address:
        'Sat Leamna de jos, Comuna Bucovat, nr.159 A, Județ Dolj, România',
    },
    changesTitle: '12. Modificări',
    changesText:
      'Putem actualiza Termenii cu 30 de zile înainte; folosirea continuă înseamnă acceptare.',
  },
};

function SectionTitle({ children }) {
  return <h2 className="text-2xl font-bold text-text-primary mb-4">{children}</h2>;
}

function TermsOfService() {
  const { currentLanguage } = useLanguage();
  const lang = currentLanguage || 'fr';
  const t = T[lang] || T.fr;


  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Scale className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-text-primary mb-4">{t.title}</h1>
          <p className="text-xl text-text-secondary">
           {t.updated}: {new Date().toLocaleDateString(
              { fr:'fr-FR', en:'en-US', it:'it-IT', de:'de-DE', es:'es-ES', ro:'ro-RO' }[lang] || 'fr-FR'
            )}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-8">
          {/* 1. Intro */}
          <section>
            <SectionTitle>{t.introTitle}</SectionTitle>
            <p className="text-text-secondary leading-relaxed">{t.intro}</p>
          </section>

          {/* 2. Services */}
          <section>
            <div className="flex items-center mb-4">
              <FileText className="w-6 h-6 text-primary mr-3" />
              <h2 className="text-2xl font-bold text-text-primary">{t.servicesTitle}</h2>
            </div>
            <ul className="list-disc list-inside text-text-secondary space-y-2">
              {t.servicesBullets.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </section>

          {/* 3. Account */}
          <section>
            <SectionTitle>{t.accountTitle}</SectionTitle>
            <ul className="list-disc list-inside text-text-secondary space-y-1">
              {t.accountBullets.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
          </section>

          {/* 4. Pricing */}
          <section>
            <SectionTitle>{t.pricingTitle}</SectionTitle>
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-yellow-800 mb-2">{t.pricingWarnTitle}</h3>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      {t.pricingWarnBullets.map((x, i) => <li key={i}>• {x}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{t.refundTitle}</h3>
                <p className="text-text-secondary">{t.refundText}</p>
              </div>
            </div>
          </section>

          {/* 5. Handling */}
          <section>
            <SectionTitle>{t.handlingTitle}</SectionTitle>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{t.clientRespTitle}</h3>
                <ul className="list-disc list-inside text-text-secondary space-y-1">
                  {t.clientRespBullets.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{t.ourRespTitle}</h3>
                <ul className="list-disc list-inside text-text-secondary space-y-1">
                  {t.ourRespBullets.map((x, i) => <li key={i}>{x}</li>)}
                </ul>
              </div>
            </div>
          </section>

          {/* 6. Liability */}
          <section>
            <div className="flex items-center mb-4">
              <Shield className="w-6 h-6 text-primary mr-3" />
              <h2 className="text-2xl font-bold text-text-primary">{t.liabilityTitle}</h2>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">Info</h3>
              <ul className="text-sm text-red-700 space-y-1">
                {t.liabilityBullets.map((x, i) => <li key={i}>• {x}</li>)}
              </ul>
            </div>
          </section>

          {/* 7. Prohibited */}
          <section>
            <SectionTitle>{t.prohibitedTitle}</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-text-primary mb-2">{t.dangerous}</h3>
                <ul className="text-sm text-text-secondary space-y-1">
                  {t.dangerousBullets.map((x, i) => <li key={i}>• {x}</li>)}
                </ul>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-text-primary mb-2">{t.illegal}</h3>
                <ul className="text-sm text-text-secondary space-y-1">
                  {t.illegalBullets.map((x, i) => <li key={i}>• {x}</li>)}
                </ul>
              </div>
            </div>
          </section>

          {/* 8. Privacy */}
          <section>
            <SectionTitle>{t.privacyTitle}</SectionTitle>
            <p className="text-text-secondary">
              {t.privacyText}
              <a href="/privacy-policy" className="text-primary hover:text-primary-dark underline ml-1">
                {t.privacyLink}
              </a>.
            </p>
          </section>

          {/* 9. Termination */}
          <section>
            <SectionTitle>{t.terminationTitle}</SectionTitle>
            <p className="text-text-secondary mb-3">{t.terminationText}</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 mb-2">{t.terminationBulletsTitle}</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                {t.terminationBullets.map((x, i) => <li key={i}>• {x}</li>)}
              </ul>
            </div>
          </section>

          {/* 10. Law */}
          <section>
            <SectionTitle>{t.lawTitle}</SectionTitle>
            <p className="text-text-secondary">{t.lawText}</p>
          </section>

          {/* 11. Contact */}
          <section>
            <SectionTitle>{t.contactTitle}</SectionTitle>
            <div className="bg-primary-light bg-opacity-10 p-6 rounded-lg">
              <p className="text-text-secondary mb-4">{t.contactText}</p>
              <div className="space-y-2 text-text-secondary">
                <p><strong>{t.contact.emailLabel}:</strong> {t.contact.email}</p>
                <p><strong>{t.contact.phoneLabel}:</strong> {t.contact.phone}</p>
                <p><strong>{t.contact.addressLabel}:</strong> {t.contact.address}</p>
              </div>
            </div>
          </section>

          {/* 12. Changes */}
          <section>
            <SectionTitle>{t.changesTitle}</SectionTitle>
            <p className="text-text-secondary">{t.changesText}</p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default TermsOfService;
