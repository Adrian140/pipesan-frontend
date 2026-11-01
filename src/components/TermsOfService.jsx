// FILE: src/components/TermsOfService.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Scale } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { SELLER_LINE, CONTACT_LINE, LEGAL_UPDATED as UPDATED, LEGAL_LOCALE as LOCALE } from '../legal/company';

// Condiții generale de vânzare pentru magazinul PipeSan (vânzător: FISH VALLEY S.R.L.).
const SELLER = SELLER_LINE;
const CONTACT = CONTACT_LINE;

const T = {
  fr: {
    links: { 6: [['/shipping', 'Livraison']], 7: [['/withdrawal', 'Renoncer au contrat ici'], ['/returns', 'Retours et formulaire type']], 8: [['/returns', 'Garanties légales']] },
    title: 'Conditions générales de vente', updated: 'Dernière mise à jour', privacy: 'Politique de confidentialité',
    sections: [
      ['1. Vendeur', [`Le site pipesan.eu (marque PipeSan) est exploité par ${SELLER}.`, `Contact : ${CONTACT}.`]],
      ['2. Champ d’application', ['Les présentes conditions s’appliquent à toute commande passée sur pipesan.eu par un consommateur ou un professionnel. Elles prévalent sur tout autre document, sauf accord écrit. La version applicable est celle en vigueur au moment de la commande.']],
      ['3. Produits', ['Nous vendons des raccords, vannes et composants de plomberie. Les caractéristiques techniques (filetage, diamètre, pression, matériau) figurent sur chaque fiche produit ; les photos sont illustratives.', 'L’installation doit être réalisée selon les règles de l’art et dans les limites de pression et de température indiquées.']],
      ['4. Prix', ['Les prix sont indiqués en euros, TVA incluse. Les frais de livraison sont calculés et affichés avant la validation de la commande. Le prix applicable est celui affiché au moment de la commande.']],
      ['5. Commande et paiement', ['La commande est ferme après paiement accepté. Le paiement se fait par carte bancaire via Stripe ; nous n’avons jamais accès aux données de votre carte. Une confirmation est envoyée par email.', 'Nous pouvons annuler une commande en cas de rupture de stock ou d’erreur manifeste ; le montant payé est alors intégralement remboursé.']],
      ['6. Livraison', ['Les commandes sont expédiées depuis notre entrepôt logistique en France vers les pays proposés lors de la commande. Les délais annoncés sont indicatifs. Vérifiez le colis à la réception et signalez tout dommage au transporteur et à nous sous 3 jours.']],
      ['7. Droit de rétractation (consommateurs)', ['Vous disposez de 14 jours à compter de la réception pour vous rétracter sans motif, avec le bouton « Renoncer au contrat ici », par email à contact@pipesan.eu ou avec le formulaire type de la page Retours. Les produits doivent être renvoyés complets, non installés et dans leur état d’origine, dans les 14 jours suivant votre demande ; les frais de retour sont à votre charge.', 'Nous remboursons le prix et les frais de livraison standard dans les 14 jours suivant votre demande, au plus tard à réception des produits. Ce droit ne s’applique pas aux achats professionnels.']],
      ['8. Garanties', ['Les consommateurs bénéficient de la garantie légale de conformité de 2 ans (directive (UE) 2019/771) et de la garantie contre les vices cachés. Contactez-nous avec le numéro de commande et des photos : nous réparons, remplaçons ou remboursons le produit non conforme.']],
      ['9. Responsabilité', ['Notre responsabilité ne couvre pas les dommages résultant d’une installation non conforme, d’une utilisation hors des spécifications ou d’une usure normale. Rien dans ces conditions ne limite les droits que la loi accorde aux consommateurs.']],
      ['10. Données personnelles', ['Vos données sont traitées conformément au RGPD, comme décrit dans notre politique de confidentialité.'], true],
      ['11. Droit applicable et litiges', ['Ces conditions sont régies par le droit roumain, sans priver le consommateur des protections impératives de son pays de résidence. En cas de litige, contactez-nous d’abord pour une solution amiable ; le consommateur peut ensuite recourir gratuitement à l’entité de règlement des litiges SAL-ANPC (anpc.ro), au Centre européen des consommateurs de son pays ou aux tribunaux compétents.']],
    ],
  },
  en: {
    links: { 6: [['/shipping', 'Shipping']], 7: [['/withdrawal', 'Withdraw from contract here'], ['/returns', 'Returns and model form']], 8: [['/returns', 'Legal guarantees']] },
    title: 'Terms and Conditions of Sale', updated: 'Last updated', privacy: 'Privacy policy',
    sections: [
      ['1. Seller', [`pipesan.eu (PipeSan brand) is operated by ${SELLER}.`, `Contact: ${CONTACT}.`]],
      ['2. Scope', ['These terms apply to every order placed on pipesan.eu by a consumer or a business. They prevail over any other document unless agreed in writing. The version in force when you order applies.']],
      ['3. Products', ['We sell plumbing fittings, valves and components. Technical characteristics (thread, size, pressure, material) are listed on each product page; photos are illustrative.', 'Installation must follow good trade practice and stay within the stated pressure and temperature limits.']],
      ['4. Prices', ['Prices are in euros and include VAT. Shipping costs are calculated and shown before you confirm the order. The price shown when you order applies.']],
      ['5. Order and payment', ['Your order is binding once payment is accepted. Payment is by card through Stripe; we never see your card details. You receive a confirmation email.', 'We may cancel an order if an item is out of stock or the price is obviously wrong; any amount paid is then refunded in full.']],
      ['6. Delivery', ['Orders ship from our logistics warehouse in France to the countries offered at checkout. Delivery times are estimates. Please check the parcel on arrival and report any damage to the carrier and to us within 3 days.']],
      ['7. Right of withdrawal (consumers)', ['You may withdraw within 14 days of receiving the goods, without giving a reason, with the “Withdraw from contract here” button, by email to contact@pipesan.eu or with the model form on the Returns page. Return the products complete, uninstalled and in their original condition within 14 days of your request; return shipping is at your cost.', 'We refund the price and standard delivery within 14 days of your request, at the latest once we receive the products. This right does not apply to business purchases.']],
      ['8. Guarantees', ['Consumers benefit from the 2-year legal guarantee of conformity (Directive (EU) 2019/771) and the guarantee against hidden defects. Contact us with your order number and photos: we repair, replace or refund non-conforming products.']],
      ['9. Liability', ['We are not liable for damage caused by incorrect installation, use outside the specifications, or normal wear. Nothing in these terms limits the rights consumers have under the law.']],
      ['10. Personal data', ['Your data is processed under the GDPR as described in our privacy policy.'], true],
      ['11. Governing law and disputes', ['These terms are governed by Romanian law, without depriving consumers of the mandatory protection of their country of residence. In case of a dispute please contact us first for an amicable solution; consumers may then turn, free of charge, to the SAL-ANPC dispute resolution body (anpc.ro), the European Consumer Centre of their country or the competent courts.']],
    ],
  },
  it: {
    links: { 6: [['/shipping', 'Spedizioni']], 7: [['/withdrawal', 'Recedi dal contratto qui'], ['/returns', 'Resi e modulo tipo']], 8: [['/returns', 'Garanzie legali']] },
    title: 'Condizioni generali di vendita', updated: 'Ultimo aggiornamento', privacy: 'Informativa privacy',
    sections: [
      ['1. Venditore', [`Il sito pipesan.eu (marchio PipeSan) è gestito da ${SELLER}.`, `Contatti: ${CONTACT}.`]],
      ['2. Ambito', ['Queste condizioni si applicano a ogni ordine effettuato su pipesan.eu da un consumatore o da un professionista. Prevalgono su ogni altro documento salvo accordo scritto. Si applica la versione in vigore al momento dell’ordine.']],
      ['3. Prodotti', ['Vendiamo raccordi, valvole e componenti idraulici. Le caratteristiche tecniche (filettatura, diametro, pressione, materiale) sono indicate in ogni scheda; le foto sono illustrative.', 'L’installazione deve seguire la regola dell’arte e rispettare i limiti di pressione e temperatura indicati.']],
      ['4. Prezzi', ['I prezzi sono in euro, IVA inclusa. Le spese di spedizione sono calcolate e mostrate prima della conferma dell’ordine. Vale il prezzo mostrato al momento dell’ordine.']],
      ['5. Ordine e pagamento', ['L’ordine è vincolante dopo l’accettazione del pagamento, con carta tramite Stripe; non vediamo mai i dati della carta. Ricevi una conferma via email.', 'Possiamo annullare un ordine in caso di prodotto esaurito o errore evidente di prezzo; l’importo pagato viene rimborsato per intero.']],
      ['6. Consegna', ['Gli ordini partono dal nostro magazzino logistico in Francia verso i paesi proposti al checkout. I tempi sono indicativi. Controlla il pacco alla consegna e segnala eventuali danni al corriere e a noi entro 3 giorni.']],
      ['7. Diritto di recesso (consumatori)', ['Puoi recedere entro 14 giorni dal ricevimento, senza motivazione, con il pulsante «Recedi dal contratto qui», via email a contact@pipesan.eu o con il modulo tipo della pagina Resi. Restituisci i prodotti completi, non installati e integri entro 14 giorni dalla richiesta; le spese di reso sono a tuo carico.', 'Rimborsiamo il prezzo e la spedizione standard entro 14 giorni dalla richiesta, al più tardi al ricevimento dei prodotti. Il diritto non si applica agli acquisti professionali.']],
      ['8. Garanzie', ['I consumatori godono della garanzia legale di conformità di 2 anni (direttiva (UE) 2019/771) e della garanzia per vizi occulti. Contattaci con numero d’ordine e foto: ripariamo, sostituiamo o rimborsiamo il prodotto non conforme.']],
      ['9. Responsabilità', ['Non rispondiamo di danni dovuti a installazione non corretta, uso fuori specifica o normale usura. Nulla in queste condizioni limita i diritti dei consumatori previsti dalla legge.']],
      ['10. Dati personali', ['I tuoi dati sono trattati secondo il GDPR, come descritto nella nostra informativa privacy.'], true],
      ['11. Legge applicabile e controversie', ['Queste condizioni sono regolate dalla legge rumena, senza privare il consumatore delle tutele inderogabili del paese di residenza. In caso di controversia contattaci prima per una soluzione amichevole; il consumatore può poi rivolgersi gratuitamente all’organismo SAL-ANPC (anpc.ro), al Centro europeo dei consumatori del suo paese o ai tribunali competenti.']],
    ],
  },
  de: {
    links: { 6: [['/shipping', 'Versand']], 7: [['/withdrawal', 'Vertrag hier widerrufen'], ['/returns', 'Rückgabe und Musterformular']], 8: [['/returns', 'Gesetzliche Gewährleistung']] },
    title: 'Allgemeine Verkaufsbedingungen', updated: 'Zuletzt aktualisiert', privacy: 'Datenschutzerklärung',
    sections: [
      ['1. Verkäufer', [`pipesan.eu (Marke PipeSan) wird betrieben von ${SELLER}.`, `Kontakt: ${CONTACT}.`]],
      ['2. Geltungsbereich', ['Diese Bedingungen gelten für alle Bestellungen auf pipesan.eu durch Verbraucher oder Unternehmen. Sie haben Vorrang vor anderen Dokumenten, sofern nichts anderes schriftlich vereinbart ist. Es gilt die Fassung zum Zeitpunkt der Bestellung.']],
      ['3. Produkte', ['Wir verkaufen Sanitärfittings, Ventile und Komponenten. Technische Merkmale (Gewinde, Größe, Druck, Material) stehen auf jeder Produktseite; Fotos sind beispielhaft.', 'Die Installation muss fachgerecht und innerhalb der angegebenen Druck- und Temperaturgrenzen erfolgen.']],
      ['4. Preise', ['Preise in Euro inklusive Mehrwertsteuer. Versandkosten werden vor Abschluss der Bestellung berechnet und angezeigt. Es gilt der zum Bestellzeitpunkt angezeigte Preis.']],
      ['5. Bestellung und Zahlung', ['Die Bestellung ist verbindlich, sobald die Zahlung akzeptiert ist. Bezahlt wird per Karte über Stripe; Ihre Kartendaten sehen wir nie. Sie erhalten eine Bestätigung per E-Mail.', 'Bei fehlendem Bestand oder offensichtlichem Preisfehler können wir eine Bestellung stornieren; der gezahlte Betrag wird vollständig erstattet.']],
      ['6. Lieferung', ['Der Versand erfolgt aus unserem Logistiklager in Frankreich in die beim Checkout angebotenen Länder. Lieferzeiten sind Richtwerte. Bitte prüfen Sie das Paket bei Ankunft und melden Sie Schäden innerhalb von 3 Tagen dem Zusteller und uns.']],
      ['7. Widerrufsrecht (Verbraucher)', ['Sie können innerhalb von 14 Tagen nach Erhalt ohne Angabe von Gründen widerrufen, über die Schaltfläche „Vertrag hier widerrufen“, per E-Mail an contact@pipesan.eu oder mit dem Musterformular auf der Seite Rückgabe. Senden Sie die Ware vollständig, nicht eingebaut und im Originalzustand innerhalb von 14 Tagen nach dem Widerruf zurück; die Rücksendekosten tragen Sie.', 'Wir erstatten Preis und Standardversand innerhalb von 14 Tagen nach dem Widerruf, spätestens nach Eingang der Ware. Für gewerbliche Käufe gilt das Widerrufsrecht nicht.']],
      ['8. Gewährleistung', ['Verbraucher haben die gesetzliche Gewährleistung von 2 Jahren (Richtlinie (EU) 2019/771). Kontaktieren Sie uns mit Bestellnummer und Fotos: Wir reparieren, ersetzen oder erstatten mangelhafte Ware.']],
      ['9. Haftung', ['Wir haften nicht für Schäden durch unsachgemäße Installation, Verwendung außerhalb der Spezifikationen oder normalen Verschleiß. Gesetzliche Verbraucherrechte bleiben unberührt.']],
      ['10. Personenbezogene Daten', ['Ihre Daten werden gemäß DSGVO verarbeitet, wie in unserer Datenschutzerklärung beschrieben.'], true],
      ['11. Anwendbares Recht und Streitigkeiten', ['Es gilt rumänisches Recht, ohne Verbrauchern den zwingenden Schutz ihres Wohnsitzlandes zu entziehen. Bitte wenden Sie sich bei Streitigkeiten zuerst an uns; Verbraucher können anschließend kostenlos die Schlichtungsstelle SAL-ANPC (anpc.ro), das Europäische Verbraucherzentrum ihres Landes oder die zuständigen Gerichte anrufen.']],
    ],
  },
  es: {
    links: { 6: [['/shipping', 'Envíos']], 7: [['/withdrawal', 'Desistir del contrato aquí'], ['/returns', 'Devoluciones y formulario modelo']], 8: [['/returns', 'Garantías legales']] },
    title: 'Condiciones generales de venta', updated: 'Última actualización', privacy: 'Política de privacidad',
    sections: [
      ['1. Vendedor', [`pipesan.eu (marca PipeSan) está gestionado por ${SELLER}.`, `Contacto: ${CONTACT}.`]],
      ['2. Ámbito', ['Estas condiciones se aplican a todo pedido realizado en pipesan.eu por un consumidor o un profesional. Prevalecen sobre cualquier otro documento salvo acuerdo escrito. Se aplica la versión vigente en el momento del pedido.']],
      ['3. Productos', ['Vendemos racores, válvulas y componentes de fontanería. Las características técnicas (rosca, diámetro, presión, material) figuran en cada ficha; las fotos son ilustrativas.', 'La instalación debe realizarse según las buenas prácticas y dentro de los límites de presión y temperatura indicados.']],
      ['4. Precios', ['Los precios están en euros, IVA incluido. Los gastos de envío se calculan y muestran antes de confirmar el pedido. Se aplica el precio mostrado en el momento del pedido.']],
      ['5. Pedido y pago', ['El pedido es firme una vez aceptado el pago, con tarjeta a través de Stripe; nunca vemos los datos de tu tarjeta. Recibes una confirmación por email.', 'Podemos cancelar un pedido por falta de stock o error evidente de precio; el importe pagado se reembolsa íntegramente.']],
      ['6. Entrega', ['Los pedidos salen de nuestro almacén logístico en Francia hacia los países ofrecidos en el checkout. Los plazos son orientativos. Revisa el paquete al recibirlo y comunica cualquier daño al transportista y a nosotros en 3 días.']],
      ['7. Derecho de desistimiento (consumidores)', ['Puedes desistir en 14 días desde la recepción, sin dar motivos, con el botón «Desistir del contrato aquí», por email a contact@pipesan.eu o con el formulario modelo de la página Devoluciones. Devuelve los productos completos, sin instalar y en su estado original en los 14 días siguientes a tu solicitud; los gastos de devolución corren de tu cuenta.', 'Reembolsamos el precio y el envío estándar en 14 días desde tu solicitud, como tarde al recibir los productos. Este derecho no se aplica a compras profesionales.']],
      ['8. Garantías', ['Los consumidores disponen de la garantía legal de conformidad de 2 años (Directiva (UE) 2019/771). Contáctanos con el número de pedido y fotos: reparamos, sustituimos o reembolsamos el producto no conforme.']],
      ['9. Responsabilidad', ['No respondemos de daños causados por una instalación incorrecta, un uso fuera de especificaciones o el desgaste normal. Nada en estas condiciones limita los derechos legales de los consumidores.']],
      ['10. Datos personales', ['Tus datos se tratan conforme al RGPD, como se describe en nuestra política de privacidad.'], true],
      ['11. Ley aplicable y litigios', ['Estas condiciones se rigen por la ley rumana, sin privar al consumidor de la protección imperativa de su país de residencia. En caso de litigio, contáctanos primero para una solución amistosa; después el consumidor puede acudir gratuitamente a la entidad SAL-ANPC (anpc.ro), al Centro Europeo del Consumidor de su país o a los tribunales competentes.']],
    ],
  },
  ro: {
    links: { 6: [['/shipping', 'Livrare']], 7: [['/withdrawal', 'Renunță la contract aici'], ['/returns', 'Retururi și formular-tip']], 8: [['/returns', 'Garanții legale']] },
    title: 'Termeni și condiții de vânzare', updated: 'Ultima actualizare', privacy: 'Politica de confidențialitate',
    sections: [
      ['1. Vânzătorul', [`Site-ul pipesan.eu (marca PipeSan) este operat de ${SELLER}.`, `Contact: ${CONTACT}.`]],
      ['2. Domeniu de aplicare', ['Acești termeni se aplică oricărei comenzi plasate pe pipesan.eu de un consumator sau de o firmă. Au prioritate față de orice alt document, cu excepția unui acord scris. Se aplică versiunea în vigoare la data comenzii.']],
      ['3. Produse', ['Vindem fitinguri, robinete și componente pentru instalații. Caracteristicile tehnice (filet, diametru, presiune, material) sunt pe fiecare pagină de produs; fotografiile sunt orientative.', 'Montajul trebuie făcut conform regulilor tehnice și în limitele de presiune și temperatură indicate.']],
      ['4. Prețuri', ['Prețurile sunt în euro, cu TVA inclus. Costul livrării este calculat și afișat înainte de confirmarea comenzii. Se aplică prețul afișat la momentul comenzii.']],
      ['5. Comandă și plată', ['Comanda devine fermă după acceptarea plății, cu cardul prin Stripe; nu vedem niciodată datele cardului. Primești confirmarea pe email.', 'Putem anula o comandă dacă produsul nu mai e în stoc sau prețul e evident greșit; suma plătită se rambursează integral.']],
      ['6. Livrare', ['Comenzile pleacă din depozitul nostru logistic din Franța către țările oferite la finalizarea comenzii. Termenele sunt orientative. Verifică coletul la primire și semnalează orice deteriorare curierului și nouă în 3 zile.']],
      ['7. Dreptul de retragere (consumatori)', ['Te poți retrage în 14 zile de la primire, fără motiv, cu butonul „Renunță la contract aici”, pe email la contact@pipesan.eu sau cu formularul-tip de pe pagina Retururi. Returnează produsele complete, nemontate și în starea inițială în 14 zile de la cerere; costul returului este al tău.', 'Rambursăm prețul și livrarea standard în 14 zile de la cerere, cel târziu la primirea produselor. Dreptul nu se aplică achizițiilor făcute de firme.']],
      ['8. Garanții', ['Consumatorii beneficiază de garanția legală de conformitate de 2 ani (Directiva (UE) 2019/771) și de garanția pentru vicii ascunse. Scrie-ne cu numărul comenzii și fotografii: reparăm, înlocuim sau rambursăm produsul neconform.']],
      ['9. Răspundere', ['Nu răspundem pentru daune cauzate de montaj necorespunzător, folosire în afara specificațiilor sau uzură normală. Nimic din acești termeni nu limitează drepturile legale ale consumatorilor.']],
      ['10. Date personale', ['Datele tale sunt prelucrate conform GDPR, așa cum este descris în politica de confidențialitate.'], true],
      ['11. Legea aplicabilă și litigii', ['Acești termeni sunt guvernați de legea română, fără a priva consumatorul de protecția obligatorie din țara sa de reședință. În caz de litigiu, contactează-ne mai întâi pentru o soluție amiabilă; consumatorul se poate adresa apoi gratuit SAL-ANPC (anpc.ro), Centrului European al Consumatorilor din țara sa sau instanțelor competente.']],
    ],
  },
};


function TermsOfService() {
  const { currentLanguage } = useLanguage();
  const lang = T[currentLanguage] ? currentLanguage : 'fr';
  const t = T[lang];

  return (
    <div className="min-h-screen bg-paper py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <Scale className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-extrabold text-text-primary mb-3">{t.title}</h1>
          <p className="text-text-secondary">
            {t.updated}: {new Date(UPDATED).toLocaleDateString(LOCALE[lang])}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-10 space-y-8">
          {t.sections.map(([title, paragraphs, privacyLink]) => (
            <section key={title}>
              <h2 className="text-xl font-bold text-text-primary mb-3">{title}</h2>
              {paragraphs.map((p) => (
                <p key={p} className="text-text-secondary leading-relaxed mb-2 last:mb-0">{p}</p>
              ))}
              {privacyLink && (
                <Link to="/privacy-policy" className="text-primary hover:text-primary-dark underline">
                  {t.privacy}
                </Link>
              )}
              {t.links[parseInt(title, 10)] && (
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2">
                  {t.links[parseInt(title, 10)].map(([to, label]) => (
                    <Link key={to + label} to={to} className="text-primary hover:text-primary-dark underline">{label}</Link>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TermsOfService;
