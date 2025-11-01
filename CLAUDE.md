# Award-Winning Website Design Principles

## Core Philosophy
Create websites that balance aesthetics, performance, and accessibility. Every decision should enhance the user experience without compromising functionality.

## Non-Negotiable Rules

### Performance First
- Always aim for LCP < 2.5s, CLS < 0.1, FID < 100ms
- Images must use modern formats (WebP/AVIF) with fallbacks
- CSS animations use only transform and opacity
- JavaScript should be non-blocking and deferred
- Critical CSS inline, rest async

### Accessibility Always
- WCAG AAA compliance is the goal
- Every interactive element must be keyboard accessible
- Focus states must be clearly visible
- Respect prefers-reduced-motion
- Semantic HTML is mandatory

### Design Fundamentals
- Typography uses modular scale (1.25 or 1.333 ratio)
- 8px spacing grid for consistency
- Color contrast minimum: 7:1 small text, 4.5:1 large
- Mobile-first responsive design
- Dark backgrounds avoid pure black (#0A0A0A-#1A1A1A)

### Animation Guidelines
- Duration: 200-600ms (micro to macro interactions)
- Easing: cubic-bezier(0.4, 0.0, 0.2, 1) as default
- Stagger elements 50-100ms apart
- Performance over complexity

## Creative Freedom Zones

### Experiment With
- Layout breaking (asymmetry, overlapping, broken grids)
- Unique interactions (magnetic cursors, scroll-triggered effects)
- Visual effects (noise, gradients, glassmorphism)
- Typography mixing (serif/sans-serif combinations)
- Color combinations (while maintaining contrast)
- 3D elements and WebGL (with 2D fallbacks)

### Avoid Unless Intentional
- Over-animation (choose impact points)
- Too many fonts (2-3 max)
- Pure white backgrounds (use #FAFAFA-#F5F5F5)
- Scroll-jacking (use sparingly)
- Auto-playing sound (user-initiated only)

## Quick Reference Values

```css
/* Use these as starting points, adjust per project */
--golden-ratio: 1.618;
--perfect-fifth: 1.5;
--major-third: 1.25;

/* Shadow scale */
--shadow-subtle: 0 2px 4px rgba(0,0,0,0.1);
--shadow-medium: 0 8px 16px rgba(0,0,0,0.15);
--shadow-dramatic: 0 20px 40px rgba(0,0,0,0.2);

/* Timing */
--instant: 100ms;
--quick: 200ms;
--moderate: 300ms;
--slow: 600ms;
--dramatic: 800ms;
```

## Decision Framework

When designing any element, ask:
1. Is it accessible to all users?
2. Does it enhance or distract from content?
3. Will it perform well on low-end devices?
4. Does it align with the brand identity?
5. Is there a simpler solution that works as well?

## Inspiration Sources
- Study awwwards.com winners for trends
- Analyze why certain designs win
- Notice micro-interactions that delight
- Learn from both minimal and maximal approaches

## Testing Checklist
Before considering any design complete:
- [ ] Keyboard navigation works perfectly
- [ ] Mobile experience is flawless
- [ ] Performance metrics are green
- [ ] Cross-browser compatibility verified
- [ ] Accessibility audit passes
- [ ] Real device testing done

Remember: Rules exist to ensure quality, but creativity comes from knowing when and how to bend them effectively.