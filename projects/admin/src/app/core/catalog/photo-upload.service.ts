import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PHOTO_KEY_PREFIX } from '@core/catalog/catalog.constants';
import type { ProductPhoto } from '@core/catalog/catalog.model';
import {
  ADMIN_API,
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
} from '@workers/shared/admin-api.constants';
import {
  PHOTO_EXTENSION,
  PHOTO_JPEG_QUALITY,
  PHOTO_MAX_EDGE,
  PHOTO_MIME_TYPE,
  PHOTO_PLACEHOLDER_QUALITY,
  PHOTO_PLACEHOLDER_WIDTH,
  PLACEHOLDER_MIME_TYPE,
} from '../config/admin.constants';

interface PreparedPhoto {
  readonly blob: Blob;
  readonly photo: ProductPhoto;
}

function drawScaled(bitmap: ImageBitmap, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (context === null) throw new Error('canvas unavailable');
  context.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob === null) reject(new Error('encode failed'));
        else resolve(blob);
      },
      type,
      quality,
    );
  });
}

const HEX_RADIX = 16;
const HEX_DIGITS_PER_BYTE = 2;

async function sha256Hex(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(HEX_RADIX).padStart(HEX_DIGITS_PER_BYTE, '0'))
    .join('');
}

/** Turns a picked file into what the catalogue stores and what R2 receives, entirely in the browser. */
@Service()
export class PhotoUploadService {
  private readonly http = inject(HttpClient);

  /** Downscales, re-encodes as JPEG, hashes, and draws the blur placeholder. */
  async prepare(file: File): Promise<PreparedPhoto> {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, PHOTO_MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const full = drawScaled(bitmap, width, height);
    const placeholderHeight = Math.max(1, Math.round((height / width) * PHOTO_PLACEHOLDER_WIDTH));
    const tiny = drawScaled(bitmap, PHOTO_PLACEHOLDER_WIDTH, placeholderHeight);
    bitmap.close();

    const blob = await toBlob(full, PHOTO_MIME_TYPE, PHOTO_JPEG_QUALITY);
    const placeholder = tiny.toDataURL(PLACEHOLDER_MIME_TYPE, PHOTO_PLACEHOLDER_QUALITY);
    const key = `${PHOTO_KEY_PREFIX}${await sha256Hex(blob)}${PHOTO_EXTENSION}`;
    return { blob, photo: { key, width, height, placeholder } };
  }

  /** Stores the bytes under their content-addressed key; the same photo twice is one object. */
  async upload(prepared: PreparedPhoto): Promise<ProductPhoto> {
    const path = `${ADMIN_API.photos}${prepared.photo.key.slice(PHOTO_KEY_PREFIX.length)}`;
    await firstValueFrom(
      this.http.put(path, prepared.blob, {
        headers: { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE, 'Content-Type': PHOTO_MIME_TYPE },
      }),
    );
    return prepared.photo;
  }
}
