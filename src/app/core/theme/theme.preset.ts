import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

// PrimeNG tokens bound to the CSS variables in src/styles, so PrimeNG and
// Tailwind resolve the same colours. See docs/ARCHITECTURE.md.
export const ThemePreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: '0.25rem',
      sm: '0.375rem',
      md: 'var(--radius-control)',
      lg: 'var(--radius-card)',
      xl: 'var(--radius-panel)',
    },
  },
  semantic: {
    primary: {
      50: 'var(--color-brand-50)',
      100: 'var(--color-brand-100)',
      200: 'var(--color-brand-200)',
      300: 'var(--color-brand-300)',
      400: 'var(--color-brand-400)',
      500: 'var(--color-brand-500)',
      600: 'var(--color-brand-600)',
      700: 'var(--color-brand-700)',
      800: 'var(--color-brand-800)',
      900: 'var(--color-brand-900)',
      950: 'var(--color-brand-950)',
    },
    transitionDuration: 'var(--duration-quick)',
    focusRing: {
      width: '2px',
      style: 'solid',
      color: 'var(--color-focus-ring)',
      offset: '2px',
    },
    colorScheme: {
      light: {
        primary: {
          color: 'var(--color-accent)',
          contrastColor: 'var(--color-accent-ink)',
          hoverColor: 'var(--color-accent-hover)',
          activeColor: 'var(--color-accent-hover)',
        },
        surface: {
          0: 'var(--color-surface)',
          50: 'var(--color-neutral-50)',
          100: 'var(--color-neutral-100)',
          200: 'var(--color-neutral-200)',
          300: 'var(--color-neutral-300)',
          400: 'var(--color-neutral-400)',
          500: 'var(--color-neutral-500)',
          600: 'var(--color-neutral-600)',
          700: 'var(--color-neutral-700)',
          800: 'var(--color-neutral-800)',
          900: 'var(--color-neutral-900)',
          950: 'var(--color-neutral-950)',
        },
        content: {
          background: 'var(--color-surface-raised)',
          borderColor: 'var(--color-line)',
          color: 'var(--color-ink)',
        },
        text: {
          color: 'var(--color-ink)',
          mutedColor: 'var(--color-ink-muted)',
        },
        formField: {
          background: 'var(--color-surface)',
          borderColor: 'var(--color-line-strong)',
          color: 'var(--color-ink)',
          placeholderColor: 'var(--color-ink-subtle)',
        },
      },
      dark: {
        primary: {
          color: 'var(--color-accent)',
          contrastColor: 'var(--color-accent-ink)',
          hoverColor: 'var(--color-accent-hover)',
          activeColor: 'var(--color-accent-hover)',
        },
        surface: {
          0: 'var(--color-surface)',
          50: 'var(--color-neutral-900)',
          100: 'var(--color-neutral-800)',
          200: 'var(--color-neutral-700)',
          300: 'var(--color-neutral-600)',
          400: 'var(--color-neutral-500)',
          500: 'var(--color-neutral-400)',
          600: 'var(--color-neutral-300)',
          700: 'var(--color-neutral-200)',
          800: 'var(--color-neutral-100)',
          900: 'var(--color-neutral-50)',
          950: 'var(--color-neutral-0)',
        },
        content: {
          background: 'var(--color-surface-raised)',
          borderColor: 'var(--color-line)',
          color: 'var(--color-ink)',
        },
        text: {
          color: 'var(--color-ink)',
          mutedColor: 'var(--color-ink-muted)',
        },
        formField: {
          background: 'var(--color-surface-raised)',
          borderColor: 'var(--color-line-strong)',
          color: 'var(--color-ink)',
          placeholderColor: 'var(--color-ink-subtle)',
        },
      },
    },
  },
});
