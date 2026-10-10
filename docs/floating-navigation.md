# Floating acrylic navigation

The header uses a floating outer capsule, a segmented navigation track, and a moving pill for the current destination. Search, theme controls, and the mobile menu retain their existing behavior. The header stays available while scrolling; the mobile menu replaces desktop links below 1024px.

## Design references

- [hasib41/liquid-glass-nav](https://github.com/hasib41/liquid-glass-nav) (MIT): floating segmented capsule, selection indicator, focus visibility, and reduced-motion treatment.
- [mikonyaa/LiquidGlassTabBars](https://github.com/mikonyaa/LiquidGlassTabBars) (MIT): floating tab layout, grouped controls, 44-point interaction targets, and opaque material fallbacks.

These are visual and interaction references. The implementation is original Astro/CSS using the site's theme variables; no source code or dependencies are imported from these projects. Acrylic uses a tinted translucent fill, 24px backdrop blur, subtle rim, and soft shadow instead of refraction or WebGL.

## Compatibility

- Light and dark themes inherit the site's existing colors.
- Unsupported backdrop blur and reduced-transparency preferences receive an opaque card background.
- Reduced motion disables the moving selection animation and header entrance animation.
- Safe-area insets and constrained popover sizes keep controls within mobile screens.
- Current-page links render on the server and update after Swup navigation; ResizeObserver keeps the indicator aligned after resizing.
- Native anchor scrolling has 100px of top padding; Swup anchor scrolling measures the actual capsule bottom plus 16px so article headings stay visible.
