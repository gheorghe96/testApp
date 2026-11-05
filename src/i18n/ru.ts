import type { TranslationKey } from "./ro";

// Typed against ro.ts, so a missing key is a compile error
export const ru: Record<TranslationKey, string> = {
  // Common
  "common.tryAgain": "Повторить",
  "common.loading": "Загрузка…",
  "common.close": "Закрыть",
  "common.cancel": "Отмена",
  "common.all": "Все",
  "common.optional": "(необязательно)",

  // Statuses
  "status.new": "Новое",
  "status.in_progress": "В работе",
  "status.resolved": "Решено",

  // List
  "list.title": "Обращения",
  "list.filters": "Фильтры",
  "list.filtersActive": "Фильтры, активных: {count}",
  "list.settings": "Настройки",
  "list.newReport": "Новое обращение",
  "list.empty": "Обращения не найдены",
  "list.emptySearch": "Нет обращений по запросу «{query}»",
  "list.loadMoreFailed": "Не удалось загрузить ещё",
  "list.clearAll": "Сбросить всё",
  "list.removeFilter": "Убрать фильтр {name}",
  "search.placeholder": "Поиск обращений",
  "search.clear": "Очистить поиск",

  // Filters
  "filters.title": "Фильтры",
  "filters.category": "Категория",
  "filters.status": "Статус",
  "filters.reset": "Сбросить",
  "filters.apply": "Применить",
  "categories.loadFailed": "Не удалось загрузить категории.",

  // Details
  "details.title": "Обращение",
  "details.notFound": "Не найдено",
  "details.created": "Создано {date}",
  "details.updated": "Обновлено {date}",
  "details.openPhoto": "Открыть фото {index} из {total}",
  "details.back": "Обращения",
  "photo.label": "Фото обращения",
  "photo.close": "Закрыть фото",

  // New report
  "new.title": "Новое обращение",
  "new.fieldTitle": "Заголовок",
  "new.fieldTitlePlaceholder": "Напр.: Не горит фонарь у второго подъезда",
  "new.fieldDescription": "Описание",
  "new.fieldDescriptionPlaceholder":
    "Что случилось, где именно, с какого времени",
  "new.fieldCategory": "Категория",
  "new.fieldPhotos": "Фото",
  "new.send": "Отправить обращение",
  "new.discardTitle": "Отменить обращение?",
  "new.discardMessage": "Введённые данные будут потеряны.",
  "new.keepEditing": "Продолжить",
  "new.discard": "Отменить",

  // Photo picker
  "photos.camera": "Камера",
  "photos.gallery": "Галерея",
  "photos.count": "Фото: {count} из {max} (необязательно)",
  "photos.remove": "Удалить фото {index}",
  "photos.notAddedTitle": "Фото не добавлено",
  "photos.notAddedMessage": "Не удалось прочитать изображение.",
  "photos.cameraPermissionTitle": "Нужен доступ к камере",
  "photos.cameraPermissionMessage":
    "Разрешите доступ к камере в Настройках, чтобы сделать фото.",
  "photos.cameraUnavailableTitle": "Камера недоступна",
  "photos.cameraUnavailableMessage": "Выберите фото из галереи.",

  // Form validation
  "validation.titleTooShort": "Введите не менее {min} символов.",
  "validation.titleTooLong": "Не более {max} символов.",
  "validation.descriptionTooLong": "Не более {max} символов.",
  "validation.categoryRequired": "Выберите категорию.",
  "validation.tooManyPhotos": "Не более {max} фото.",
  "validation.photoTooLarge": "Каждое фото должно быть не больше 10 МБ.",
  "validation.photoTooBig": "Фото может быть не больше {max} px по стороне.",

  // Outbox
  "outbox.sending": "Отправляется…",
  "outbox.waitingNetwork": "Ожидание сети",
  "outbox.sendingSoon": "Скоро отправится",
  "outbox.failed": "Не отправлено",
  "outbox.retry": "Повторить",
  "outbox.cancel": "Отменить",
  "outbox.cancelTitle": "Отменить обращение?",
  "outbox.cancelMessage": "Оно не будет отправлено.",
  "outbox.keep": "Оставить",
  "outbox.cancelConfirm": "Отменить обращение",

  // Settings
  "settings.title": "Настройки",
  "settings.language": "Язык",

  // The API only returns error codes, so the wording lives here
  "error.VALIDATION_FAILED": "Неверные данные: {fields}",
  "error.VALIDATION_FAILED_unknown": "Неверные данные.",
  "error.RATE_LIMITED": "Слишком много запросов. Подождите немного.",
  "error.INTERNAL_ERROR": "Ошибка сервера. Попробуйте ещё раз.",
  "error.SERVICE_UNAVAILABLE": "Сервис временно недоступен.",
  "error.REPORT_NOT_FOUND": "Это обращение не существует или было удалено.",
  "error.CATEGORY_NOT_FOUND":
    "Эта категория больше не существует. Выберите другую.",
  "error.FILE_TOO_LARGE": "Одно из фото больше 10 МБ.",
  "error.UNSUPPORTED_FILE_TYPE": "Одно из фото не в формате JPEG или PNG.",
  "error.IDEMPOTENCY_KEY_REUSED": "Обращение изменилось после первой отправки.",
  "error.NETWORK": "Нет связи с сервером.",
  "error.TIMEOUT": "Сервер отвечает слишком долго.",
  "error.PHOTO_MISSING": "Фото обращения пропало с устройства.",
  "error.REQUEST_FAILED": "Не удалось отправить запрос.",
  "error.HTTP": "Ошибка запроса (HTTP {status}).",
  "error.UNKNOWN": "Что-то пошло не так.",
};
