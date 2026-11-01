import { COMPANY } from './company';

const C = COMPANY;
const HOST = 'Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA';
const DB = 'Supabase Inc., 970 Toa Payoh North #07-04, Singapore 318992';
const PAY = 'Stripe Payments Europe Ltd, 1 Grand Canal Street Lower, Dublin 2, D02 H210, Ireland';

export const LEGAL_NOTICE_T = {
  fr: {
    title: 'Mentions légales',
    sections: [
      { h: 'Éditeur du site', list: [`${C.site} (marque ${C.brand}) est édité par ${C.name}, société à responsabilité limitée de droit roumain.`, `Siège social : ${C.address}`, `Registre du commerce : ${C.regNo}`, `N° TVA intracommunautaire : ${C.vat}`, `Email : ${C.email} · Téléphone : ${C.phone}`, `Directeur de la publication : le représentant légal de ${C.name}.`] },
      { h: 'Hébergement', list: [`Site : ${HOST}`, `Base de données et comptes clients : ${DB}`] },
      { h: 'Paiement', p: [`Les paiements sont traités par ${PAY}. ${C.brand} n’a jamais accès aux données de votre carte.`] },
      { h: 'Propriété intellectuelle', p: [`La marque ${C.brand}, le logo, les textes, photos et fiches techniques du site sont protégés. Toute reproduction sans autorisation écrite est interdite.`] },
      { h: 'Médiation et litiges', p: ['En cas de litige non résolu avec notre service client, le consommateur peut recourir gratuitement à l’entité de règlement extrajudiciaire des litiges de l’autorité roumaine de protection des consommateurs (SAL-ANPC, anpc.ro) ou, pour un litige transfrontalier, au Centre européen des consommateurs de son pays (réseau ECC-Net).'] },
      { h: 'Documents', p: ['Les conditions applicables à vos achats et à vos données sont décrites dans :'], links: [['/terms', 'Conditions générales de vente'], ['/shipping', 'Livraison'], ['/returns', 'Retours et garanties'], ['/privacy-policy', 'Politique de confidentialité']] },
    ],
  },
  en: {
    title: 'Legal notice',
    sections: [
      { h: 'Site publisher', list: [`${C.site} (${C.brand} brand) is published by ${C.name}, a Romanian limited liability company.`, `Registered office: ${C.address}`, `Trade register: ${C.regNo}`, `EU VAT number: ${C.vat}`, `Email: ${C.email} · Phone: ${C.phone}`, `Publication director: the legal representative of ${C.name}.`] },
      { h: 'Hosting', list: [`Website: ${HOST}`, `Database and customer accounts: ${DB}`] },
      { h: 'Payments', p: [`Payments are processed by ${PAY}. ${C.brand} never has access to your card details.`] },
      { h: 'Intellectual property', p: [`The ${C.brand} brand, logo, texts, photos and technical sheets on this site are protected. Reproduction without written permission is prohibited.`] },
      { h: 'Mediation and disputes', p: ['If a dispute cannot be solved with our customer service, consumers may use, free of charge, the alternative dispute resolution body of the Romanian consumer protection authority (SAL-ANPC, anpc.ro) or, for a cross-border dispute, the European Consumer Centre of their country (ECC-Net).'] },
      { h: 'Documents', p: ['The terms that apply to your purchases and your data are set out in:'], links: [['/terms', 'Terms and conditions of sale'], ['/shipping', 'Shipping'], ['/returns', 'Returns and guarantees'], ['/privacy-policy', 'Privacy policy']] },
    ],
  },
  it: {
    title: 'Note legali',
    sections: [
      { h: 'Editore del sito', list: [`${C.site} (marchio ${C.brand}) è pubblicato da ${C.name}, società a responsabilità limitata di diritto rumeno.`, `Sede legale: ${C.address}`, `Registro delle imprese: ${C.regNo}`, `Partita IVA UE: ${C.vat}`, `Email: ${C.email} · Telefono: ${C.phone}`, `Direttore della pubblicazione: il rappresentante legale di ${C.name}.`] },
      { h: 'Hosting', list: [`Sito: ${HOST}`, `Database e account clienti: ${DB}`] },
      { h: 'Pagamenti', p: [`I pagamenti sono gestiti da ${PAY}. ${C.brand} non ha mai accesso ai dati della tua carta.`] },
      { h: 'Proprietà intellettuale', p: [`Il marchio ${C.brand}, il logo, i testi, le foto e le schede tecniche del sito sono protetti. È vietata la riproduzione senza autorizzazione scritta.`] },
      { h: 'Mediazione e controversie', p: ['Se una controversia non viene risolta con il nostro servizio clienti, il consumatore può rivolgersi gratuitamente all’organismo di risoluzione alternativa delle controversie dell’autorità rumena per la tutela dei consumatori (SAL-ANPC, anpc.ro) oppure, per le controversie transfrontaliere, al Centro europeo dei consumatori del proprio paese (rete ECC-Net).'] },
      { h: 'Documenti', p: ['Le condizioni applicabili ai tuoi acquisti e ai tuoi dati sono descritte in:'], links: [['/terms', 'Condizioni generali di vendita'], ['/shipping', 'Spedizioni'], ['/returns', 'Resi e garanzie'], ['/privacy-policy', 'Informativa privacy']] },
    ],
  },
  de: {
    title: 'Impressum',
    sections: [
      { h: 'Anbieter', list: [`${C.site} (Marke ${C.brand}) wird betrieben von ${C.name}, Gesellschaft mit beschränkter Haftung nach rumänischem Recht.`, `Sitz: ${C.address}`, `Handelsregister: ${C.regNo}`, `USt-IdNr.: ${C.vat}`, `E-Mail: ${C.email} · Telefon: ${C.phone}`, `Verantwortlich für den Inhalt: der gesetzliche Vertreter von ${C.name}.`] },
      { h: 'Hosting', list: [`Website: ${HOST}`, `Datenbank und Kundenkonten: ${DB}`] },
      { h: 'Zahlungen', p: [`Zahlungen werden von ${PAY} abgewickelt. ${C.brand} hat nie Zugriff auf Ihre Kartendaten.`] },
      { h: 'Urheberrecht', p: [`Marke ${C.brand}, Logo, Texte, Fotos und technische Datenblätter dieser Website sind geschützt. Eine Vervielfältigung ohne schriftliche Genehmigung ist untersagt.`] },
      { h: 'Streitbeilegung', p: ['Lässt sich ein Streit mit unserem Kundenservice nicht lösen, können Verbraucher kostenlos die Schlichtungsstelle der rumänischen Verbraucherschutzbehörde (SAL-ANPC, anpc.ro) oder bei grenzüberschreitenden Streitigkeiten das Europäische Verbraucherzentrum ihres Landes (ECC-Net) anrufen.'] },
      { h: 'Dokumente', p: ['Die Bedingungen für Ihre Einkäufe und Ihre Daten finden Sie hier:'], links: [['/terms', 'Allgemeine Verkaufsbedingungen'], ['/shipping', 'Versand'], ['/returns', 'Rückgabe und Gewährleistung'], ['/privacy-policy', 'Datenschutzerklärung']] },
    ],
  },
  es: {
    title: 'Aviso legal',
    sections: [
      { h: 'Titular del sitio', list: [`${C.site} (marca ${C.brand}) es publicado por ${C.name}, sociedad de responsabilidad limitada de derecho rumano.`, `Domicilio social: ${C.address}`, `Registro mercantil: ${C.regNo}`, `NIF-IVA intracomunitario: ${C.vat}`, `Email: ${C.email} · Teléfono: ${C.phone}`, `Responsable de la publicación: el representante legal de ${C.name}.`] },
      { h: 'Alojamiento', list: [`Sitio web: ${HOST}`, `Base de datos y cuentas de clientes: ${DB}`] },
      { h: 'Pagos', p: [`Los pagos los procesa ${PAY}. ${C.brand} nunca tiene acceso a los datos de tu tarjeta.`] },
      { h: 'Propiedad intelectual', p: [`La marca ${C.brand}, el logotipo, los textos, las fotos y las fichas técnicas del sitio están protegidos. Se prohíbe su reproducción sin autorización escrita.`] },
      { h: 'Mediación y litigios', p: ['Si un litigio no se resuelve con nuestro servicio de atención al cliente, el consumidor puede acudir gratuitamente a la entidad de resolución alternativa de litigios de la autoridad rumana de protección del consumidor (SAL-ANPC, anpc.ro) o, en litigios transfronterizos, al Centro Europeo del Consumidor de su país (red ECC-Net).'] },
      { h: 'Documentos', p: ['Las condiciones aplicables a tus compras y a tus datos se describen en:'], links: [['/terms', 'Condiciones generales de venta'], ['/shipping', 'Envíos'], ['/returns', 'Devoluciones y garantías'], ['/privacy-policy', 'Política de privacidad']] },
    ],
  },
  ro: {
    title: 'Informații legale',
    sections: [
      { h: 'Operatorul site-ului', list: [`${C.site} (marca ${C.brand}) este operat de ${C.name}, societate cu răspundere limitată de drept român.`, `Sediu social: ${C.address}`, `Nr. Reg. Com.: ${C.regNo}`, `CUI / cod TVA: ${C.vat}`, `Email: ${C.email} · Telefon: ${C.phone}`, `Responsabil de publicare: reprezentantul legal al ${C.name}.`] },
      { h: 'Găzduire', list: [`Site: ${HOST}`, `Baza de date și conturile clienților: ${DB}`] },
      { h: 'Plăți', p: [`Plățile sunt procesate de ${PAY}. ${C.brand} nu are niciodată acces la datele cardului tău.`] },
      { h: 'Proprietate intelectuală', p: [`Marca ${C.brand}, logo-ul, textele, fotografiile și fișele tehnice de pe site sunt protejate. Reproducerea fără acord scris este interzisă.`] },
      { h: 'Soluționarea litigiilor', p: ['Dacă o problemă nu se rezolvă cu serviciul nostru de clienți, consumatorul se poate adresa gratuit entității de soluționare alternativă a litigiilor din cadrul ANPC (SAL-ANPC, anpc.ro) sau, pentru un litigiu transfrontalier, Centrului European al Consumatorilor din țara sa (rețeaua ECC-Net).'] },
      { h: 'Documente', p: ['Condițiile care se aplică achizițiilor și datelor tale sunt descrise în:'], links: [['/terms', 'Termeni și condiții de vânzare'], ['/shipping', 'Livrare'], ['/returns', 'Retururi și garanții'], ['/privacy-policy', 'Politica de confidențialitate']] },
    ],
  },
};
