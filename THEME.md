# GrosBuschB2B Theme

This template uses **Tailwind CSS with class-based dark mode**. All colors are defined as custom tokens in `tailwind.config.js`. Change a color once there, and every component picks it up automatically.

---

## How Dark Mode Works

Dark mode is toggled by adding or removing the `dark` class on the `<html>` element. The `ThemeProvider` in `main_frontend/src/theme/ThemeProvider.tsx` manages this and persists the choice to `localStorage`.

```tsx
document.documentElement.classList.add('dark');    // enable dark mode
document.documentElement.classList.remove('dark'); // enable light mode
```

In Tailwind classes, prefix any utility with `dark:` to apply it only in dark mode:
```tsx
<div className="bg-surface dark:bg-surface-dark text-textPrimary dark:text-textPrimary-dark">
```

---

## Color Token Reference

All tokens are defined in `tailwind.config.js` (both `main_frontend` and `admin_frontend`).

### Brand

| Token | Hex | Usage |
|-------|-----|-------|
| `primary` | `#3B82F6` (blue-500) | Buttons, links, focus rings, icon backgrounds |
| `secondary` | `#6366F1` (indigo-500) | Accent, active states, nav highlight |

### Backgrounds

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `background` / `background-dark` | `#F8FAFC` | `#0F172A` | Page background |
| `surface` / `surface-dark` | `#FFFFFF` | `#1E293B` | Cards, panels, modals, dropdowns |
| `navbar` / `navbar-dark` | `#1D4ED8` | `#0F172A` | Navbar background |

### Borders

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `border` / `border-dark` | `#E2E8F0` | `#334155` | All element borders |
| `navbar-border-dark` | — | `#1E40AF` | Navbar bottom separator (dark mode only) |

### Text

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `textPrimary` / `textPrimary-dark` | `#0F172A` | `#F8FAFC` | Headings, body text |
| `textSecondary` / `textSecondary-dark` | `#64748B` | `#94A3B8` | Labels, captions, placeholders |

### Icon Surfaces

| Token | Dark value | Usage |
|-------|-----------|-------|
| `icon-dark` | `#334155` | Background for icon boxes in dark mode |

### Contrast Tokens

These are used on `bg-primary` / `bg-secondary` buttons to ensure readable text:

| Token | Value | Usage |
|-------|-------|-------|
| `primary-on-light` / `primary-on-dark` | `#FFFFFF` | Text on primary-colored backgrounds |
| `secondary-on-light` / `secondary-on-dark` | `#FFFFFF` | Text on secondary-colored backgrounds |

### Status Colors

| State | Light text | Light bg | Dark text | Dark bg |
|-------|-----------|----------|-----------|---------|
| Success | `#16a34a` | `#dcfce7` | `#4ade80` | `rgba(74,222,128,0.15)` |
| Error | `#dc2626` | `#fee2e2` | `#f87171` | `rgba(248,113,113,0.15)` |
| Warning | `#d97706` | `#fef3c7` | `#fbbf24` | `rgba(251,191,36,0.15)` |

---

## How to Change Colors

1. Open `main_frontend/tailwind.config.js`
2. Change the hex value for any token
3. Do the same in `admin_frontend/tailwind.config.js`
4. Every component that uses that token updates automatically

```js
// Example: swap to a green brand
primary: "#22C55E",            // green-500
secondary: "#16A34A",          // green-600
"background-dark": "#052E16",  // green-950
```

---

## Component Patterns

Use these patterns consistently when building new components.

### Button — Filled
```tsx
<button className="bg-secondary text-secondary-on-light rounded-lg font-semibold px-4 py-2 hover:opacity-90 transition-opacity">
  Action
</button>
```

### Button — Outline
```tsx
<button className="border border-secondary text-secondary rounded-lg font-semibold px-4 py-2 hover:bg-secondary/10 transition-colors">
  Action
</button>
```

### Text Input
```tsx
<input className="w-full px-3 py-2.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg text-sm text-textPrimary dark:text-textPrimary-dark focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary transition-colors" />
```

### Card / Panel
```tsx
<div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg shadow-sm p-6">
  {/* content */}
</div>
```

### Status Badge
```tsx
<span className="px-2 py-0.5 rounded-full text-xs font-medium bg-status-success-bg text-status-success dark:bg-status-success-bg-dark dark:text-status-success-dark">
  Active
</span>
```

---

## Typography

Font stack: Roboto → system UI → sans-serif (configured in `tailwind.config.js`).

| Role | Tailwind classes |
|------|-----------------|
| Page heading | `text-2xl font-bold` |
| Section heading | `text-lg font-semibold` |
| Body text | `text-sm` |
| Secondary / caption | `text-xs text-textSecondary dark:text-textSecondary-dark` |
| Overline label | `text-[11px] tracking-widest uppercase` |

---

## Shape

- **Default border radius**: `rounded-lg` = 8px (set in `tailwind.config.js`)
- **Pills / avatars**: `rounded-full` — use only for badges and avatar circles
- **Focus ring**: `focus:ring-2 focus:ring-secondary`
