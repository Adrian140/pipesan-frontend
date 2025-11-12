// FILE: src/pages/Support.jsx
import React, { useMemo, useState } from 'react';
import { HelpCircle, Phone, Mail, MessageCircle, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// ---------- TRADUCERI ÎNTR-UN SINGUR FIȘIER ----------
const T = {
  fr: {
    // Header
    title: 'Support Technique',
    subtitle:
      'Aide experte pour la sélection des produits, les spécifications techniques et les conseils d’installation. Notre équipe technique accompagne vos projets professionnels.',

    // Contact options
    getSupport: 'Obtenir de l’aide technique',
    phoneSupport: 'Assistance Téléphonique',
    phoneSupportDesc: 'Ligne directe vers notre équipe technique',
    frOffice: 'Bureau France',
    roOffice: 'Bureau Roumanie',
    phoneHours: 'Lun–Ven : 8:00–18:00 CET',

    emailSupport: 'Assistance Email',
    emailSupportDesc: 'Demandes techniques détaillées',
    emailSLA: 'Réponse sous 4 heures',

    liveChat: 'Chat en Direct',
    liveChatDesc: 'Aide instantanée pour la sélection des produits',
    startWhatsApp: 'Démarrer le chat WhatsApp',
    chatHours: 'Disponible 9:00–17:00 CET',

    // FAQ
    faqTitle: 'Questions Fréquemment Posées',
    searchPlaceholder: 'Rechercher dans la FAQ...',
    categories: [
      { id: 'all', name: 'Tous les sujets' },
      { id: 'installation', name: 'Installation' },
      { id: 'specifications', name: 'Spécifications techniques' },
      { id: 'ordering', name: 'Commandes & Livraison' },
      { id: 'returns', name: 'Retours & RMA' },
      { id: 'account', name: 'Gestion du compte' },
    ],
    faq: [
      {
        category: 'specifications',
        question: 'Que signifie DN pour le dimensionnement des tuyaux ?',
        answer:
          'DN (Diamètre Nominal) est la norme européenne. DN15 = 1/2", DN20 = 3/4", DN25 = 1", DN32 = 1 1/4", etc. Cela représente le diamètre interne approximatif en millimètres.',
      },
      {
        category: 'specifications',
        question: 'Quelle est la différence entre les filetages BSP et NPT ?',
        answer:
          'Le BSP a un angle de filetage de 55° et peut être parallèle ou conique. Le NPT a 60° et est toujours conique. BSP est courant en Europe, NPT en Amérique du Nord.',
      },
      {
        category: 'installation',
        question: 'Quelle pression convient aux installations domestiques ?',
        answer:
          'Pour l’eau domestique, PN10 (10 bar) suffit généralement. Pour des applications commerciales/haute pression, envisagez PN16 (16 bar) ou plus. Vérifiez toujours les normes locales.',
      },
      {
        category: 'installation',
        question: 'Puis-je mélanger laiton et inox ?',
        answer:
          'Oui, mais utilisez des raccords diélectriques pour éviter la corrosion galvanique. Le contact direct entre métaux différents peut corroder avec le temps.',
      },
      {
        category: 'ordering',
        question: 'Proposez-vous une expédition le jour même ?',
        answer:
          'Oui, les commandes passées avant 14:00 CET sont expédiées le jour même via UPS Express. Les commandes standard sont traitées sous 24 h.',
      },
      {
        category: 'ordering',
        question: 'Avez-vous des quantités minimales de commande ?',
        answer:
          'Aucune pour le retail. Remises B2B dès 50 pièces. Devis personnalisés pour les grands projets.',
      },
      {
        category: 'returns',
        question: 'Quelle est votre politique de retour ?',
        answer:
          'Retour sous 30 jours pour produits non utilisés dans l’emballage d’origine. Les produits personnalisés ne sont pas repris. Un numéro RMA est requis.',
      },
      {
        category: 'account',
        question: 'Comment créer un compte B2B ?',
        answer:
          'Inscrivez-vous et choisissez « Business Account ». Indiquez les infos société et le numéro de TVA. Activation des tarifs B2B sous 24 h.',
      },
    ],

    noResults: 'Aucun résultat',
    noResultsHint: 'Essayez d’ajuster les termes de recherche ou le filtre de catégorie.',

    // CTA
    stillNeedHelp: 'Vous avez encore besoin d’aide ?',
    stillNeedHelpDesc:
      'Nos experts techniques sont prêts à vous aider selon vos besoins et exigences de projet.',
    contactTeam: 'Contacter l’Équipe Technique',
    scheduleConsult: 'Planifier une Consultation',
  },

  en: {
    title: 'Technical Support',
    subtitle:
      'Expert help with product selection, technical specifications and installation guidance. Our technical team is here to support your professional projects.',

    getSupport: 'Get Technical Support',
    phoneSupport: 'Phone Support',
    phoneSupportDesc: 'Direct line to our technical team',
    frOffice: 'France Office',
    roOffice: 'Romania Office',
    phoneHours: 'Mon–Fri: 8:00–18:00 CET',

    emailSupport: 'Email Support',
    emailSupportDesc: 'Detailed technical inquiries',
    emailSLA: 'Response within 4 hours',

    liveChat: 'Live Chat',
    liveChatDesc: 'Instant help with product selection',
    startWhatsApp: 'Start WhatsApp Chat',
    chatHours: 'Available 9:00–17:00 CET',

    faqTitle: 'Frequently Asked Questions',
    searchPlaceholder: 'Search FAQ...',
    categories: [
      { id: 'all', name: 'All Topics' },
      { id: 'installation', name: 'Installation' },
      { id: 'specifications', name: 'Technical Specs' },
      { id: 'ordering', name: 'Ordering & Delivery' },
      { id: 'returns', name: 'Returns & RMA' },
      { id: 'account', name: 'Account Management' },
    ],
    // EN can use defaultFaq below; keep t.faq undefined for fallback

    noResults: 'No results found',
    noResultsHint: 'Try adjusting your search terms or category filter.',

    stillNeedHelp: 'Still Need Help?',
    stillNeedHelpDesc:
      'Our technical experts are ready to assist with your specific requirements and project needs.',
    contactTeam: 'Contact Technical Team',
    scheduleConsult: 'Schedule Consultation',
  },

  it: {
    title: 'Supporto Tecnico',
    subtitle:
      'Assistenza esperta per selezione prodotti, specifiche tecniche e guida all’installazione. Il nostro team tecnico supporta i tuoi progetti professionali.',

    getSupport: 'Ottieni Supporto Tecnico',
    phoneSupport: 'Supporto Telefonico',
    phoneSupportDesc: 'Linea diretta con il nostro team tecnico',
    frOffice: 'Ufficio Francia',
    roOffice: 'Ufficio Romania',
    phoneHours: 'Lun–Ven: 8:00–18:00 CET',

    emailSupport: 'Supporto Email',
    emailSupportDesc: 'Richieste tecniche dettagliate',
    emailSLA: 'Risposta entro 4 ore',

    liveChat: 'Chat Live',
    liveChatDesc: 'Aiuto immediato per la selezione dei prodotti',
    startWhatsApp: 'Avvia Chat WhatsApp',
    chatHours: 'Disponibile 9:00–17:00 CET',

    faqTitle: 'Domande Frequenti',
    searchPlaceholder: 'Cerca nella FAQ...',
    categories: [
      { id: 'all', name: 'Tutti gli argomenti' },
      { id: 'installation', name: 'Installazione' },
      { id: 'specifications', name: 'Specifiche tecniche' },
      { id: 'ordering', name: 'Ordini & Consegna' },
      { id: 'returns', name: 'Resi & RMA' },
      { id: 'account', name: 'Gestione account' },
    ],
    faq: [
      {
        category: 'specifications',
        question: 'Cosa significa DN nel dimensionamento delle tubazioni?',
        answer:
          'DN (Diametro Nominale) è lo standard europeo. DN15 = 1/2", DN20 = 3/4", DN25 = 1", DN32 = 1 1/4", ecc. Rappresenta il diametro interno approssimativo in millimetri.',
      },
      {
        category: 'specifications',
        question: 'Differenza tra filettature BSP e NPT?',
        answer:
          'BSP ha un angolo del filetto di 55° e può essere parallela o conica. NPT ha 60° ed è sempre conica. BSP è comune in Europa, NPT in Nord America.',
      },
      {
        category: 'installation',
        question: 'Che pressione serve per impianti domestici?',
        answer:
          'Per acqua domestica, PN10 (10 bar) di solito è sufficiente. Per applicazioni commerciali/alta pressione valuta PN16 (16 bar) o superiore. Controlla sempre le norme locali.',
      },
      {
        category: 'installation',
        question: 'Posso miscelare ottone e acciaio inox?',
        answer:
          'Sì, ma usa giunti dielettrici per evitare corrosione galvanica. Il contatto diretto tra metalli diversi può causare corrosione nel tempo.',
      },
      {
        category: 'ordering',
        question: 'Offrite spedizione in giornata?',
        answer:
          'Sì, gli ordini effettuati prima delle 14:00 CET partono lo stesso giorno con UPS Express. Gli altri entro 24 ore.',
      },
      {
        category: 'ordering',
        question: 'Quantità minime d’ordine?',
        answer:
          'Nessun minimo per retail. Sconti B2B da 50 pezzi. Preventivi su misura per grandi progetti.',
      },
      {
        category: 'returns',
        question: 'Qual è la vostra politica resi?',
        answer:
          'Reso entro 30 giorni per prodotti non usati in confezione originale. I prodotti personalizzati non sono restituibili. Richiesto numero RMA.',
      },
      {
        category: 'account',
        question: 'Come creo un account B2B?',
        answer:
          'Registrati scegliendo “Business Account”. Inserisci dati azienda e P.IVA. Attivazione prezzi B2B entro 24 ore.',
      },
    ],

    noResults: 'Nessun risultato',
    noResultsHint: 'Prova a modificare i termini di ricerca o il filtro categoria.',

    stillNeedHelp: 'Hai ancora bisogno di aiuto?',
    stillNeedHelpDesc:
      'I nostri esperti tecnici sono pronti ad aiutarti con le tue esigenze e i requisiti di progetto.',
    contactTeam: 'Contatta il Team Tecnico',
    scheduleConsult: 'Pianifica una Consulenza',
  },

  de: {
    title: 'Technischer Support',
    subtitle:
      'Expertenhilfe bei Produktauswahl, technischen Spezifikationen und Installationshinweisen. Unser Technikteam unterstützt Ihre professionellen Projekte.',

    getSupport: 'Technischen Support erhalten',
    phoneSupport: 'Telefonischer Support',
    phoneSupportDesc: 'Direktleitung zu unserem Technikteam',
    frOffice: 'Büro Frankreich',
    roOffice: 'Büro Rumänien',
    phoneHours: 'Mo–Fr: 8:00–18:00 CET',

    emailSupport: 'E-Mail-Support',
    emailSupportDesc: 'Detaillierte technische Anfragen',
    emailSLA: 'Antwort innerhalb von 4 Stunden',

    liveChat: 'Live-Chat',
    liveChatDesc: 'Soforthilfe bei der Produktauswahl',
    startWhatsApp: 'WhatsApp-Chat starten',
    chatHours: 'Verfügbar 9:00–17:00 CET',

    faqTitle: 'Häufig gestellte Fragen',
    searchPlaceholder: 'In der FAQ suchen...',
    categories: [
      { id: 'all', name: 'Alle Themen' },
      { id: 'installation', name: 'Installation' },
      { id: 'specifications', name: 'Technische Daten' },
      { id: 'ordering', name: 'Bestellung & Lieferung' },
      { id: 'returns', name: 'Rücksendungen & RMA' },
      { id: 'account', name: 'Kontoverwaltung' },
    ],
    faq: [
      {
        category: 'specifications',
        question: 'Was bedeutet DN bei Rohrabmessungen?',
        answer:
          'DN (Diamètre Nominal) ist der europäische Standard. DN15 = 1/2", DN20 = 3/4", DN25 = 1", DN32 = 1 1/4" usw. Entspricht dem ungefähren Innendurchmesser in Millimetern.',
      },
      {
        category: 'specifications',
        question: 'Unterschied zwischen BSP- und NPT-Gewinden?',
        answer:
          'BSP hat einen Gewindewinkel von 55° und kann parallel oder konisch sein. NPT hat 60° und ist immer konisch. BSP ist in Europa üblich, NPT in Nordamerika.',
      },
      {
        category: 'installation',
        question: 'Welcher Druck für Hausinstallationen?',
        answer:
          'Für häusliche Wassersysteme reicht PN10 (10 bar) meist aus. Für gewerbliche/hochdruck Anwendungen PN16 (16 bar) oder höher. Prüfen Sie stets lokale Normen.',
      },
      {
        category: 'installation',
        question: 'Darf ich Messing und Edelstahl mischen?',
        answer:
          'Ja, aber verwenden Sie Dielektrik-Übergänge, um galvanische Korrosion zu verhindern. Direkter Kontakt unterschiedlicher Metalle kann Korrosion verursachen.',
      },
      {
        category: 'ordering',
        question: 'Bieten Sie Versand am selben Tag an?',
        answer:
          'Ja, Bestellungen vor 14:00 CET gehen noch am selben Tag mit UPS Express raus. Standardbestellungen innerhalb von 24 Stunden.',
      },
      {
        category: 'ordering',
        question: 'Mindestbestellmengen?',
        answer:
          'Für Retail keine. B2B-Mengenrabatte ab 50 Stück. Individuelle Angebote für Großprojekte.',
      },
      {
        category: 'returns',
        question: 'Wie ist Ihre Rückgaberegelung?',
        answer:
          '30 Tage Rückgabe für unbenutzte Ware in Originalverpackung. Kundenspezifische Produkte sind ausgeschlossen. RMA-Nummer erforderlich.',
      },
      {
        category: 'account',
        question: 'Wie richte ich ein B2B-Konto ein?',
        answer:
          'Online registrieren und „Business Account“ wählen. Firmendaten und USt-IdNr. angeben. Aktivierung der B2B-Preise innerhalb von 24 Stunden.',
      },
    ],

    noResults: 'Keine Ergebnisse gefunden',
    noResultsHint: 'Passen Sie Suchbegriffe oder Kategoriefilter an.',

    stillNeedHelp: 'Benötigen Sie noch Hilfe?',
    stillNeedHelpDesc:
      'Unsere Technikexperten unterstützen Sie gern bei spezifischen Anforderungen und Projekten.',
    contactTeam: 'Technikteam kontaktieren',
    scheduleConsult: 'Beratung vereinbaren',
  },

  es: {
    title: 'Soporte Técnico',
    subtitle:
      'Ayuda experta con la selección de productos, especificaciones técnicas y guía de instalación. Nuestro equipo técnico apoya tus proyectos profesionales.',

    getSupport: 'Obtener Soporte Técnico',
    phoneSupport: 'Soporte Telefónico',
    phoneSupportDesc: 'Línea directa con nuestro equipo técnico',
    frOffice: 'Oficina Francia',
    roOffice: 'Oficina Rumanía',
    phoneHours: 'Lun–Vie: 8:00–18:00 CET',

    emailSupport: 'Soporte por Email',
    emailSupportDesc: 'Consultas técnicas detalladas',
    emailSLA: 'Respuesta en 4 horas',

    liveChat: 'Chat en Vivo',
    liveChatDesc: 'Ayuda instantánea para la selección de productos',
    startWhatsApp: 'Iniciar Chat de WhatsApp',
    chatHours: 'Disponible 9:00–17:00 CET',

    faqTitle: 'Preguntas Frecuentes',
    searchPlaceholder: 'Buscar en la FAQ...',
    categories: [
      { id: 'all', name: 'Todos los temas' },
      { id: 'installation', name: 'Instalación' },
      { id: 'specifications', name: 'Especificaciones técnicas' },
      { id: 'ordering', name: 'Pedidos y Entrega' },
      { id: 'returns', name: 'Devoluciones y RMA' },
      { id: 'account', name: 'Gestión de cuenta' },
    ],
    faq: [
      {
        category: 'specifications',
        question: '¿Qué significa DN en el dimensionamiento de tuberías?',
        answer:
          'DN (Diámetro Nominal) es el estándar europeo. DN15 = 1/2", DN20 = 3/4", DN25 = 1", DN32 = 1 1/4", etc. Representa el diámetro interno aproximado en milímetros.',
      },
      {
        category: 'specifications',
        question: '¿Diferencias entre roscas BSP y NPT?',
        answer:
          'BSP tiene un ángulo de 55° y puede ser paralela o cónica. NPT tiene 60° y siempre es cónica. BSP es común en Europa, NPT en Norteamérica.',
      },
      {
        category: 'installation',
        question: '¿Qué presión necesito para instalaciones domésticas?',
        answer:
          'Para agua doméstica, PN10 (10 bar) suele ser suficiente. Para aplicaciones comerciales/alta presión, considera PN16 (16 bar) o superior. Revisa siempre la normativa local.',
      },
      {
        category: 'installation',
        question: '¿Puedo mezclar latón y acero inoxidable?',
        answer:
          'Sí, pero usa uniones dieléctricas para evitar corrosión galvánica. El contacto directo entre metales distintos puede corroer con el tiempo.',
      },
      {
        category: 'ordering',
        question: '¿Ofrecéis envío en el mismo día?',
        answer:
          'Sí, pedidos antes de las 14:00 CET salen el mismo día con UPS Express. Los estándar en 24 h.',
      },
      {
        category: 'ordering',
        question: '¿Cantidad mínima de pedido?',
        answer:
          'No hay mínimo para retail. Descuentos B2B desde 50 piezas. Presupuestos a medida para grandes proyectos.',
      },
      {
        category: 'returns',
        question: '¿Cuál es vuestra política de devoluciones?',
        answer:
          '30 días para productos sin usar en su embalaje original. Los personalizados no se pueden devolver. Se requiere número RMA.',
      },
      {
        category: 'account',
        question: '¿Cómo creo una cuenta B2B?',
        answer:
          'Regístrate y elige “Business Account”. Proporciona datos de empresa y NIF-IVA. Activamos precios B2B en 24 horas.',
      },
    ],

    noResults: 'No se encontraron resultados',
    noResultsHint: 'Prueba ajustando la búsqueda o el filtro de categoría.',

    stillNeedHelp: '¿Aún necesitas ayuda?',
    stillNeedHelpDesc:
      'Nuestros expertos técnicos están listos para ayudarte con tus necesidades y proyectos.',
    contactTeam: 'Contactar al Equipo Técnico',
    scheduleConsult: 'Programar Consulta',
  },

  ro: {
    title: 'Suport Tehnic',
    subtitle:
      'Ajutor de specialitate pentru selecția produselor, specificații tehnice și ghid de instalare. Echipa noastră tehnică îți susține proiectele profesionale.',

    getSupport: 'Obține Suport Tehnic',
    phoneSupport: 'Asistență Telefonică',
    phoneSupportDesc: 'Linie directă către echipa noastră tehnică',
    frOffice: 'Birou Franța',
    roOffice: 'Birou România',
    phoneHours: 'Lun–Vin: 8:00–18:00 CET',

    emailSupport: 'Asistență pe Email',
    emailSupportDesc: 'Solicitări tehnice detaliate',
    emailSLA: 'Răspuns în 4 ore',

    liveChat: 'Chat Live',
    liveChatDesc: 'Ajutor instant pentru selecția produselor',
    startWhatsApp: 'Pornește Chat WhatsApp',
    chatHours: 'Disponibil 9:00–17:00 CET',

    faqTitle: 'Întrebări Frecvente',
    searchPlaceholder: 'Caută în FAQ...',
    categories: [
      { id: 'all', name: 'Toate subiectele' },
      { id: 'installation', name: 'Instalare' },
      { id: 'specifications', name: 'Specificații tehnice' },
      { id: 'ordering', name: 'Comenzi & Livrare' },
      { id: 'returns', name: 'Returnări & RMA' },
      { id: 'account', name: 'Administrare cont' },
    ],
    faq: [
      {
        category: 'specifications',
        question: 'Ce înseamnă DN la dimensionarea țevilor?',
        answer:
          'DN (Diametru Nominal) este standardul european. DN15 = 1/2", DN20 = 3/4", DN25 = 1", DN32 = 1 1/4" etc. Reprezintă diametrul intern aproximativ în milimetri.',
      },
      {
        category: 'specifications',
        question: 'Care este diferența dintre filetele BSP și NPT?',
        answer:
          'BSP are un unghi al filetului de 55° și poate fi paralel sau conic. NPT are 60° și este mereu conic. BSP e mai comun în Europa, NPT în America de Nord.',
      },
      {
        category: 'installation',
        question: 'Ce clasă de presiune îmi trebuie pentru instalațiile domestice?',
        answer:
          'Pentru apă menajeră, PN10 (10 bar) e de obicei suficient. Pentru aplicații comerciale/înaltă presiune ia în calcul PN16 (16 bar) sau mai mare. Verifică normele locale.',
      },
      {
        category: 'installation',
        question: 'Pot combina fitinguri din alamă cu inox?',
        answer:
          'Da, dar folosește cuple dielectrice pentru a preveni coroziunea galvanică. Contactul direct între metale diferite poate produce coroziune în timp.',
      },
      {
        category: 'ordering',
        question: 'Expediați în aceeași zi?',
        answer:
          'Da, comenzile plasate până la 14:00 CET pleacă în aceeași zi cu UPS Express. Standard în 24 de ore.',
      },
      {
        category: 'ordering',
        question: 'Aveți cantități minime de comandă?',
        answer:
          'Nu pentru retail. Pentru B2B oferim discounturi de volum de la 50 bucăți. Oferte personalizate pentru proiecte mari.',
      },
      {
        category: 'returns',
        question: 'Care este politica de retur?',
        answer:
          '30 de zile pentru produse nefolosite în ambalajul original. Produsele personalizate nu se pot returna. Este necesar număr RMA.',
      },
      {
        category: 'account',
        question: 'Cum îmi fac cont B2B?',
        answer:
          'Înregistrează-te și alege „Business Account”. Introdu detaliile firmei și codul de TVA. Activăm prețurile B2B în 24 de ore.',
      },
    ],

    noResults: 'Niciun rezultat găsit',
    noResultsHint: 'Încearcă să ajustezi termenii de căutare sau filtrul de categorie.',

    stillNeedHelp: 'Încă ai nevoie de ajutor?',
    stillNeedHelpDesc:
      'Experții noștri tehnici sunt gata să te ajute cu cerințele și proiectele tale.',
    contactTeam: 'Contactează Echipa Tehnică',
    scheduleConsult: 'Programează o Consultație',
  },
};

// ---------- fallback FAQ în EN (poți copia în T[lang].faq când vrei localizat) ----------
const defaultFaq = [
  {
    category: 'specifications',
    question: 'What does DN mean in pipe sizing?',
    answer:
      'DN (Diamètre Nominal) is the European standard for pipe sizing. DN15 = 1/2", DN20 = 3/4", DN25 = 1", DN32 = 1 1/4", etc. It represents the approximate internal diameter in millimeters.',
  },
  {
    category: 'specifications',
    question: 'What is the difference between BSP and NPT threads?',
    answer:
      'BSP (British Standard Pipe) has a 55° thread angle and can be parallel or tapered. NPT (National Pipe Thread) has a 60° thread angle and is always tapered. BSP is more common in Europe, NPT in North America.',
  },
  {
    category: 'installation',
    question: 'What pressure rating do I need for domestic installations?',
    answer:
      'For domestic water systems, PN10 (10 bar) is typically sufficient. For commercial or high-pressure applications, consider PN16 (16 bar) or higher. Always check local building codes.',
  },
  {
    category: 'installation',
    question: 'Can I mix brass and stainless steel fittings?',
    answer:
      'Yes, but use dielectric unions to prevent galvanic corrosion. Direct contact between dissimilar metals in water systems can cause corrosion over time.',
  },
  {
    category: 'ordering',
    question: 'Do you offer same-day shipping?',
    answer:
      'Yes, orders placed before 2 PM CET are shipped the same day via UPS Express. Standard orders are processed within 24 hours.',
  },
  {
    category: 'ordering',
    question: 'What are your minimum order quantities?',
    answer:
      'No minimum order for retail customers. B2B customers have volume discounts starting from 50 pieces. Custom quotes available for large projects.',
  },
  {
    category: 'returns',
    question: 'What is your return policy?',
    answer:
      '30-day return policy for unused products in original packaging. Custom or modified products cannot be returned. RMA number required for all returns.',
  },
  {
    category: 'account',
    question: 'How do I set up a B2B account?',
    answer:
      'Register online and select "Business Account". Provide company details and VAT number. Our team will verify and activate B2B pricing within 24 hours.',
  },
];

// ---------- Componentă ----------
function Support() {
  const { currentLanguage } = useLanguage();
  const lang = (currentLanguage || 'fr').toLowerCase();
  const t = T[lang] || T.fr;

  // Permite suprascriere FAQ per limbă cu T[lang].faq; altfel fallback EN
  const faqItems = Array.isArray(t.faq) && t.faq.length ? t.faq : defaultFaq;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredFAQ = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return faqItems.filter((item) => {
      const catOk = selectedCategory === 'all' || item.category === selectedCategory;
      const text = `${item.question} ${item.answer}`.toLowerCase();
      const searchOk = !q || text.includes(q);
      return catOk && searchOk;
    });
  }, [faqItems, searchTerm, selectedCategory]);

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
            {t.title}
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">{t.subtitle}</p>
        </div>

        {/* Contact Options */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-text-primary mb-12 text-center">
            {t.getSupport}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Phone */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-lg transition-shadow">
              <Phone className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                {t.phoneSupport}
              </h3>
              <p className="text-text-secondary mb-4">{t.phoneSupportDesc}</p>
              <div className="space-y-2 mb-4">
                <div>
                  <p className="font-semibold text-primary">+33 675 11 62 18</p>
                  <p className="text-sm text-text-light">{t.frOffice}</p>
                </div>
                <div>
                  <p className="font-semibold text-primary">+40 722 14 04 44</p>
                  <p className="text-sm text-text-light">{t.roOffice}</p>
                </div>
              </div>
              <p className="text-sm text-text-light">{t.phoneHours}</p>
            </div>

            {/* Email */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-lg transition-shadow">
              <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                {t.emailSupport}
              </h3>
              <p className="text-text-secondary mb-4">{t.emailSupportDesc}</p>
              <p className="font-semibold text-primary mb-4">contact@pipesan.eu</p>
              <p className="text-sm text-text-light">{t.emailSLA}</p>
            </div>

            {/* Live Chat */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center hover:shadow-lg transition-shadow">
              <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-text-primary mb-2">
                {t.liveChat}
              </h3>
              <p className="text-text-secondary mb-4">{t.liveChatDesc}</p>
              <a
                href="https://wa.me/33675111618"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                {t.startWhatsApp}
              </a>
              <p className="text-sm text-text-light mt-2">{t.chatHours}</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-text-primary mb-12 text-center">
            {t.faqTitle}
          </h2>

          {/* Search + Filter */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                {(t.categories || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFAQ.map((item, i) => (
              <div
                key={`${item.category}-${i}`}
                className="bg-white rounded-xl border border-gray-200 p-6"
              >
                <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center">
                  <HelpCircle className="w-5 h-5 text-primary mr-2" />
                  {item.question}
                </h3>
                <p className="text-text-secondary leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>

          {filteredFAQ.length === 0 && (
            <div className="text-center py-12">
              <HelpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-text-secondary mb-2">
                {t.noResults}
              </h3>
              <p className="text-text-light">{t.noResultsHint}</p>
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="text-center">
          <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-12">
            <h2 className="text-3xl font-bold text-text-primary mb-6">
              {t.stillNeedHelp}
            </h2>
            <p className="text-xl text-text-secondary mb-8">{t.stillNeedHelpDesc}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:contact@pipesan.eu?subject=Contact%20Technical%20Team"
                className="bg-primary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-primary-dark transition-colors"
              >
                {t.contactTeam}
              </a>
              <a
                href="https://wa.me/33675111618"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-accent text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-accent-dark transition-colors"
              >
                {t.scheduleConsult}
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Support;
