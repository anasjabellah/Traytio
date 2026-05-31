// src/app/api/upload/route.ts

import { NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await cloudinary.uploader.upload_stream(
      { folder: 'menu_items' },
      (error, result) => {
        if (error) throw error;
        return result;
      }
    );
    // Since uploader.upload_stream is callback based, instead use upload with buffer
    // Simpler: use cloudinary.uploader.upload with base64 data URL
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;
    const result = await cloudinary.uploader.upload(dataUri, { folder: 'menu_items' });
      console.log('Cloudinary upload result:', result);
    return NextResponse.json({ url: result.secure_url });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
