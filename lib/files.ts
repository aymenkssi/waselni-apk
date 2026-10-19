import { UploadFile } from './types';

const MIMES: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', pdf: 'application/pdf', heic: 'image/heic' };

/** Upload descriptor for a picked file; the server checks the extension against the content type. */
export function toUploadFile(uri: string, name?: string | null, mime?: string | null): UploadFile {
  const fromUri = uri.split('?')[0].split('/').pop() || 'document';
  let fileName = (name || fromUri).replace(/[^\w.-]/g, '_');
  let ext = fileName.includes('.') ? fileName.split('.').pop()!.toLowerCase() : '';
  if (!MIMES[ext]) {
    const guessed = Object.entries(MIMES).find(([, m]) => m === mime)?.[0] ?? 'jpg';
    fileName = `${fileName.replace(/\.[^.]*$/, '')}.${guessed}`;
    ext = guessed;
  }
  return { uri, name: fileName, type: mime && Object.values(MIMES).includes(mime) ? mime : MIMES[ext] };
}

/** Absolute URL of a file served by the API (/api/uploads/...). */
export function fileUrl(siteUrl: string, path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${siteUrl}${path.startsWith('/') ? '' : '/'}${path}`;
}
