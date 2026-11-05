import { photoUrl, type Report } from "@/api/reports";
import { Image } from "expo-image";

// No thumbnails on the server, so list photos are full-size. Kick off the
// downloads for a page's cover photos as soon as the page arrives; by the
// time the cards scroll in, most are already on disk.
export function prefetchCoverPhotos(reports: Report[]) {
  const urls = reports
    .map((r) => r.photos[0]?.url)
    .filter((u): u is string => !!u)
    .map(photoUrl);
  if (urls.length === 0) return;
  // If it fails, the card just loads the photo itself
  Image.prefetch(urls, "disk").catch(() => {});
}
