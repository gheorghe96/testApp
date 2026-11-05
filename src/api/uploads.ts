import { File } from "expo-file-system";

import { requestJson } from "./client";

/** Goes into POST /reports unchanged. */
export type UploadedPhoto = {
  url: string;
  width: number;
  height: number;
};

export function uploadPhoto(
  localUri: string,
  signal?: AbortSignal,
): Promise<UploadedPhoto> {
  const form = new FormData();
  // Has to be an expo-file-system File. The global fetch here is Expo's, and
  // it rejects RN's usual { uri, name, type } part with "Unsupported
  // FormDataPart implementation". Name and type come from the .jpg filename.
  form.append("file", new File(localUri) as unknown as Blob);

  return requestJson<UploadedPhoto>("/uploads", {
    method: "POST",
    body: form,
    signal,
    timeoutMs: 60_000,
  });
}
