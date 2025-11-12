import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export const translations = {
  fr: {
    flag: '🇫🇷',
    
    // Navigation (existing)
    home: 'Accueil',
    categories: 'Catégories',
    technical: 'Spécifications Techniques',
    contact: 'Contact',
    support: 'Support',
    supportTechnique: 'Support Technique',
    login: 'Connexion',
    register: 'Inscription',
    dashboard: 'Tableau de Bord',
    logout: 'Déconnexion',
    admin: 'Admin',
    products: 'Produits',
    services: 'Services',
    about: 'À Propos',
    blog: 'Blog',
    
    // HOME PAGE - COMPLETE TRANSLATIONS
    
    // Hero Section
    heroTitle: 'PipeSan - Pièces de Plomberie Professionnelles',
    heroSubtitle: 'Robinets, raccords, connecteurs et composants d\'installation professionnels. Livraison rapide EU avec spécifications techniques complètes et certifications CE.',
    browseProducts: 'Parcourir les Produits',
    requestCatalog: 'Demander le Catalogue',
    
    // Why Choose Us Section
    whyChooseUsTitle: 'Pourquoi Choisir PipeSan pour vos Pièces de Plomberie Professionnelles',
    whyChooseUsSubtitle: 'Composants de plomberie professionnels et pièces d\'installation conçus pour les professionnels européens',
    
    qualityGuaranteeTitle: 'Garantie de Qualité Professionnelle',
    qualityGuaranteeDesc: 'Produits certifiés CE avec spécifications techniques et assurance qualité pour installations professionnelles',
    
    fastDeliveryTitle: 'Livraison Européenne Rapide',
    fastDeliveryDesc: 'Emplacements d\'entrepôts stratégiques à travers l\'Europe pour livraison rapide des pièces et composants de plomberie',
    
    technicalSupportTitle: 'Support Technique et Expertise',
    technicalSupportDesc: 'Équipe de support technique professionnel avec expertise en installations de plomberie et spécifications de composants',
    
    certifiedProductsTitle: 'Produits Certifiés',
    certifiedProductsDesc: 'Tous nos produits respectent les normes européennes et sont fournis avec les certificats et documentations techniques',
    
    // Contact Page Translations
    contactTitle: 'Contactez-nous',
    contactSubtitle: 'Besoin d\'aide pour vos projets d\'installation ? Notre équipe technique est là pour vous conseiller.',
    sendMessage: 'Envoyer le Message',
    name: 'Nom',
    email: 'Email',
    company: 'Entreprise',
    message: 'Message',
    phone: 'Téléphone',
    chatWhatsApp: 'Chat WhatsApp',
    contactInfo: 'Informations de Contact',
    businessHours: 'Heures d\'Ouverture',
    
    // Common elements
    home: 'Accueil',
    products: 'Produits',
    contact: 'Contact',
    support: 'Support'
  },
  
  en: {
    flag: '��🇧',
    
    // Navigation (existing)
    home: 'Home',
    categories: 'Categories',
    technical: 'Technical Specs',
    contact: 'Contact',
    support: 'Support',
    supportTechnique: 'Technical Support',
    login: 'Login',
    register: 'Register',
    dashboard: 'Dashboard',
    logout: 'Logout',
    admin: 'Admin',
    products: 'Products',
    services: 'Services',
    about: 'About',
    blog: 'Blog',
    
    // HOME PAGE - COMPLETE TRANSLATIONS
    
    // Hero Section
    heroTitle: 'PipeSan - Professional Plumbing Parts',
    heroSubtitle: 'Valves, fittings, connectors and professional installation components. Fast EU delivery with complete technical specifications and CE certifications.',
    browseProducts: 'Browse Products',
    requestCatalog: 'Request Catalog',
    
    // Why Choose Us Section
    whyChooseUsTitle: 'Why Choose PipeSan for Professional Plumbing Parts',
    whyChooseUsSubtitle: 'Professional plumbing components and installation parts designed for European professionals',
    
    qualityGuaranteeTitle: 'Professional Quality Guarantee',
    qualityGuaranteeDesc: 'CE certified products with technical specifications and quality assurance for professional installations',
    
    fastDeliveryTitle: 'Fast European Delivery',
    fastDeliveryDesc: 'Strategic warehouse locations across Europe for rapid delivery of plumbing parts and components',
    
    technicalSupportTitle: 'Technical Support & Expertise',
    technicalSupportDesc: 'Professional technical support team with expertise in plumbing installations and component specifications',
    
    certifiedProductsTitle: 'Certified Products',
    certifiedProductsDesc: 'All our products meet European standards and come with certificates and technical documentation',
    
    // Contact Page Translations
    contactTitle: 'Get In Touch',
    contactSubtitle: 'Need help with your installation projects? Our technical team is here to advise you.',
    sendMessage: 'Send Message',
    name: 'Name',
    email: 'Email',
    company: 'Company',
    message: 'Message',
    phone: 'Phone',
    chatWhatsApp: 'Chat WhatsApp',
    contactInfo: 'Contact Information',
    businessHours: 'Business Hours',
    
    // Common elements
    home: 'Home',
    products: 'Products',
    contact: 'Contact',
    support: 'Support'
  },
  
  it: {
    flag: '��🇹',
    
    // Navigation
    home: 'Home',
    categories: 'Categorie',
    technical: 'Specifiche Tecniche',
    contact: 'Contatto',
    support: 'Supporto',
    supportTechnique: 'Supporto Tecnico',
    login: 'Accedi',
    register: 'Registrati',
    dashboard: 'Dashboard',
    logout: 'Esci',
    admin: 'Admin',
    products: 'Prodotti',
    services: 'Servizi',
    about: 'Chi Siamo',
    blog: 'Blog',
    
    // HOME PAGE TRANSLATIONS
    heroTitle: 'PipeSan - Componenti Idraulici Professionali',
    heroSubtitle: 'Valvole, raccordi, connettori e componenti per installazioni professionali. Consegna rapida EU con specifiche tecniche complete e certificazioni CE.',
    browseProducts: 'Sfoglia Prodotti',
    requestCatalog: 'Richiedi Catalogo',
    
    qualityGuaranteeTitle: 'Garanzia di Qualità Professionale',
    qualityGuaranteeDesc: 'Prodotti certificati CE con specifiche tecniche e garanzia di qualità per installazioni professionali',
    
    // Contact Page Translations
    contactTitle: 'Contattaci',
    contactSubtitle: 'Hai bisogno di aiuto con i tuoi progetti di installazione? Il nostro team tecnico è qui per consigliarti.',
    sendMessage: 'Invia Messaggio',
    name: 'Nome',
    email: 'Email',
    company: 'Azienda',
    message: 'Messaggio',
    phone: 'Telefono',
    chatWhatsApp: 'Chat WhatsApp',
    contactInfo: 'Informazioni di Contatto',
    businessHours: 'Orari di Lavoro',
    
    // Common elements
    home: 'Home',
    products: 'Prodotti',
    contact: 'Contatto',
    support: 'Supporto'
  },
  
  de: {
    flag: '🇩🇪',
    
    // Navigation
    home: 'Startseite',
    categories: 'Kategorien',
    technical: 'Technische Spezifikationen',
    contact: 'Kontakt',
    support: 'Support',
    supportTechnique: 'Technischer Support',
    login: 'Anmelden',
    register: 'Registrieren',
    dashboard: 'Dashboard',
    logout: 'Abmelden',
    admin: 'Admin',
    products: 'Produkte',
    services: 'Dienstleistungen',
    about: 'Über Uns',
    blog: 'Blog',
    
    // HOME PAGE TRANSLATIONS
    heroTitle: 'PipeSan - Professionelle Sanitärteile',
    heroSubtitle: 'Ventile, Fittings, Verbinder und professionelle Installationskomponenten. Schnelle EU-Lieferung mit vollständigen technischen Spezifikationen und CE-Zertifizierungen.',
    browseProducts: 'Produkte Durchsuchen',
    requestCatalog: 'Katalog Anfordern',
    
    qualityGuaranteeTitle: 'Professionelle Qualitätsgarantie',
    qualityGuaranteeDesc: 'CE-zertifizierte Produkte mit technischen Spezifikationen und Qualitätssicherung für professionelle Installationen',
    
    // Contact Page Translations
    contactTitle: 'Kontakt Aufnehmen',
    contactSubtitle: 'Benötigen Sie Hilfe bei Ihren Installationsprojekten? Unser technisches Team berät Sie gerne.',
    sendMessage: 'Nachricht Senden',
    name: 'Name',
    email: 'E-Mail',
    company: 'Unternehmen',
    message: 'Nachricht',
    phone: 'Telefon',
    chatWhatsApp: 'WhatsApp Chat',
    contactInfo: 'Kontaktinformationen',
    businessHours: 'Geschäftszeiten',
    
    // Common elements
    home: 'Startseite',
    products: 'Produkte',
    contact: 'Kontakt',
    support: 'Support'
  },
  
  es: {
    flag: '��🇸',
    
    // Navigation
    home: 'Inicio',
    categories: 'Categorías',
    technical: 'Especificaciones Técnicas',
    contact: 'Contacto',
    support: 'Soporte',
    supportTechnique: 'Soporte Técnico',
    login: 'Iniciar Sesión',
    register: 'Registrarse',
    dashboard: 'Panel',
    logout: 'Cerrar Sesión',
    admin: 'Admin',
    products: 'Productos',
    services: 'Servicios',
    about: 'Acerca de',
    blog: 'Blog',
    
    // HOME PAGE TRANSLATIONS
    heroTitle: 'PipeSan - Componentes de Fontanería Profesional',
    heroSubtitle: 'Válvulas, accesorios, conectores y componentes para instalaciones profesionales. Entrega rápida EU con especificaciones técnicas completas y certificaciones CE.',
    browseProducts: 'Explorar Productos',
    requestCatalog: 'Solicitar Catálogo',
    
    qualityGuaranteeTitle: 'Garantía de Calidad Profesional',
    qualityGuaranteeDesc: 'Productos certificados CE con especificaciones técnicas y garantía de calidad para instalaciones profesionales',
    
    // Contact Page Translations
    contactTitle: 'Ponerse en Contacto',
    contactSubtitle: '¿Necesita ayuda con sus proyectos de instalación? Nuestro equipo técnico está aquí para asesorarle.',
    sendMessage: 'Enviar Mensaje',
    name: 'Nombre',
    email: 'Correo Electrónico',
    company: 'Empresa',
    message: 'Mensaje',
    phone: 'Teléfono',
    chatWhatsApp: 'Chat WhatsApp',
    contactInfo: 'Información de Contacto',
    businessHours: 'Horario Comercial',
    
    // Common elements
    home: 'Inicio',
    products: 'Productos',
    contact: 'Contacto',
    support: 'Soporte'
  },
  
  ro: {
    flag: '��🇴',
    
    // Navigation
    home: 'Acasă',
    categories: 'Categorii',
    technical: 'Specificații Tehnice',
    contact: 'Contact',
    support: 'Suport',
    supportTechnique: 'Suport Tehnic',
    login: 'Autentificare',
    register: 'Înregistrare',
    dashboard: 'Panou',
    logout: 'Deconectare',
    admin: 'Admin',
    products: 'Produse',
    services: 'Servicii',
    about: 'Despre Noi',
    blog: 'Blog',
    
    // HOME PAGE TRANSLATIONS
    heroTitle: 'PipeSan - Componente de Instalații Profesionale',
    heroSubtitle: 'Robinete, racorduri, conectori și componente pentru instalații profesionale. Livrare rapidă în UE cu specificații tehnice complete și certificări CE.',
    browseProducts: 'Răsfoiește Produsele',
    requestCatalog: 'Solicită Catalogul',
    
    qualityGuaranteeTitle: 'Garanție de Calitate Profesională',
    qualityGuaranteeDesc: 'Produse certificate CE cu specificații tehnice și asigurarea calității pentru instalații profesionale',
    
    // Contact Page Translations
    contactTitle: 'Ia Legătura',
    contactSubtitle: 'Ai nevoie de ajutor cu proiectele tale de instalare? Echipa noastră tehnică este aici să te sfătuiască.',
    sendMessage: 'Trimite Mesajul',
    name: 'Nume',
    email: 'Email',
    company: 'Companie',
    message: 'Mesaj',
    phone: 'Telefon',
    chatWhatsApp: 'Chat WhatsApp',
    contactInfo: 'Informații de Contact',
    businessHours: 'Program de Lucru',
    
    // Common elements
    home: 'Acasă',
    products: 'Produse',
    contact: 'Contact',
    support: 'Suport'
  }
};

export const useTranslation = () => {
  const { currentLanguage } = useLanguage();
  
  const t = (key) => {
    return translations[currentLanguage]?.[key] || translations.en?.[key] || key;
  };

  return { t };
};
