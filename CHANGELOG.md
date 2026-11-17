# Changelog

## 0.5.0-preview.5

- Integrated model-aware search in the main bundle: explicitly choose **Settings → Web Search → Auto: ChatGPT / DeepSeek** (`model-aware-search`), or standalone **ChatGPT (session account)** (`chatgpt-session-search`). Loading never selects a provider or changes settings; no administrative setup tool is mounted. Fetch is unchanged.
- GPT hosted search uses shared native OAuth/accounts/leases, fixed `gpt-6.1-sol` with low reasoning and no chat history. Session routes use the bound account; legacy `openai-codex` always uses `legacy`, irrespective of the session selector. Real hosted-search citations are required.
- GPT search consumes ChatGPT allowance; exact cost is unmeasured, and no free/unlimited claim is made. Other model routes retain native DeepSeek settings and billing. Missing routes and failures do not trigger account/backend fallback. Select native DeepSeek to disable Auto without deleting credentials or bindings.
- Hardened GPT lease lifetime across native auth/abort races by tracking credential operations before release. Sanitized delegated DeepSeek errors and abort active operations on unload.
- Preserved the existing account UI and explicit subagent-model setup/permission flow, authorship and licenses.

Validation: Host DSH 0.2.2-rc.3 APIs inspected. Full synthetic suite: 143 passed, 0 failed/skipped; both installed-runtime smoke scripts passed on Electron 44.7.0, including real native Models with synthetic noncooperative OAuth refresh. No network or profile-secret access. Whitespace and dry-run packaging checks passed. No live paid-search test or visual verification of this integration; the ZIP author's earlier results are not a validation of this build.

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
