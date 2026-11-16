# Changelog

## 0.4.1

- Animated card fill height now represents remaining quota, from the bottom up.
- Uses the primary weekly window when available, otherwise the first primary window.
- Unknown quota is not shown as a full card; stale data is dimmed and marked approximately.
- Fill and numeric caption use the same clamped remaining percentage. Hover changes animation energy, not fill height.
- Reduced-motion disables the fill-height transition.

## 0.4.0

- Integrated Fan Cards account picker into the main plugin (no UI companion required).
- Added full-card SmoothUI-inspired gradient mesh with independent phase, direction and base speed per account.
- Hover/focus smoothly accelerates playback to 2.8× without restarting animation; leaving settles it back.
- Fixed a loop seam by using a 720-degree/66.667-second master cycle, preserving angular speed of the reference.
- Added reduced-motion transition suppression, cancellation of pending spring frames, animation-handle caching, ResizeObserver-only sizing and pause for hidden/offscreen cards.
- Preserved account preview vs applied selection, separate credentials, quotas and model routing.
- Included SmoothUI MIT notice and source attribution.

Validation: JavaScript syntax, existing 67 tests, installed-runtime synthetic integration smoke and package contents. Authenticated live browser inspection was unavailable (DSH browser-auth screen), so visual contrast, narrow-screen overlap and GPU performance are not certified by these checks.

If the local `@local/dsh-chatgpt-fan-ui` preview is installed, disable it after updating to 0.4.0 so the main plugin owns the interface. The preview holds no credentials and can be removed independently.
