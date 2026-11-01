// Mesaje traduse pentru erorile de adăugare în coș (coduri setate în CartContext).
const MESSAGES = {
  unavailable: { fr: 'Ce produit n’est plus disponible.', en: 'This product is no longer available.', it: 'Questo prodotto non è più disponibile.', de: 'Dieses Produkt ist nicht mehr verfügbar.', es: 'Este producto ya no está disponible.', ro: 'Produsul nu mai este disponibil.' },
  stock: { fr: 'Quantité supérieure au stock disponible.', en: 'Requested quantity exceeds available stock.', it: 'Quantità superiore allo stock disponibile.', de: 'Die Menge übersteigt den verfügbaren Bestand.', es: 'La cantidad supera el stock disponible.', ro: 'Cantitatea depășește stocul disponibil.' },
  generic: { fr: 'Impossible d’ajouter au panier. Réessayez.', en: 'Could not add to cart. Please try again.', it: 'Impossibile aggiungere al carrello. Riprova.', de: 'Konnte nicht zum Warenkorb hinzugefügt werden. Bitte erneut versuchen.', es: 'No se pudo añadir al carrito. Inténtalo de nuevo.', ro: 'Nu am putut adăuga în coș. Încearcă din nou.' },
};

export function cartError(code, message) {
  const error = new Error(message || code);
  error.code = code;
  return error;
}

export function cartErrorMessage(error, lang = 'fr') {
  const key = MESSAGES[error?.code] ? error.code : 'generic';
  return MESSAGES[key][lang] || MESSAGES[key].fr;
}
