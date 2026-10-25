import { fetchLatestRelease } from "@/lib/releases";
import DownloadClient from "./download-client";

export const revalidate = 600;

export default async function DownloadPage() {
  const release = await fetchLatestRelease();
  return <DownloadClient release={release} />;
}
