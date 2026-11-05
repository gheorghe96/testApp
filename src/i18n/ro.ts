// Romanian is the reference: its keys define TranslationKey, and ru.ts must
// match them. `{name}` placeholders are filled by t(key, { name }).
export const ro = {
  // Common
  "common.tryAgain": "Încearcă din nou",
  "common.loading": "Se încarcă…",
  "common.close": "Închide",
  "common.cancel": "Anulează",
  "common.all": "Toate",
  "common.optional": "(opțional)",

  // Statuses
  "status.new": "Nou",
  "status.in_progress": "În lucru",
  "status.resolved": "Rezolvat",

  // List
  "list.title": "Sesizări",
  "list.filters": "Filtre",
  "list.filtersActive": "Filtre, {count} active",
  "list.settings": "Setări",
  "list.newReport": "Sesizare nouă",
  "list.empty": "Nu s-au găsit sesizări",
  "list.emptySearch": "Nicio sesizare pentru „{query}”",
  "list.loadMoreFailed": "Nu s-au putut încărca mai multe",
  "list.clearAll": "Șterge tot",
  "list.removeFilter": "Elimină filtrul {name}",
  "search.placeholder": "Caută sesizări",
  "search.clear": "Șterge căutarea",

  // Filters
  "filters.title": "Filtre",
  "filters.category": "Categorie",
  "filters.status": "Stare",
  "filters.reset": "Resetează",
  "filters.apply": "Aplică",
  "categories.loadFailed": "Categoriile nu s-au încărcat.",

  // Details
  "details.title": "Sesizare",
  "details.notFound": "Nu a fost găsită",
  "details.created": "Creată {date}",
  "details.updated": "Actualizată {date}",
  "details.openPhoto": "Deschide fotografia {index} din {total}",
  "details.back": "Sesizări",
  "photo.label": "Fotografia sesizării",
  "photo.close": "Închide fotografia",

  // New report
  "new.title": "Sesizare nouă",
  "new.fieldTitle": "Titlu",
  "new.fieldTitlePlaceholder": "Ex.: Nu arde felinarul lângă scara 2",
  "new.fieldDescription": "Descriere",
  "new.fieldDescriptionPlaceholder": "Ce s-a întâmplat, unde exact, de când",
  "new.fieldCategory": "Categorie",
  "new.fieldPhotos": "Fotografii",
  "new.send": "Trimite sesizarea",
  "new.discardTitle": "Renunți la sesizare?",
  "new.discardMessage": "Datele introduse se vor pierde.",
  "new.keepEditing": "Continuă editarea",
  "new.discard": "Renunță",

  // Photo picker
  "photos.camera": "Cameră",
  "photos.gallery": "Galerie",
  "photos.count": "Fotografii: {count} din {max} (opțional)",
  "photos.remove": "Elimină fotografia {index}",
  "photos.notAddedTitle": "Fotografia nu a fost adăugată",
  "photos.notAddedMessage": "Imaginea nu a putut fi citită.",
  "photos.cameraPermissionTitle": "Este nevoie de acces la cameră",
  "photos.cameraPermissionMessage":
    "Permite accesul la cameră în Setări pentru a face o fotografie.",
  "photos.cameraUnavailableTitle": "Camera nu este disponibilă",
  "photos.cameraUnavailableMessage": "Alege o fotografie din galerie.",

  // Form validation
  "validation.titleTooShort": "Introdu cel puțin {min} caractere.",
  "validation.titleTooLong": "Cel mult {max} caractere.",
  "validation.descriptionTooLong": "Cel mult {max} caractere.",
  "validation.categoryRequired": "Alege o categorie.",
  "validation.tooManyPhotos": "Cel mult {max} fotografii.",
  "validation.photoTooLarge":
    "Fiecare fotografie trebuie să aibă cel mult 10 MB.",
  "validation.photoTooBig":
    "Fotografiile pot avea cel mult {max} px pe latură.",

  // Outbox
  "outbox.sending": "Se trimite…",
  "outbox.waitingNetwork": "Se așteaptă rețeaua",
  "outbox.sendingSoon": "Se trimite în curând",
  "outbox.failed": "Netrimisă",
  "outbox.retry": "Reîncearcă",
  "outbox.cancel": "Anulează",
  "outbox.cancelTitle": "Anulezi sesizarea?",
  "outbox.cancelMessage": "Nu va fi trimisă.",
  "outbox.keep": "Păstrează",
  "outbox.cancelConfirm": "Anulează sesizarea",

  // Settings
  "settings.title": "Setări",
  "settings.language": "Limba",

  // The API only returns error codes, so the wording lives here
  "error.VALIDATION_FAILED": "Date incorecte: {fields}",
  "error.VALIDATION_FAILED_unknown": "Date incorecte.",
  "error.RATE_LIMITED": "Prea multe cereri. Așteaptă puțin.",
  "error.INTERNAL_ERROR": "Eroare de server. Încearcă din nou.",
  "error.SERVICE_UNAVAILABLE": "Serviciul este temporar indisponibil.",
  "error.REPORT_NOT_FOUND": "Această sesizare nu există sau a fost ștearsă.",
  "error.CATEGORY_NOT_FOUND": "Această categorie nu mai există. Alege alta.",
  "error.FILE_TOO_LARGE": "O fotografie depășește 10 MB.",
  "error.UNSUPPORTED_FILE_TYPE": "O fotografie nu este în format JPEG sau PNG.",
  "error.IDEMPOTENCY_KEY_REUSED":
    "Sesizarea a fost modificată după prima trimitere.",
  "error.NETWORK": "Nu există conexiune cu serverul.",
  "error.TIMEOUT": "Serverul răspunde prea încet.",
  "error.PHOTO_MISSING": "O fotografie a sesizării lipsește de pe dispozitiv.",
  "error.REQUEST_FAILED": "Cererea nu a putut fi trimisă.",
  "error.HTTP": "Cererea a eșuat (HTTP {status}).",
  "error.UNKNOWN": "Ceva nu a mers bine.",
} as const;

export type TranslationKey = keyof typeof ro;
