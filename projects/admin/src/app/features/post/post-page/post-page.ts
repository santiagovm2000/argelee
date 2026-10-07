import { NgOptimizedImage } from '@angular/common';
import {
  Component,
  computed,
  effect,
  type ElementRef,
  inject,
  input,
  linkedSignal,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import type { ProductPhoto } from '@core/catalog/catalog.model';
import { localizedText } from '@core/catalog/localized-text';
import { SITE } from '@core/config/app.constants';
import { DEPLOYMENT } from '@core/config/build-config.generated';
import { DEFAULT_LANGUAGE } from '@core/i18n/i18n.constants';
import { CAPTION_MAX_HASHTAGS, CAPTION_MAX_LENGTH } from '@workers/shared/instagram.constants';
import { AdminCatalogService } from '../../../core/catalog/admin-catalog.service';
import { ADMIN_ROUTES } from '../../../core/config/admin.constants';
import { T, type TranslationKey } from '../../../core/i18n/translation-keys.generated';
import { PostArtService } from '../../../core/post/post-art.service';
import { downloadCanvas } from '../../../core/post/post-download';
import { paintAboutSlide, paintPieceSlide } from '../../../core/post/post-painter';
import {
  hashtagCount,
  type PublishOutcome,
  type PublishTrouble,
} from '../../../core/post/post-publish';
import { PostPublishService } from '../../../core/post/post-publish.service';
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
import { ConfirmService } from '../../../core/ui/confirm.service';
import { ToastService } from '../../../core/ui/toast.service';

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
const TROUBLE_KEYS: Readonly<Record<PublishTrouble, TranslationKey>> = {
  rejected: T.post.publish.failed.rejected,
  uncertain: T.post.publish.failed.uncertain,
  slow: T.post.publish.failed.slow,
  offline: T.post.publish.failed.offline,
};
const PERCENT = 100;
const SWATCH_SHAPE = 'block size-8 rounded-full';

/**
 * The Instagram publication of one piece: its two slides painted live from the
 * piece's own photo and words, with the photo, its framing and the backdrop left
 * to the owner, and a download for each slide. Nothing is saved anywhere: a
 * publication sent to Instagram passes through the Worker and is removed there.
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
  private readonly publisher = inject(PostPublishService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly transloco = inject(TranslocoService);
  private readonly pieceCanvas = viewChild<Canvas>('pieceCanvas');
  private readonly aboutCanvas = viewChild<Canvas>('aboutCanvas');

  protected readonly t = T;
  protected readonly size = POST_SIZE;
  protected readonly zoomRange = ZOOM;
  protected readonly captionLimit = CAPTION_MAX_LENGTH;
  protected readonly tagLimit = CAPTION_MAX_HASHTAGS;
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

  protected readonly instagram = this.publisher.status;
  protected readonly account = computed(() => this.instagram()?.username ?? '');
  private readonly suggestion = computed(() => {
    const content = this.content();
    return content === null
      ? ''
      : this.transloco.translate(T.post.publish.suggestion, { ...content });
  });
  protected readonly caption = linkedSignal(() => this.suggestion());
  protected readonly captionEdited = computed(() => this.caption() !== this.suggestion());
  protected readonly captionFits = computed(() => this.caption().length <= CAPTION_MAX_LENGTH);
  protected readonly tagCount = computed(() => hashtagCount(this.caption()));
  protected readonly tagsFit = computed(() => this.tagCount() <= CAPTION_MAX_HASHTAGS);
  protected readonly sending = signal(false);
  private readonly outcome = linkedSignal<string, PublishOutcome | null>({
    source: this.id,
    computation: () => null,
  });
  protected readonly published = computed(() => this.outcome()?.kind === 'published');
  protected readonly trouble = computed(() => {
    const outcome = this.outcome();
    if (outcome === null || outcome.kind === 'published') return null;
    return { key: TROUBLE_KEYS[outcome.kind], detail: outcome.detail };
  });
  protected readonly publishable = computed(
    () =>
      this.ready() && this.instagram()?.state === 'ready' && this.captionFits() && !this.sending(),
  );

  constructor() {
    if (!this.loaded()) void this.catalog.load();
    void this.publisher.check();
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

  protected setCaption(event: Event): void {
    if (event.target instanceof HTMLTextAreaElement) this.caption.set(event.target.value);
  }

  protected restoreCaption(): void {
    this.caption.set(this.suggestion());
  }

  protected recheck(): void {
    void this.publisher.check();
  }

  /** Asks once, then sends both slides and the caption; a post cannot be taken back from here. */
  protected async publish(): Promise<void> {
    const piece = this.pieceCanvas()?.nativeElement;
    const about = this.aboutCanvas()?.nativeElement;
    if (piece === undefined || about === undefined || !this.publishable()) return;
    const agreed = await this.confirm.ask({
      titleKey: T.post.publish.confirmTitle,
      bodyKey: T.post.publish.confirmBody,
      confirmKey: T.post.publish.confirm,
      params: { account: this.account() },
    });
    if (!agreed) return;
    this.sending.set(true);
    this.outcome.set(null);
    try {
      const outcome = await this.publisher.publish([piece, about], this.caption());
      this.outcome.set(outcome);
      if (outcome.kind === 'published') {
        this.toast.show({ key: T.post.publish.published, params: { account: this.account() } });
      }
    } finally {
      this.sending.set(false);
    }
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
