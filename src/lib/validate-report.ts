import { LIMITS } from "@/constants/report-limits";
import type { TranslateParams, TranslationKey } from "@/i18n";
import type { LocalPhoto } from "@/lib/photos";

export type ReportDraft = {
  title: string;
  description: string;
  categoryId?: string;
  photos: Pick<LocalPhoto, "size" | "width" | "height">[];
};

// Keys, not messages, so errors re-translate when the language changes
export type FieldError = { key: TranslationKey; params?: TranslateParams };

export type DraftErrors = Partial<
  Record<"title" | "description" | "categoryId" | "photos", FieldError>
>;

// Mirrors the server's limits. Anything that slips past here comes back as a
// VALIDATION_FAILED later, after the report has already left the form.
export function validateReport(d: ReportDraft): DraftErrors {
  const errors: DraftErrors = {};
  const title = d.title.trim();

  if (title.length < LIMITS.titleMin) {
    errors.title = {
      key: "validation.titleTooShort",
      params: { min: LIMITS.titleMin },
    };
  } else if (title.length > LIMITS.titleMax) {
    errors.title = {
      key: "validation.titleTooLong",
      params: { max: LIMITS.titleMax },
    };
  }

  if (d.description.trim().length > LIMITS.descriptionMax) {
    errors.description = {
      key: "validation.descriptionTooLong",
      params: { max: LIMITS.descriptionMax },
    };
  }

  if (!d.categoryId) errors.categoryId = { key: "validation.categoryRequired" };

  if (d.photos.length > LIMITS.maxPhotos) {
    errors.photos = {
      key: "validation.tooManyPhotos",
      params: { max: LIMITS.maxPhotos },
    };
  } else if (d.photos.some((p) => p.size > LIMITS.maxFileBytes)) {
    errors.photos = { key: "validation.photoTooLarge" };
  } else if (
    d.photos.some(
      (p) => p.width > LIMITS.maxPhotoSide || p.height > LIMITS.maxPhotoSide,
    )
  ) {
    errors.photos = {
      key: "validation.photoTooBig",
      params: { max: LIMITS.maxPhotoSide },
    };
  }

  return errors;
}

export const hasErrors = (e: DraftErrors) => Object.keys(e).length > 0;
