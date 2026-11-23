# Changelog

## 0.5.4

- Apply account changes immediately without changing the model. An unconfirmed GPT model or a busy chat keeps the requested account in preview without rebinding.
- Apply reasoning changes immediately to the active compatible model. Model selection remains explicit.
- Clarify which chats use defaults after sign-in and rename Administrator mode to Advanced mode in all eight languages.
- Add a screenshot manifest for the community Plugin Market.

## 0.5.3

- Add Japanese, Spanish, French, German and Brazilian Portuguese translations for the interface, plugin card and web search provider descriptions. The plugin follows the selected DSH language.
- Add tests for locale registration, translation keys, interpolation variables and packaged descriptions.

## 0.5.2

- Add a model-aware web search setup panel after account sign-in. Show the configured provider and explain that DeepSeek search may use DeepSeek quota even in ChatGPT chats. Switching the profile to Auto requires explicit confirmation; Fetch is unchanged.
- Use separate confirmation labels for enabling Auto and applying subagent settings instead of the account-deletion label.
- Improve the size and contrast of the new-chat defaults and Administrator mode switches.
- Add a picker screenshot and move the optional search setup guide after the sign-in instructions.

## 0.5.1

- Fix false `FORBIDDEN_ORIGIN` errors when selecting a ChatGPT account in the DSH Web UI. DSH still enforces its browser-origin and owner checks before dispatch.
- Let the model picker resize to fit the selected tab instead of keeping the previous tab’s height.
- Rename Developer mode to Administrator mode and remove its local password prompt. This is an interface preference, not a DSH permission; manual resets still require two separate confirmations.

## 0.5.0

- Publish a prebuilt GitHub Release package with a version-independent filename for installation without Git. No runtime changes from preview.11.

## 0.5.0-preview.11

- Point package metadata and installation instructions to the TheSeeker1993 GitHub repository, with GitFlic retained as upstream.
- Document GitHub URL installation and one-click updates in DSH Market. Plugin runtime behavior is unchanged.

## 0.5.0-preview.10

- Simplify the default picker: show quota bars for one account or compact cards for multiple accounts. Mark GPT‑6.2 Sol as recommended.
- Add an optional developer view with a local interface unlock (not an authentication boundary). Manual resets retain two separate confirmations without a password prompt.
- Warm the account-scoped model catalog on client startup, share it across chats in the window, and reserve space for the three catalog-gated models. Admit additional models only with explicit compatible transport metadata.
- Use GPT‑6.2 Sol with low reasoning as the first-use default without overriding saved preferences.

## 0.5.0-preview.9

- Keep the picker open after selecting a model, save supported reasoning levels immediately, and show the original level IDs.
- Reduce flicker during selection and refresh; use a compact switch for new-chat defaults.
- Hide manual limit resets by default behind a display switch. Require a fixed confirmation phrase at the second step; it is not an authentication secret.

## 0.5.0-preview.8

- Added GPT‑6.2 Sol, GPT‑6.2 Astra, and GPT‑6.1 Terra to the existing picker when listed by the selected account’s Codex catalog. No new buttons or panels.
- Catalog failures do not disable the seven existing models or interrupt current chats. The catalog refresh does not start generation or change saved selections.
- GPT‑6.2 Sol was verified in a live chat. Astra and Terra were confirmed in the account catalog; their generation was not tested live.

## 0.5.0-preview.6

- Added the “For new chats” checkbox to persist account/model/reasoning defaults. Initial selection is the first configured account with GPT‑6.1 Sol / low; clearing the checkbox persistently disables initialization.
- Apply defaults only on fresh ordinary agent creation, never resume, forks, clear/compact or subagents. No automatic fallback for an unavailable saved account; existing bindings stay intact.
- Separate metadata domain and authenticated CSRF-protected endpoint; account credentials, busy/lease rules and global deployment defaults remain unchanged.
- Validation: 165 synthetic tests and both installed-runtime smoke scripts passed; whitespace/packaging checks passed. No real inference or visual verification performed.

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
