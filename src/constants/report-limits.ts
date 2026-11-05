// From the OpenAPI spec (CreateReportRequest, PhotoInput, /uploads)
export const LIMITS = {
  titleMin: 3,
  titleMax: 120,
  descriptionMax: 2000,
  maxPhotos: 3,
  maxFileBytes: 10 * 1024 * 1024,
  maxPhotoSide: 20000,
} as const;

// Our own choice, not the API's: big enough to read, small enough to upload
export const UPLOAD_MAX_SIDE = 2048;
