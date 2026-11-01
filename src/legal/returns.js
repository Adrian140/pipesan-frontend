import { COMPANY } from './company';

const TO = `${COMPANY.name} (${COMPANY.brand}), ${COMPANY.address}, ${COMPANY.email}`;

// Model withdrawal form: Annex I(B) of Directive 2011/83/EU, in each site language.
export const RETURNS_T = {
  fr: {
    title: 'Retours, rétractation et garanties',
    intro: 'Vous avez 14 jours pour changer d’avis et 2 ans de garantie légale sur tous nos produits.',
    cta: 'Renoncer au contrat ici',
    sections: [
      { h: '1. Délai de rétractation', p: ['Si vous êtes un consommateur, vous pouvez vous rétracter sans donner de motif dans les 14 jours suivant la réception de votre commande (ou du dernier colis si la commande arrive en plusieurs fois). Vous pouvez aussi vous rétracter avant la livraison.'] },
      { h: '2. Comment vous rétracter', list: ['en ligne, avec le bouton « Renoncer au contrat ici » : vous recevez immédiatement un accusé de réception ;', 'par email à contact@pipesan.eu ;', 'avec le formulaire type ci-dessous (facultatif).'], links: [['/withdrawal', 'Renoncer au contrat ici']] },
      { h: '3. Renvoyer les produits', p: ['Renvoyez les produits dans les 14 jours suivant votre rétractation, à l’adresse de retour que nous vous indiquons en réponse. Les frais de retour sont à votre charge. Les produits doivent être complets ; vous pouvez les examiner comme en magasin, mais une pièce montée, filetée avec de l’étanchéité ou abîmée peut entraîner une retenue correspondant à la perte de valeur.'] },
      { h: '4. Remboursement', p: ['Nous remboursons le prix des produits et les frais de livraison standard dans les 14 jours suivant votre rétractation, avec le moyen de paiement utilisé lors de la commande et sans frais. Nous pouvons attendre d’avoir reçu les produits ou une preuve d’expédition.'] },
      { h: '5. Achats professionnels', p: ['Le droit de rétractation est réservé aux consommateurs. Pour un achat professionnel, écrivez-nous : nous étudions chaque demande de retour.'] },
      { h: '6. Produit défectueux ou non conforme', p: ['Écrivez-nous à contact@pipesan.eu avec le numéro de commande et des photos. Nous réparons, remplaçons ou remboursons le produit, sans frais pour vous, y compris le retour.'] },
      { h: '7. Garanties légales', box: [
        'Le consommateur dispose d’un délai de deux ans à compter de la délivrance du bien pour obtenir la mise en œuvre de la garantie légale de conformité en cas d’apparition d’un défaut de conformité. Durant ce délai, le consommateur n’est tenu d’établir que l’existence du défaut de conformité et non la date d’apparition de celui-ci.',
        'La garantie légale de conformité donne au consommateur droit à la réparation ou au remplacement du bien dans un délai de trente jours suivant sa demande, sans frais et sans inconvénient majeur pour lui. Le bien réparé dans le cadre de cette garantie bénéficie d’une extension de garantie de six mois.',
        'Le consommateur peut obtenir une réduction du prix d’achat en conservant le bien ou mettre fin au contrat en se faisant rembourser intégralement contre restitution du bien si : 1° le professionnel refuse de réparer ou de remplacer le bien ; 2° la réparation ou le remplacement intervient après un délai de trente jours ; 3° la réparation ou le remplacement occasionne un inconvénient majeur pour le consommateur ; 4° la non-conformité persiste malgré la tentative de mise en conformité. Il y a également droit, sans demande préalable de réparation ou de remplacement, lorsque le défaut est si grave qu’il le justifie. Le consommateur n’a pas droit à la résolution de la vente si le défaut de conformité est mineur.',
        'Toute période d’immobilisation du bien en vue de sa réparation ou de son remplacement suspend la garantie qui restait à courir jusqu’à la délivrance du bien remis en état. Ces droits résultent des articles L. 217-1 à L. 217-32 du code de la consommation. Le vendeur qui fait obstacle de mauvaise foi à la mise en œuvre de la garantie légale de conformité encourt une amende civile d’un montant maximal de 300 000 euros, qui peut être porté jusqu’à 10 % du chiffre d’affaires moyen annuel (article L. 241-5 du code de la consommation).',
        'Le consommateur bénéficie également de la garantie légale des vices cachés (articles 1641 à 1649 du code civil), pendant deux ans à compter de la découverte du défaut. Elle donne droit à une réduction de prix si le bien est conservé ou à un remboursement intégral contre restitution du bien.',
      ] },
      { h: '8. Formulaire type de rétractation', p: ['Complétez et renvoyez ce formulaire uniquement si vous souhaitez vous rétracter.'], box: [
        `À l’attention de ${TO} :`,
        'Je/Nous (*) vous notifie/notifions (*) par la présente ma/notre (*) rétractation du contrat portant sur la vente du bien (*) ci-dessous :',
        '— Commandé le (*) / reçu le (*) :\n— Numéro de commande :\n— Nom du (des) consommateur(s) :\n— Adresse du (des) consommateur(s) :\n— Signature du (des) consommateur(s) (uniquement en cas de notification du présent formulaire sur papier) :\n— Date :',
        '(*) Rayez la mention inutile.',
      ] },
    ],
  },
  en: {
    title: 'Returns, withdrawal and guarantees',
    intro: 'You have 14 days to change your mind and a 2-year legal guarantee on every product.',
    cta: 'Withdraw from contract here',
    sections: [
      { h: '1. Withdrawal period', p: ['If you are a consumer, you may withdraw without giving any reason within 14 days of receiving your order (or the last parcel if it arrives in several). You may also withdraw before delivery.'] },
      { h: '2. How to withdraw', list: ['online, with the “Withdraw from contract here” button: you get an acknowledgement straight away;', 'by email to contact@pipesan.eu;', 'with the model form below (optional).'], links: [['/withdrawal', 'Withdraw from contract here']] },
      { h: '3. Sending the products back', p: ['Send the products back within 14 days of withdrawing, to the return address we give you in our reply. Return shipping is at your cost. Products must be complete; you may inspect them as you would in a shop, but a part that has been installed, sealed with thread tape or damaged may lead to a deduction for the loss in value.'] },
      { h: '4. Refund', p: ['We refund the price of the products and standard delivery within 14 days of your withdrawal, using the payment method of your order and at no cost to you. We may wait until we have received the products or proof that you have sent them.'] },
      { h: '5. Business purchases', p: ['The right of withdrawal applies to consumers only. For a business purchase, write to us: we look at every return request.'] },
      { h: '6. Faulty or non-conforming product', p: ['Email contact@pipesan.eu with your order number and photos. We repair, replace or refund the product at no cost to you, return included.'] },
      { h: '7. Legal guarantees', p: ['Consumers benefit from the legal guarantee of conformity for 2 years from delivery (Directive (EU) 2019/771). During this period you only need to show the defect, not when it appeared. You are entitled to repair or replacement free of charge within a reasonable time; if that is impossible, refused, late or the defect persists, to a price reduction or a full refund on return of the product. Consumers in France also benefit from the guarantee against hidden defects (articles 1641–1649 of the French Civil Code) for 2 years from discovery of the defect.'] },
      { h: '8. Model withdrawal form', p: ['Complete and return this form only if you wish to withdraw from the contract.'], box: [
        `To ${TO}:`,
        'I/We (*) hereby give notice that I/We (*) withdraw from my/our (*) contract of sale of the following goods (*):',
        '— Ordered on (*) / received on (*):\n— Order number:\n— Name of consumer(s):\n— Address of consumer(s):\n— Signature of consumer(s) (only if this form is notified on paper):\n— Date:',
        '(*) Delete as appropriate.',
      ] },
    ],
  },
  it: {
    title: 'Resi, recesso e garanzie',
    intro: 'Hai 14 giorni per ripensarci e 2 anni di garanzia legale su tutti i prodotti.',
    cta: 'Recedi dal contratto qui',
    sections: [
      { h: '1. Periodo di recesso', p: ['Se sei un consumatore, puoi recedere senza indicare il motivo entro 14 giorni dal ricevimento dell’ordine (o dell’ultimo pacco se arriva in più spedizioni). Puoi recedere anche prima della consegna.'] },
      { h: '2. Come recedere', list: ['online, con il pulsante «Recedi dal contratto qui»: ricevi subito una conferma di ricezione;', 'via email a contact@pipesan.eu;', 'con il modulo tipo qui sotto (facoltativo).'], links: [['/withdrawal', 'Recedi dal contratto qui']] },
      { h: '3. Restituzione dei prodotti', p: ['Restituisci i prodotti entro 14 giorni dal recesso all’indirizzo di reso che ti indichiamo nella risposta. Le spese di reso sono a tuo carico. I prodotti devono essere completi; puoi esaminarli come in negozio, ma un pezzo installato, sigillato con nastro per filettature o danneggiato può comportare una trattenuta per la perdita di valore.'] },
      { h: '4. Rimborso', p: ['Rimborsiamo il prezzo dei prodotti e la spedizione standard entro 14 giorni dal recesso, con lo stesso mezzo di pagamento dell’ordine e senza costi. Possiamo attendere di aver ricevuto i prodotti o la prova della spedizione.'] },
      { h: '5. Acquisti professionali', p: ['Il diritto di recesso spetta solo ai consumatori. Per un acquisto professionale scrivici: valutiamo ogni richiesta di reso.'] },
      { h: '6. Prodotto difettoso o non conforme', p: ['Scrivi a contact@pipesan.eu con numero d’ordine e foto. Ripariamo, sostituiamo o rimborsiamo il prodotto senza costi per te, reso incluso.'] },
      { h: '7. Garanzie legali', p: ['I consumatori godono della garanzia legale di conformità per 2 anni dalla consegna (direttiva (UE) 2019/771). In questo periodo basta dimostrare il difetto, non quando è comparso. Hai diritto alla riparazione o sostituzione gratuita entro un tempo ragionevole; se impossibile, rifiutata, tardiva o se il difetto persiste, a una riduzione del prezzo o al rimborso totale con restituzione del prodotto.'] },
      { h: '8. Modulo di recesso tipo', p: ['Compila e restituisci questo modulo solo se desideri recedere dal contratto.'], box: [
        `Destinatario: ${TO}`,
        'Con la presente io/noi (*) notifico/notifichiamo (*) il recesso dal mio/nostro (*) contratto di vendita dei seguenti beni (*):',
        '— Ordinato il (*) / ricevuto il (*):\n— Numero d’ordine:\n— Nome del/dei consumatore/i:\n— Indirizzo del/dei consumatore/i:\n— Firma del/dei consumatore/i (solo se il presente modulo è notificato in versione cartacea):\n— Data:',
        '(*) Cancellare la dicitura inutile.',
      ] },
    ],
  },
  de: {
    title: 'Rückgabe, Widerruf und Gewährleistung',
    intro: 'Sie haben 14 Tage Widerrufsrecht und 2 Jahre gesetzliche Gewährleistung auf alle Produkte.',
    cta: 'Vertrag hier widerrufen',
    sections: [
      { h: '1. Widerrufsfrist', p: ['Als Verbraucher können Sie binnen 14 Tagen ab Erhalt der Ware (bei Teillieferungen ab Erhalt des letzten Pakets) ohne Angabe von Gründen widerrufen. Ein Widerruf ist auch vor der Lieferung möglich.'] },
      { h: '2. So widerrufen Sie', list: ['online über die Schaltfläche „Vertrag hier widerrufen“: Sie erhalten sofort eine Eingangsbestätigung;', 'per E-Mail an contact@pipesan.eu;', 'mit dem Muster-Widerrufsformular unten (nicht vorgeschrieben).'], links: [['/withdrawal', 'Vertrag hier widerrufen']] },
      { h: '3. Rücksendung', p: ['Senden Sie die Ware binnen 14 Tagen nach dem Widerruf an die Rücksendeadresse, die wir Ihnen in unserer Antwort nennen. Die unmittelbaren Kosten der Rücksendung tragen Sie. Die Ware muss vollständig sein; Sie dürfen sie wie im Laden prüfen, für eingebaute, mit Gewindedichtung versehene oder beschädigte Teile kann jedoch Wertersatz verlangt werden.'] },
      { h: '4. Erstattung', p: ['Wir erstatten den Warenpreis und die Standardversandkosten binnen 14 Tagen nach Ihrem Widerruf über das bei der Bestellung verwendete Zahlungsmittel und ohne Gebühren. Wir können die Erstattung verweigern, bis wir die Ware oder einen Nachweis der Rücksendung erhalten haben.'] },
      { h: '5. Gewerbliche Käufe', p: ['Das Widerrufsrecht gilt nur für Verbraucher. Bei gewerblichen Käufen schreiben Sie uns: Wir prüfen jede Rückgabeanfrage.'] },
      { h: '6. Mangelhafte Ware', p: ['Schreiben Sie an contact@pipesan.eu mit Bestellnummer und Fotos. Wir reparieren, ersetzen oder erstatten die Ware kostenlos, einschließlich Rücksendung.'] },
      { h: '7. Gesetzliche Gewährleistung', p: ['Verbraucher haben 2 Jahre ab Lieferung die gesetzliche Gewährleistung (Richtlinie (EU) 2019/771). Sie haben Anspruch auf kostenlose Nachbesserung oder Ersatzlieferung in angemessener Frist; ist das unmöglich, wird es verweigert, verzögert oder bleibt der Mangel bestehen, auf Minderung oder Rücktritt mit voller Erstattung gegen Rückgabe der Ware.'] },
      { h: '8. Muster-Widerrufsformular', p: ['Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte dieses Formular aus und senden Sie es zurück.'], box: [
        `An ${TO}:`,
        'Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*):',
        '— Bestellt am (*) / erhalten am (*):\n— Bestellnummer:\n— Name des/der Verbraucher(s):\n— Anschrift des/der Verbraucher(s):\n— Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier):\n— Datum:',
        '(*) Unzutreffendes streichen.',
      ] },
    ],
  },
  es: {
    title: 'Devoluciones, desistimiento y garantías',
    intro: 'Tienes 14 días para cambiar de opinión y 2 años de garantía legal en todos los productos.',
    cta: 'Desistir del contrato aquí',
    sections: [
      { h: '1. Plazo de desistimiento', p: ['Si eres consumidor, puedes desistir sin indicar el motivo en los 14 días siguientes a la recepción del pedido (o del último paquete si llega en varios envíos). También puedes desistir antes de la entrega.'] },
      { h: '2. Cómo desistir', list: ['en línea, con el botón «Desistir del contrato aquí»: recibes un acuse de recibo al momento;', 'por email a contact@pipesan.eu;', 'con el formulario modelo de abajo (opcional).'], links: [['/withdrawal', 'Desistir del contrato aquí']] },
      { h: '3. Devolución de los productos', p: ['Devuelve los productos en los 14 días siguientes a tu desistimiento a la dirección de devolución que te indicamos en la respuesta. Los gastos de devolución corren a tu cargo. Los productos deben estar completos; puedes examinarlos como en una tienda, pero una pieza instalada, sellada con cinta de roscas o dañada puede conllevar una deducción por la pérdida de valor.'] },
      { h: '4. Reembolso', p: ['Reembolsamos el precio de los productos y el envío estándar en los 14 días siguientes a tu desistimiento, con el mismo medio de pago y sin coste. Podemos esperar a recibir los productos o la prueba de su envío.'] },
      { h: '5. Compras profesionales', p: ['El derecho de desistimiento es solo para consumidores. Para una compra profesional, escríbenos: estudiamos cada solicitud de devolución.'] },
      { h: '6. Producto defectuoso o no conforme', p: ['Escribe a contact@pipesan.eu con el número de pedido y fotos. Reparamos, sustituimos o reembolsamos el producto sin coste para ti, devolución incluida.'] },
      { h: '7. Garantías legales', p: ['Los consumidores disponen de la garantía legal de conformidad durante 2 años desde la entrega (Directiva (UE) 2019/771). Tienes derecho a la reparación o sustitución gratuitas en un plazo razonable; si no es posible, se rechaza, se retrasa o el defecto persiste, a una rebaja del precio o al reembolso íntegro devolviendo el producto.'] },
      { h: '8. Formulario modelo de desistimiento', p: ['Cumplimenta y envía este formulario solo si deseas desistir del contrato.'], box: [
        `A la atención de ${TO}:`,
        'Por la presente le comunico/comunicamos (*) que desisto de mi/desistimos de nuestro (*) contrato de venta del siguiente bien (*):',
        '— Pedido el (*) / recibido el (*):\n— Número de pedido:\n— Nombre del consumidor o de los consumidores:\n— Domicilio del consumidor o de los consumidores:\n— Firma del consumidor o de los consumidores (solo si el formulario se presenta en papel):\n— Fecha:',
        '(*) Táchese lo que no proceda.',
      ] },
    ],
  },
  ro: {
    title: 'Retururi, retragere și garanții',
    intro: 'Ai 14 zile să te răzgândești și 2 ani de garanție legală pentru toate produsele.',
    cta: 'Renunță la contract aici',
    sections: [
      { h: '1. Termenul de retragere', p: ['Dacă ești consumator, te poți retrage fără să dai un motiv în 14 zile de la primirea comenzii (sau a ultimului colet, dacă vine în mai multe). Te poți retrage și înainte de livrare.'] },
      { h: '2. Cum te retragi', list: ['online, cu butonul „Renunță la contract aici”: primești imediat confirmarea de primire;', 'pe email la contact@pipesan.eu;', 'cu formularul-tip de mai jos (opțional).'], links: [['/withdrawal', 'Renunță la contract aici']] },
      { h: '3. Returnarea produselor', p: ['Trimite produsele înapoi în 14 zile de la retragere, la adresa de retur pe care ți-o comunicăm în răspuns. Costul returului este al tău. Produsele trebuie să fie complete; le poți examina ca într-un magazin, dar o piesă montată, etanșată cu bandă de filet sau deteriorată poate duce la o reținere pentru pierderea de valoare.'] },
      { h: '4. Rambursarea', p: ['Rambursăm prețul produselor și livrarea standard în 14 zile de la retragere, prin aceeași metodă de plată și fără costuri. Putem amâna rambursarea până primim produsele sau dovada expedierii lor.'] },
      { h: '5. Achiziții făcute de firme', p: ['Dreptul de retragere este doar pentru consumatori. Pentru o achiziție făcută de o firmă, scrie-ne: analizăm fiecare cerere de retur.'] },
      { h: '6. Produs defect sau neconform', p: ['Scrie-ne la contact@pipesan.eu cu numărul comenzii și fotografii. Reparăm, înlocuim sau rambursăm produsul fără costuri pentru tine, inclusiv returul.'] },
      { h: '7. Garanții legale', p: ['Consumatorii beneficiază de garanția legală de conformitate timp de 2 ani de la livrare (Directiva (UE) 2019/771, OUG 140/2021). Ai dreptul la reparare sau înlocuire gratuită într-un termen rezonabil; dacă nu e posibil, e refuzat, întârzie sau defectul persistă, la reducerea prețului sau la rambursarea integrală, cu returnarea produsului.'] },
      { h: '8. Formular-tip de retragere', p: ['Completează și trimite acest formular doar dacă dorești să te retragi din contract.'], box: [
        `Către ${TO}:`,
        'Vă informez/Vă informăm (*) prin prezenta cu privire la retragerea mea/noastră (*) din contractul de vânzare a următoarelor produse (*):',
        '— Comandat la data (*) / primit la data (*):\n— Numărul comenzii:\n— Numele consumatorului/consumatorilor:\n— Adresa consumatorului/consumatorilor:\n— Semnătura consumatorului/consumatorilor (doar dacă formularul este trimis pe hârtie):\n— Data:',
        '(*) Se elimină mențiunea inutilă.',
      ] },
    ],
  },
};
