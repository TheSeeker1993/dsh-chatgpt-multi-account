# Передача проекта · 16.11.2026

## Что это
Самостоятельный community-плагин DSH: несколько ChatGPT OAuth-аккаунтов, явный выбор аккаунта для каждой сессии, изолированные параллельные запросы, квоты и ручные сбросы Codex. Репозиторий: https://github.com/qixxby/dsh-chatgpt-multi-account (upstream Clukay-Fun/dsh-gpt-link). Рабочая версия новее опубликованной 0.4.1; изменения после cb23471 пока не опубликованы. `.git` и незакоммиченные изменения сохранены; автоматического push нет.

## Среда и запуск
- Проверенная цель: DSH Desktop 0.2.2-rc.2, встроенный pi-ai 1.3.0; Node 24. Не обещать совместимость с другими версиями без теста.
- Это не самостоятельный сайт. Устанавливать абсолютный путь к этой папке через DSH Plugin Manager. Не запускать отдельный Vite/web-сервер.
- Основная папка после переноса: `C:\Users\User\Documents\AI\dsh-chatgpt-multi-account`.
- Плагин может быть linked: после нового переноса переустановить по новому пути. Не удалять активную папку.
- `cordis.patch.yml` отключает известные предыдущие реализации и включает `chatgpt-unified-project`. Проверять, что только одна реализация `chatgpt-session` активна.
- После UI-правок обновлять окно DSH. Если загрузчик оставляет старый клиент, нужен корректный reload/reinstall через менеджер; не выдавать сохранение файла за визуально проверенную установку. Не перезагружать Host без необходимости во время запросов.

## Карта кода
| Путь | Назначение |
|---|---|
| `index.js`, `multi/host.js` | Host entry, домен, API и установка сервисов |
| `multi/accounts.js` | метаданные, native credential stores, serial gate, leases/busy, наследование |
| `multi/auth.js` | нативный OAuth, отдельные auth/quota readers |
| `multi/routing.js` | `chatgpt-session` → отдельный PiAiAdapter на аккаунт, replay isolation |
| `multi/resets.js` | список credits, staged consent, одноразовое расходование |
| `multi/reset-host.js` | user-only HTTP API сбросов и CSRF |
| `client/index.js` | весь актуальный React UI, переводы, CSS, общая spring-анимация |
| `src/`, `lib/` | TypeScript upstream-сервисы и их собранный JS; не рассинхронизировать |
| `test/` | синтетические unit/integration tests без пользовательских секретов |
| `scripts/smoke-runtime.mjs` | smoke с установленными DSH API; только синтетические данные |
| `assets/`, `locale/`, `licenses/`, `NOTICE.md` | ресурсы, лицензии/атрибуция; сохранять |

`client/reset-menu.snippet.js` — исторический черновик, НЕ runtime и не источник для регенерации. Старые screenshots/CHANGELOG описывают опубликованные версии и могут не соответствовать UI. Внешние preview-папки предыдущего workspace — устаревшие установочные копии, не исходники проекта. Все актуальные изменения интегрированы сюда; они не нужны для разработки.

## Инварианты аккаунтов
- Storage domain `chatgpt_accounts` v1: `accounts[id]={label,createdAt}`, `sessions[sessionId]={accountId}`.
- `legacy` использует исходную запись `llm-pi-ai/openai-codex`; именованные — `dsh-gpt-link/account-<uuid>`. Формат native grant, секреты остаются в DSH Credentials. Не менять ключи при переносе.
- `openai-codex` — внутренняя/legacy модель; session-aware route — `chatgpt-session`. Не подменять глобальный токен. Нет ambient fallback, автопереключения и балансировки.
- Привязка хранится долговечно. Встроенные subagents наследуют родителя один раз; новые обычные сессии/forks требуют выбора.
- Ребинд, relogin, удаление и расход сбросов запрещены при active lease/running session/authorization; соблюдать единый `Accounts.exclusive` и assertIdle. Второй независимый Accounts для расхода небезопасен.
- Replay привязан к локальному и issuer account IDs; при смене аккаунта удалять чужие replay IDs. Текст истории при этом остаётся.

## Квоты и сбросы
- GET `https://chatgpt.com/backend-api/wham/usage`: per-account native bearer + `chatgpt-account-id`. Quota reader не обновляет OAuth сам: expired token показывается ошибкой, native refresh выполняет адаптер модели.
- Остаток: clamp(100-usedPercent,0,100). Для заливки/таймера сначала основное weekly окно 10080 минут без `:` в id, затем другое основное/первое. Unknown ≠ 100% и ≠ подтверждённый 0%; stale визуально отмечать.
- GET `/wham/rate-limit-reset-credits`: отдельные banked ручные сбросы, НЕ автоматические reset timestamps. Данные: available_count, credits[].id/status/reset_type/expires_at. Поддержан только `codex_rate_limits`; неизвестную схему не угадывать.
- POST `/wham/rate-limit-reset-credits/consume`: `{redeem_request_id,credit_id}`. Заголовок `OAI-Product-Sku: CODEX`; не добавлять покупку сбросов.
- Локальный `/api/chatgpt-resets`: GET list; POST list/begin/advance/consume/cancel. Begin→warning1; advance→warning2 с новым nonce; consume только после двух отдельных действий. Подтверждения bound к аккаунту/credit/identity, TTL60s; до расхода fresh validation.
- Nonce сжигается до dispatch. Повторный consume не отправляет второй POST; unknown — без auto retry/replay. Ошибки только безопасными кодами, без raw response/token.
- CSRF: секретный случайный токен выдаётся authenticated no-store GET, custom `x-chatgpt-reset-csrf` обязателен для POST; браузерный cross-site отклоняется. DSH уже проверяет реальный Host/Origin. `Request.url` внутри Host имеет synthetic origin `http://dsh.internal`: прежнее прямое сравнение породило RESET_FORBIDDEN_ORIGIN. Не возвращать его.
- Owner-auth обеспечивается DSH route boundary. Не регистрировать инструменты агента для consume. Реальный расход никогда не использовать для тестирования без отдельной просьбы пользователя.

## Актуальный UI
Виджет выбора привязан к вызывающей кнопке, nonmodal popover; автоматически выше/ниже, clamped viewport, outside-click/Escape, без backdrop. Четыре равные панели: аккаунты / доступные сбросы выбранного аккаунта / reasoning / модели. Общие рамки/скругления, gap7px, padding6px, inner gap5px; никаких внешних объясняющих подписей. Вверху только название, компактная дата/время обновления, ↻ и закрытие.

Аккаунты — ровные мини-карточки, не веер: имя, остаток %, countdown, число ручных сбросов, текущий аккаунт. Анимация занимает только оставшийся процент высоты снизу. Сбросы показываются автоматически при переключении карточки, без отдельной кнопки раскрытия; имя аккаунта сохраняется в предупреждениях. Ошибки/empty/loading не скрывать ради минимализма.

Preview аккаунта не применяет сессию: применение только кликом модели. Shared ResetChoiceCard: lift -4px spring420/20, энергия260/24, hover speed2.8×; independent gradient phases/directions. Reduced-motion, no RAF after settle, cleanup observers/handlers обязательны. Анимации не должны скрывать текст/клики. Не терять `aria-pressed`, focus, disabled/busy при UI-рефакторинге.

## Проверки и границы доказанного
```sh
npm test
npm pack --dry-run
git diff --check
# Только при изменении src/ и наличии devDependencies:
npm run typecheck
npm run build
```
Последний полный suite: 81 тест; проверены account isolation, busy/leases, auth, quotas, replay, confirmations, CSRF с synthetic DSH origin. Реальные GET списка credits успешно проверялись для четырёх аккаунтов; реальный consume НЕ выполнялся. Визуальная оценка опирается на скриншоты пользователя и source-review; последнее размещение виджета/темы/focus в живом DSH браузере не подтверждено (browser ранее требовал авторизацию). Тесты не заменяют эту проверку.

Публичная GitHub-версия отстаёт. Перед публикацией обновить версию/CHANGELOG/скриншоты, прогнать secret scan и pack/test, запросить разрешение на push. Не переносить `.dsh`, credentials, OAuth exports или личные account labels в репозиторий. Для запуска на другом компьютере пользователь входит в аккаунты заново.
