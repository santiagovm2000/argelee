import {
  afterRenderEffect,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { REDUCED_MOTION_MEDIA_QUERY } from '../../core/theme/theme.constants';

const SLIDE_IN_VIEW_RATIO = 0.6;

/**
 * A strip of photos that snaps one at a time (`.gallery`, one child per photo).
 * It knows which photo is in view however it got there — a swipe, a trackpad,
 * the arrow keys — from an observer, so nothing listens to the scroll itself;
 * it glides to a photo when asked, and goes back to the cover whenever the
 * cover changes, as it can when the live menu replaces the one the page was
 * built with.
 */
@Directive({
  selector: '[argPhotoStrip]',
  exportAs: 'photoStrip',
})
export class PhotoStrip {
  /** The photos' keys in strip order, the cover first. */
  readonly keys = input.required<readonly string[]>({ alias: 'argPhotoStrip' });

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly inView = signal(0);
  private readonly cover = computed(() => this.keys()[0]);

  readonly current = this.inView.asReadonly();
  readonly count = computed(() => this.keys().length);

  constructor() {
    afterRenderEffect(() => {
      this.cover();
      this.element.nativeElement.scrollTo({ left: 0, behavior: 'instant' });
    });
    afterRenderEffect((onCleanup) => {
      this.keys();
      const strip = this.element.nativeElement;
      const slides: readonly Element[] = [...strip.children];
      if (slides.length <= 1) return;
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.intersectionRatio >= SLIDE_IN_VIEW_RATIO) {
              this.inView.set(slides.indexOf(entry.target));
            }
          }
        },
        { root: strip, threshold: SLIDE_IN_VIEW_RATIO },
      );
      for (const slide of slides) observer.observe(slide);
      onCleanup(() => {
        observer.disconnect();
      });
    });
  }

  /** Brings a photo into view; it glides there unless the visitor asked for less motion. */
  show(index: number): void {
    const strip = this.element.nativeElement;
    const target = Math.min(Math.max(index, 0), this.count() - 1);
    const reduced = strip.ownerDocument.defaultView?.matchMedia(REDUCED_MOTION_MEDIA_QUERY).matches;
    strip.scrollTo({
      left: target * strip.clientWidth,
      behavior: reduced === true ? 'instant' : 'smooth',
    });
  }

  /** One photo along, round in a circle: past the last comes the cover again, and before the cover the last. */
  step(direction: -1 | 1): void {
    const count = this.count();
    this.show((this.current() + direction + count) % count);
  }
}
