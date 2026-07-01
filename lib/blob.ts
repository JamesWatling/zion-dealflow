import { put } from "@vercel/blob";

// Store offer PDFs in Vercel Blob when configured; the caller falls back to
// base64-in-DB when BLOB_READ_WRITE_TOKEN is absent.
export function blobEnabled(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function uploadOfferPdf(id: string, buf: Buffer): Promise<string> {
  const { url } = await put(`offers/offer-${id}.pdf`, buf, {
    access: "public", // URL carries a random suffix → effectively unguessable
    token: process.env.BLOB_READ_WRITE_TOKEN,
    contentType: "application/pdf",
    addRandomSuffix: true,
  });
  return url;
}
