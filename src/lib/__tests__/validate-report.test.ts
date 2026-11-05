import { LIMITS } from "@/constants/report-limits";
import {
  hasErrors,
  validateReport,
  type ReportDraft,
} from "@/lib/validate-report";

// Must match the OpenAPI limits, or the server rejects what the form allowed
describe("validateReport", () => {
  const valid: ReportDraft = {
    title: "Groapă în asfalt",
    description: "",
    categoryId: "roads",
    photos: [],
  };

  it("accepts a minimal valid report (description and photos are optional)", () => {
    expect(hasErrors(validateReport(valid))).toBe(false);
  });

  it("checks the title length after trimming spaces", () => {
    expect(validateReport({ ...valid, title: "  ab  " }).title?.key).toBe(
      "validation.titleTooShort",
    );
    expect(validateReport({ ...valid, title: "abc" }).title).toBeUndefined();
    expect(
      validateReport({ ...valid, title: "x".repeat(LIMITS.titleMax + 1) }).title
        ?.key,
    ).toBe("validation.titleTooLong");
  });

  it("limits the description length", () => {
    expect(
      validateReport({
        ...valid,
        description: "x".repeat(LIMITS.descriptionMax + 1),
      }).description?.key,
    ).toBe("validation.descriptionTooLong");
  });

  it("requires a category", () => {
    expect(
      validateReport({ ...valid, categoryId: undefined }).categoryId?.key,
    ).toBe("validation.categoryRequired");
  });

  it("enforces the photo count, file size and dimensions", () => {
    const photo = { size: 1_000, width: 1000, height: 800 };
    expect(
      validateReport({ ...valid, photos: [photo, photo, photo, photo] }).photos
        ?.key,
    ).toBe("validation.tooManyPhotos");
    expect(
      validateReport({
        ...valid,
        photos: [{ ...photo, size: LIMITS.maxFileBytes + 1 }],
      }).photos?.key,
    ).toBe("validation.photoTooLarge");
    expect(
      validateReport({
        ...valid,
        photos: [{ ...photo, width: LIMITS.maxPhotoSide + 1 }],
      }).photos?.key,
    ).toBe("validation.photoTooBig");
  });
});
