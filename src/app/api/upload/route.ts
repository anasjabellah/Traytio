// src/app/api/upload/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import cloudinary from '@/lib/cloudinary';
import { getOrganizationId } from '@/lib/get-organization-id';
import { withApiGuard } from '@/lib/api-guard';
import { readBodyWithLimit } from '@/lib/request-body-limit';
import { AUTH } from '@/lib/notify/messages';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.msi',
  '.zip', '.rar', '.7z', '.tar', '.gz',
  '.js', '.ts', '.jsx', '.tsx', '.vue',
  '.sh', '.bash', '.zsh', '.fish',
  '.php', '.py', '.rb', '.pl', '.pm',
  '.dll', '.so', '.dylib', '.bin',
  '.html', '.htm', '.svg', '.xml',
];

const MAX_SIZE_IMAGES = 10 * 1024 * 1024;  // 10 MB
const MAX_SIZE_PDF = 20 * 1024 * 1024;     // 20 MB

function hasBlockedExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return BLOCKED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

async function uploadApi(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: AUTH.SESSION.UNAUTHORIZED }, { status: 401 });
    }

    const organizationId = await getOrganizationId();
    if (!organizationId) {
      return NextResponse.json({ error: AUTH.ORGANIZATION_NOT_FOUND }, { status: 403 });
    }

    // Early rejection optimization: if the client declares an oversized body,
    // reject it without reading any bytes. This is NOT the authoritative
    // limit — Content-Length is client-controlled (it can be forged small or
    // omitted entirely via chunked transfer).
    const declaredLength = Number(request.headers.get("content-length") || 0);
    const MAX_REQUEST_BYTES = 25 * 1024 * 1024;
    if (declaredLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ error: "Fichier trop volumineux" }, { status: 413 });
    }

    // Authoritative limit: read the raw body stream and count ACTUAL bytes,
    // aborting at MAX_REQUEST_BYTES. An oversized body is never fully buffered
    // (request.formData() alone would buffer the whole multipart body first).
    const boundedBody = await readBodyWithLimit(request.body, MAX_REQUEST_BYTES);
    if (!boundedBody.ok) {
      return NextResponse.json({ error: "Fichier trop volumineux" }, { status: 413 });
    }

    // The bounded bytes are re-injected into a fresh Request so the built-in
    // multipart parser can be reused. Its body is already capped, so parsing
    // cannot buffer more than MAX_REQUEST_BYTES.
    const boundedHeaders = new Headers(request.headers);
    boundedHeaders.delete("content-length");
    const boundedRequest = new Request(request.url, {
      method: request.method,
      headers: boundedHeaders,
      body: boundedBody.data,
    });
    const formData = await boundedRequest.formData();
    const file = formData.get('file') as Blob | null;
    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Type de fichier non autorisé : ${file.type}. Formats acceptés : JPEG, PNG, WebP, PDF` },
        { status: 400 },
      );
    }

    if (file.type === 'application/pdf' && file.size > MAX_SIZE_PDF) {
      return NextResponse.json(
        { error: `Le fichier PDF dépasse la limite de ${MAX_SIZE_PDF / 1024 / 1024} MB` },
        { status: 400 },
      );
    }

    if (file.type.startsWith('image/') && file.size > MAX_SIZE_IMAGES) {
      return NextResponse.json(
        { error: `L'image dépasse la limite de ${MAX_SIZE_IMAGES / 1024 / 1024} MB` },
        { status: 400 },
      );
    }

    const fileName = formData.get('name') as string | null;
    if (fileName && hasBlockedExtension(fileName)) {
      return NextResponse.json(
        { error: 'Extension de fichier non autorisée' },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;
    const folder = `organizations/${organizationId}/uploads`;
    const result = await cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: 'auto',
    });
    return NextResponse.json({ url: result.secure_url });
  } catch {
    return NextResponse.json({ error: 'Erreur lors du téléchargement' }, { status: 500 });
  }
}

export const POST = withApiGuard(uploadApi);
