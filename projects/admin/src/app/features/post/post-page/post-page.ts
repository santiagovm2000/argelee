import { NgOptimizedImage } from '@angular/common';
import {
  Component,
  computed,
  effect,
  type ElementRef,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import type { ProductPhoto } from '@core/catalog/catalog.model';
import { localizedText } from '@core/catalog/localized-text';
import { SITE } from '@core/config/app.constants';
import { DEPLOYMENT } from '@core/config/build-config.generated';
import { DEFAULT_LANGUAGE } from '@core/i18n/i18n.constants';
import { AdminCatalogService } from '../../../core/catalog/admin-catalog.service';
import { ADMIN_ROUTES } from '../../../core/config/admin.constants';
import { T, type TranslationKey } from '../../../core/i18n/translation-keys.generated';
import { PostArtService } from '../../../core/post/post-art.service';
import { downloadCanvas } from '../../../core/post/post-download';
import { paintAboutSlide, paintPieceSlide } from '../../../core/post/post-painter';
import { clampFraming, fileSlug, localPhone, nudgedFraming } from '../../../core/post/post-text';
import {
  DEFAULT_BACKDROP,
  DEFAULT_CUSTOM_BACKDROP,
  DEFAULT_FRAMING,
  LID,
  NUDGE_STEP,
  POST_BACKDROPS,
  POST_FILE_EXTENSION,
  POST_SIZE,
  type PostBackdropId,
  ZOOM,
} from '../../../core/post/post.constants';
import type { PhotoFraming, PostArt, PostContent } from '../../../core/post/post.model';

type Canvas = ElementRef<HTMLCanvasElement>;
type Slide = 'piece' | 'about';

interface Grip {
  readonly pointer: number;
  readonly x: number;
  readonly y: number;
}

const BACKDROP_LABELS: Readonly<Record<PostBackdropId, TranslationKey>> = {
  mango: T.post.backdrops.mango,
  coral: T.post.backdrops.coral,
  crystal: T.post.backdrops.crystal,
  turquoise: T.post.backdrops.turquoise,
  mint: T.post.backdrops.mint,
};
const SLIDE_SUFFIX: Readonly<Record<Slide, string>> = { piece: '-1', about: '-2' };
const PERCENT = 100;
const SWATCH_SHAPE = 'block size-8 rounded-full';

/**
 * The Instagram publication of one piece: its two slides painted live from the
 * piece's own photo and words, with the photo, its framing and the backdrop left
 * to the owner, and a download for each slide. Nothing is saved anywhere.
 */
@Component({
  selector: 'arg-post-page',
  imports: [TranslocoDirective, RouterLink, NgOptimizedImage],
  templateUrl: './post-page.html',
  host: { class: 'block' },
})
export class PostPage {
  readonly id = input.required<string>();

  private readonly catalog = inject(AdminCatalogService);
  private readonly artist = inject(PostArtService);
  private readonly pieceCanvas = viewChild<Canvas>('pieceCanvas');
  private readonly aboutCanvas = viewChild<Canvas>('aboutCanvas');

  protected readonly t = T;
  protected readonly size = POST_SIZE;
  protected readonly zoomRange = ZOOM;
  protected readonly backdrops = POST_BACKDROPS.map((option) => ({
    ...option,
    labelKey: BACKDROP_LABELS[option.id],
    swatchClass: `${SWATCH_SHAPE} ${option.swatch}`,
  }));

  protected readonly loaded = this.catalog.loaded;
  protected readonly product = computed(() =>
    this.loaded() ? this.catalog.find(this.id()) : null,
  );
  protected readonly editLink = computed(() => ['/', ADMIN_ROUTES.product, this.id()]);
  protected readonly photos = computed<readonly ProductPhoto[]>(() => this.product()?.photos ?? []);
  private readonly chosenKey = signal<string | null>(null);
  protected readonly photo = computed<ProductPhoto | null>(
    () => this.photos().find((item) => item.key === this.chosenKey()) ?? this.photos()[0] ?? null,
  );
  private readonly content = computed<PostContent | null>(() => {
    const product = this.product();
    if (product === null) return null;
    const text = localizedText(product.text, DEFAULT_LANGUAGE);
    return {
      name: text.name,
      description: text.description,
      phone: localPhone(SITE.whatsappNumber),
      site: new URL(DEPLOYMENT.origin).host,
    };
  });

  protected readonly name = computed(() => this.content()?.name ?? '');

  protected readonly framing = signal<PhotoFraming>(DEFAULT_FRAMING);
  protected readonly zoomPercent = computed(() => Math.round(this.framing().zoom * PERCENT));
  protected readonly backdrop = signal<string>(DEFAULT_BACKDROP);
  protected readonly customColour = signal<string>(DEFAULT_CUSTOM_BACKDROP);
  protected readonly custom = computed(
    () => !POST_BACKDROPS.some((option) => option.colour === this.backdrop()),
  );
  protected readonly failed = signal(false);
  private readonly art = signal<PostArt | null>(null);
  private readonly bitmap = signal<ImageBitmap | null>(null);
  protected readonly ready = computed(() => this.art() !== null && this.bitmap() !== null);
  private grip: Grip | null = null;

  constructor() {
    if (!this.loaded()) void this.catalog.load();
    void this.artist.load().then(
      (art) => {
        this.art.set(art);
      },
      () => {
        this.failed.set(true);
      },
    );

    effect(() => {
      const photo = this.photo();
      untracked(() => {
        this.bitmap.set(null);
        this.framing.set(DEFAULT_FRAMING);
        if (photo !== null) void this.decode(photo.key);
      });
    });

    effect(() => {
      const art = this.art();
      const photo = this.bitmap();
      const content = this.content();
      const piece = this.pieceCanvas()?.nativeElement.getContext('2d');
      const about = this.aboutCanvas()?.nativeElement.getContext('2d');
      if (art === null || photo === null || content === null) return;
      if (piece === null || piece === undefined || about === null || about === undefined) return;
      const scene = { art, photo, content, backdrop: this.backdrop(), framing: this.framing() };
      paintPieceSlide(piece, scene);
      paintAboutSlide(about, scene);
    });
  }

  protected choose(photo: ProductPhoto): void {
    this.chosenKey.set(photo.key);
  }

  protected setBackdrop(colour: string): void {
    this.backdrop.set(colour);
  }

  protected pickBackdrop(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.customColour.set(event.target.value);
    this.backdrop.set(event.target.value);
  }

  protected setZoom(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    const zoom = event.target.valueAsNumber;
    this.framing.update((framing) => clampFraming({ ...framing, zoom }));
  }

  protected centre(): void {
    this.framing.set(DEFAULT_FRAMING);
  }

  protected grab(event: PointerEvent): void {
    if (!(event.currentTarget instanceof HTMLCanvasElement)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    this.grip = { pointer: event.pointerId, x: event.clientX, y: event.clientY };
  }

  /** Moves the photo with the pointer, at the scale the canvas is shown at. */
  protected drag(event: PointerEvent): void {
    const grip = this.grip;
    if (grip?.pointer !== event.pointerId) return;
    if (!(event.currentTarget instanceof HTMLCanvasElement)) return;
    const shown = event.currentTarget.getBoundingClientRect().width;
    const scale = shown > 0 ? POST_SIZE.width / shown : 1;
    this.nudge((event.clientX - grip.x) * scale, (event.clientY - grip.y) * scale);
    this.grip = { pointer: grip.pointer, x: event.clientX, y: event.clientY };
  }

  protected release(event: PointerEvent): void {
    if (this.grip?.pointer === event.pointerId) this.grip = null;
  }

  /** Arrow keys on the first slide move the photo one step, for anyone who cannot drag. */
  protected step(event: Event, x: -1 | 0 | 1, y: -1 | 0 | 1): void {
    event.preventDefault();
    this.framing.update((framing) =>
      clampFraming({
        ...framing,
        x: framing.x + x * NUDGE_STEP,
        y: framing.y + y * NUDGE_STEP,
      }),
    );
  }

  protected async download(slide: Slide): Promise<void> {
    const canvas = (slide === 'piece' ? this.pieceCanvas() : this.aboutCanvas())?.nativeElement;
    if (canvas === undefined || !this.ready()) return;
    const saved = await downloadCanvas(
      canvas,
      `${fileSlug(this.name())}${SLIDE_SUFFIX[slide]}${POST_FILE_EXTENSION}`,
    );
    if (!saved) this.failed.set(true);
  }

  private nudge(dx: number, dy: number): void {
    const photo = this.bitmap();
    if (photo === null) return;
    this.framing.update((framing) => nudgedFraming(framing, photo, LID.diameter, dx, dy));
  }

  private async decode(key: string): Promise<void> {
    try {
      const bitmap = await this.artist.photo(key);
      if (this.photo()?.key === key) this.bitmap.set(bitmap);
    } catch {
      this.failed.set(true);
    }
  }
}
