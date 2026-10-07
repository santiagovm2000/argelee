import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Service, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import {
  ADMIN_API,
  CSRF_HEADER_NAME,
  CSRF_HEADER_VALUE,
} from '@workers/shared/admin-api.constants';
import { SLIDE_EXTENSION, SLIDE_MIME_TYPE } from '@workers/shared/instagram.constants';
import type { InstagramStatus, PublishRequest } from '@workers/shared/instagram.model';
import { canvasBlob } from './post-download';
import { publishFailure, type PublishOutcome } from './post-publish';
import { SLIDE_JPEG_QUALITY } from './post.constants';

const UNREACHABLE: InstagramStatus = { state: 'unreachable', username: null };

/**
 * Sends a piece's slides to Instagram through the panel's Worker, which holds
 * the token. The slides are parked there only while Instagram fetches them.
 */
@Service()
export class PostPublishService {
  private readonly http = inject(HttpClient);

  readonly status = signal<InstagramStatus | null>(null);

  /** Asks whether the panel is connected to an account, and to which. */
  async check(): Promise<void> {
    this.status.set(null);
    try {
      this.status.set(await firstValueFrom(this.http.get<InstagramStatus>(ADMIN_API.instagram)));
    } catch {
      this.status.set(UNREACHABLE);
    }
  }

  /** Publishes the canvases, in order, as one carousel with the caption. */
  async publish(canvases: readonly HTMLCanvasElement[], caption: string): Promise<PublishOutcome> {
    const slides: string[] = [];
    try {
      for (const canvas of canvases) slides.push(await this.park(canvas));
    } catch {
      return { kind: 'offline', detail: null };
    }
    try {
      const order: PublishRequest = { slides, caption };
      await firstValueFrom(
        this.http.post(ADMIN_API.instagramPublish, order, {
          headers: { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE },
        }),
      );
      return { kind: 'published' };
    } catch (error) {
      return publishFailure(error instanceof HttpErrorResponse ? error.error : null);
    }
  }

  /** Uploads one canvas as a JPEG under a random name and returns that name. */
  private async park(canvas: HTMLCanvasElement): Promise<string> {
    const blob = await canvasBlob(canvas, SLIDE_MIME_TYPE, SLIDE_JPEG_QUALITY);
    if (blob === null) throw new Error('encode failed');
    const name = `${crypto.randomUUID()}${SLIDE_EXTENSION}`;
    await firstValueFrom(
      this.http.put(`${ADMIN_API.instagramSlides}${name}`, blob, {
        headers: { [CSRF_HEADER_NAME]: CSRF_HEADER_VALUE, 'Content-Type': SLIDE_MIME_TYPE },
      }),
    );
    return name;
  }
}
