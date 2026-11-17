# Передача проекта · 17.11.2026

Рабочая версия: **0.5.0-preview.5**. Статус публикации подтверждается отдельно после push; номер версии сам по себе не означает публикацию.

## Что это
Самостоятельный community-плагин DSH: несколько ChatGPT OAuth-аккаунтов, явный выбор аккаунта для каждой сессии, изолированные параллельные запросы, квоты и ручные сбросы Codex. Основной репозиторий: https://gitflic.ru/project/421-mircli-ru/dsh-chatgpt-multi-account (upstream Clukay-Fun/dsh-gpt-link); GitHub qixxby/dsh-chatgpt-multi-account — историческое зеркало. Статус удалённого релиза не выводить из локальных файлов. `.git` и незакоммиченные изменения сохранены; автоматического push нет.

## Среда и запуск
- Engines: DSH >=0.2.2-rc.3 <0.2.3, встроенный pi-ai 1.3.0; Node 24. База API и native synthetic smoke — установленный rc.3; актуальный результат smoke подтверждать отдельным прогоном. Не обещать живой поиск или совместимость вне диапазона без теста.
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
- Ребинд, relogin и удаление запрещены при active lease/running session/authorization. По явной просьбе пользователя ручной расход сбросов разрешён при active lease/running session, но не при authorization. Сброс использует тот же `Accounts.exclusive`, проверку аккаунта/identity и два подтверждения; не вызывает assertIdle и не меняет lease/binding. Остальные операции сохраняют assertIdle. Второй независимый Accounts для расхода небезопасен.
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

## Настройка моделей субагентов

В настройках ChatGPT Link добавлен блок статуса и кнопка «Настроить субагентов». Установка и чтение статуса не изменяют разрешения. После показа семи точных маршрутов и отдельного подтверждения клиент использует `remote.settings.describe()` / `mutate('subagent-model-selection-settings', ops, revision)` (проверено по исходникам DSH 0.2.2-rc.3). Свежий read, union существующих `allowedModels` с семью `chatgpt-session` маршрутами, включение `enabled`, optimistic revision и контрольный read. Остальные разрешения сохраняются, включая `openai-codex`; удаляются пользователем только через официальный UI. Конфликт не ретраится. Ошибки/read-only не выдают ложный успех. Настройка действует только на новые чаты; профиль вручную не редактировать.

## Поиск по фактическому маршруту

- Интеграция ZIP: `search/provider.js` — native OAuth GPT hosted search; `search/auto.js` — Auto и делегирование штатному DeepSeek. Используется тот же живой Accounts, общие credentials/leases, не второй экземпляр.
- Включение только явно через **Настройки → Веб-поиск → Auto: ChatGPT / DeepSeek** (`model-aware-search`). Отдельный **ChatGPT (session account)** имеет ID `chatgpt-session-search`. Загрузка/установка никогда не выбирают провайдера и не меняют настройки. `search/setup.js` / административный tool не подключается. Fetch неизменён.
- Инициатор и фактический request route фиксируются до await. `chatgpt-session` — точная session binding; `openai-codex` — только `legacy`, независимо от селектора сессии, с общим lease и без изменения binding. Отсутствующий маршрут/инициатор — явная ошибка. Никакого cross-backend/account fallback.
- GPT: фиксированный helper `gpt-6.1-sol`, low reasoning, native OAuth, только query без истории/replay. Sources — настоящие citations завершённого hosted search. Поиск расходует ChatGPT allowance, точное списание не измерено; отдельный API-ключ не нужен, бесплатность/безлимит не обещать.
- Остальные маршруты — native DeepSeek с существующими authorization/endpoint/count/throttling/`searchBilling` и обычной тарификацией. Не менять глобальные настройки ради dispatch. Для отключения Auto выбрать штатный DeepSeek в стандартном экране; credentials, bindings и история сохраняются.
- GPT lease удерживается до завершения native работы и отслеживаемых credential operations, включая гонку abort с native auth/refresh. Ошибки DeepSeek санитизируются; unload отменяет активные операции.
- API Host установленного DSH 0.2.2-rc.3 изучены. Живой платный поиск и визуальная проверка данной интеграции не выполнялись. Проверки автора ZIP не выдавать за проверки новой сборки.

## Проверки и границы доказанного
```sh
npm test
npm pack --dry-run
git diff --check
# Только при изменении src/ и наличии devDependencies:
npm run typecheck
npm run build
```
Полный suite версии 0.5.0-preview.5: 143 passed, 0 failed/skipped. Прежние 105 тестов и 38 дополнительных проверяют account isolation, busy/leases, auth, quotas, replay, confirmations, CSRF и поиск. Оба installed-runtime smoke прошли на Electron 44.7.0 / DSH rc.3: интеграция Host entry, native API DeepSeek и настоящий native Models с синтетическим некооперативным OAuth refresh, без сети/секретов профиля. git diff --check и npm pack --dry-run прошли. Реальные GET списка credits успешно проверялись для четырёх аккаунтов; реальный consume НЕ выполнялся. Визуальная оценка опирается на скриншоты пользователя и source-review; последнее размещение виджета/темы/focus в живом DSH браузере не подтверждено (browser ранее требовал авторизацию). Тесты не заменяют эту проверку.

Перед публикацией в основной GitFlic-репозиторий обновить версию/CHANGELOG/скриншоты, прогнать secret scan и pack/test, запросить разрешение на push. Не переносить `.dsh`, credentials, OAuth exports или личные account labels в репозиторий. Для запуска на другом компьютере пользователь входит в аккаунты заново.
