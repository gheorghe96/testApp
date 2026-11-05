import { UPLOAD_MAX_SIDE } from "@/constants/report-limits";
import * as Crypto from "expo-crypto";
import { Directory, File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import type { ImagePickerAsset } from "expo-image-picker";

/** Upload-ready copy in the app's own folder. */
export type LocalPhoto = {
  uri: string;
  width: number;
  height: number;
  size: number;
  mimeType: "image/jpeg";
};

// Documents, not cache: the OS may clear the cache, and an offline report
// can sit in the outbox for days
const outboxDir = () => {
  const dir = new Directory(Paths.document, "outbox");
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
};

// Always re-encode to JPEG: iPhones hand us HEIC, which the API rejects.
// Resizing keeps uploads well under the 10 MB limit and quick on bad networks.
export async function preparePhoto(
  asset: ImagePickerAsset,
): Promise<LocalPhoto> {
  const ctx = ImageManipulator.manipulate(asset.uri);
  const longest = Math.max(asset.width, asset.height);
  if (longest > UPLOAD_MAX_SIDE) {
    ctx.resize(
      asset.width >= asset.height
        ? { width: UPLOAD_MAX_SIDE }
        : { height: UPLOAD_MAX_SIDE },
    );
  }
  const image = await ctx.renderAsync();
  const result = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: 0.8,
  });

  const target = new File(outboxDir(), `${Crypto.randomUUID()}.jpg`);
  await new File(result.uri).copy(target);

  return {
    uri: target.uri,
    width: result.width,
    height: result.height,
    size: target.size,
    mimeType: "image/jpeg",
  };
}

export const photoFileExists = (uri: string) => new File(uri).exists;

export function deletePhotos(photos: { uri: string }[]) {
  for (const p of photos) {
    try {
      const f = new File(p.uri);
      if (f.exists) f.delete();
    } catch {
      // A leftover file is harmless
    }
  }
}
