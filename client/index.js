window.__ModuleLoader__.load({
  id: 'dsh-chatgpt-multi-account',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const NS = 'dsh-gpt-link'

    const copy = {
      zh: {
        nav: 'ChatGPT Link',
        intro: '用 ChatGPT 账号在 DSH 里使用 GPT 模型，额度与推理走同一个账号。',
        account: 'ChatGPT 账号',
        signedIn: '已登录',
        signedOut: '未登录',
        signingIn: '正在登录…',
        loginCancelled: '登录已取消',
        loginFailed: '登录失败',
        signedOutHint: '登录后即可在模型列表中选择 GPT 模型。',
        signedInHint: '模型列表中的 GPT 模型已可使用。',
        signIn: '用 ChatGPT 登录',
        signOut: '退出登录',
        cancel: '取消',
        submit: '提交',
        chooseMethod: '选择登录方式',
        method_browser: '浏览器登录（推荐）',
        method_device_code: '设备码登录',
        browserOpened: '已在浏览器中打开授权页，完成授权后这里会自动更新。',
        browserFallback: '浏览器没有打开？',
        openManually: '手动打开授权页',
        deviceCode: '在验证页面输入下面的代码：',
        openVerification: '打开验证页面',
        pasteCallback: '授权后浏览器没有自动返回？把地址栏中的完整地址粘贴到这里。',
        revokedOk: '已退出，并结束了 OpenAI 上的这次会话。',
        revokedFailed: '已在本机退出，但未能结束 OpenAI 上的会话。可在 ChatGPT 设置 → 安全 → 活动会话中手动移除。',
        NO_FLOW: '没有找到 ChatGPT 登录流程。请确认 DSH 已挂载 dsh-llm-pi-ai。',
        ALREADY_IN_FLIGHT: '已有一次登录在进行中。',
        NOT_COMMITTED: '登录结束了，但没有保存凭据。请重试。',
        UNKNOWN_METHOD: '这个登录方式不可用。',
        'bad-request': '请求格式不正确。',
        'login-failed': '登录没有完成，请重试。',
        'logout-failed': '退出没有完成：本机的登录记录没能删除，请重试。',
        quota: '额度',
        refresh: '刷新',
        refreshing: '正在刷新',
        updatedJustNow: '刚刚更新',
        updatedAt: '更新于 {time}',
        staleAt: '数据已过期，截至 {time}',
        limitReached: '已用尽',
        used: '已用 {n}%',
        resetsIn: '{span}后重置',
        noReset: '无重置时间',
        day: '{n} 天',
        hour: '{n} 小时',
        minute: '{n} 分钟',
        soon: '即将',
        windowFiveHour: '5 小时',
        windowWeekly: '每周',
        windowHours: '{n} 小时',
        windowDays: '{n} 天',
        windowMinutes: '{n} 分钟',
        'group-code-review': '代码审查',
        noWindows: '这次没有返回额度窗口。',
        'quota-signed-out': '登录后显示额度。',
        'quota-token-stale': '登录已过期。发送一条消息会自动刷新，或重新登录。',
        'quota-token-rejected': 'OpenAI 拒绝了这次登录，请重新登录。',
        'quota-throttled': '查询太频繁，稍后再刷新。',
        'quota-blocked': '请求被 ChatGPT 的防护拦截，与登录无关，稍后再刷新。',
        'quota-unavailable': '暂时读不到额度，请检查网络后刷新。',
        'quota-stopped': '插件已停止。',
      },
      en: {
        nav: 'ChatGPT Link',
        intro: 'Use GPT models in DSH with your ChatGPT account. Quota and inference use the same account.',
        account: 'ChatGPT account',
        signedIn: 'Signed in',
        signedOut: 'Not signed in',
        signingIn: 'Signing in…',
        loginCancelled: 'Sign-in cancelled',
        loginFailed: 'Sign-in failed',
        signedOutHint: 'Sign in to pick GPT models in the model list.',
        signedInHint: 'GPT models in the model list are ready to use.',
        signIn: 'Sign in with ChatGPT',
        signOut: 'Sign out',
        cancel: 'Cancel',
        submit: 'Submit',
        chooseMethod: 'Choose how to sign in',
        method_browser: 'Browser (recommended)',
        method_device_code: 'Device code',
        browserOpened: 'The sign-in page is open in your browser. This updates once you finish.',
        browserFallback: 'Browser did not open?',
        openManually: 'Open the sign-in page',
        deviceCode: 'Enter this code on the verification page:',
        openVerification: 'Open the verification page',
        pasteCallback: 'Browser did not return after signing in? Paste the full address from its address bar here.',
        revokedOk: 'Signed out, and the session was ended at OpenAI.',
        revokedFailed: 'Signed out here, but the session at OpenAI could not be ended. Remove it under ChatGPT Settings → Security → Active sessions.',
        NO_FLOW: 'No ChatGPT sign-in flow was found. Check that DSH mounts dsh-llm-pi-ai.',
        ALREADY_IN_FLIGHT: 'A sign-in is already running.',
        NOT_COMMITTED: 'The sign-in finished without storing a credential. Try again.',
        UNKNOWN_METHOD: 'That sign-in method is not available.',
        'bad-request': 'The request was malformed.',
        'login-failed': 'The sign-in did not complete. Try again.',
        'logout-failed': 'Sign-out did not finish: the stored sign-in could not be removed. Try again.',
        quota: 'Quota',
        refresh: 'Refresh',
        refreshing: 'Refreshing',
        updatedJustNow: 'Updated just now',
        updatedAt: 'Updated {time}',
        staleAt: 'Out of date, as of {time}',
        limitReached: 'Limit reached',
        used: '{n}% used',
        resetsIn: 'Resets in {span}',
        noReset: 'No reset time',
        day: '{n}d',
        hour: '{n}h',
        minute: '{n}m',
        soon: 'a moment',
        windowFiveHour: '5 hours',
        windowWeekly: 'Weekly',
        windowHours: '{n} hours',
        windowDays: '{n} days',
        windowMinutes: '{n} minutes',
        'group-code-review': 'Code review',
        noWindows: 'This response included no quota window.',
        'quota-signed-out': 'Sign in to see your quota.',
        'quota-token-stale': 'The sign-in has expired. Sending a message refreshes it, or sign in again.',
        'quota-token-rejected': 'OpenAI refused this sign-in. Sign in again.',
        'quota-throttled': 'Too many checks. Refresh again shortly.',
        'quota-blocked': 'ChatGPT’s edge protection stopped this request; the sign-in is fine. Refresh again shortly.',
        'quota-unavailable': 'Quota is unavailable right now. Check the network, then refresh.',
        'quota-stopped': 'The plugin has stopped.',
      },
    }

    Object.assign(copy.en, {
      accounts: 'ChatGPT accounts', addAccount: 'Add account', accountLabel: 'Account label', signInAgain: 'Sign in again',
      rename: 'Rename', remove: 'Remove', confirmRemove: 'Remove this account’s local authorization? Bound sessions will stop until you select another account. This does not revoke the session at OpenAI.',
      confirm: 'Confirm removal', emptyAccounts: 'No accounts yet. Add an account, then sign in explicitly.',
      sessionAccount: 'ChatGPT account for this session', chooseAccount: 'Choose an account',
      unconfigured: 'Not signed in', loading: 'Loading…', busySession: 'Account switching is unavailable while this session is busy.',
      isolatedHint: 'For account isolation, select “ChatGPT (session account)” (chatgpt-session) in the model picker. This control never changes your model automatically.',
      requestFailed: 'Request failed. Retry or refresh.', retry: 'Retry', subagentHint: 'Account selection is unavailable for subagents.',
    })
    Object.assign(copy.zh, {
      accounts: 'ChatGPT 账号', addAccount: '添加账号', accountLabel: '账号名称', rename: '重命名', signInAgain: '重新登录',
      remove: '移除', confirmRemove: '移除此账号的本地授权？绑定的会话将停止，直到重新选择账号。此操作不会撤销 OpenAI 端的会话。', confirm: '确认移除',
      emptyAccounts: '暂无账号。请先添加账号，再手动登录。', sessionAccount: '此会话的 ChatGPT 账号',
      chooseAccount: '选择账号', unconfigured: '未登录', loading: '正在加载…',
      busySession: '会话忙碌时不能切换账号。',
      isolatedHint: '如需账号隔离，请在模型选择器中选择 “ChatGPT (session account)”（chatgpt-session）。此控件不会自动更改模型。',
      requestFailed: '请求失败，请重试或刷新。', retry: '重试', subagentHint: '子代理不能选择账号。',
    })
    copy.ru = { ...copy.en,
      nav: 'ChatGPT Link', intro: 'Несколько аккаунтов ChatGPT с отдельным выбором для каждой сессии.',
      account: 'Аккаунт ChatGPT', signedIn: 'Вход выполнен', signedOut: 'Вход не выполнен',
      signingIn: 'Выполняется вход…', loginCancelled: 'Вход отменён', loginFailed: 'Не удалось войти',
      signedOutHint: 'Войдите в этот аккаунт явным действием.', signedInHint: 'Аккаунт готов к выбору в сессии.',
      signIn: 'Войти через ChatGPT', signInAgain: 'Войти повторно', cancel: 'Отмена', submit: 'Отправить', chooseMethod: 'Выберите способ входа',
      method_browser: 'Через браузер (рекомендуется)', method_device_code: 'Код устройства',
      browserOpened: 'Завершите вход на открытой странице. Состояние обновится автоматически.',
      browserFallback: 'Браузер не открылся?', openManually: 'Открыть страницу входа',
      deviceCode: 'Введите этот код на странице подтверждения:', openVerification: 'Открыть страницу подтверждения',
      pasteCallback: 'Если возврат не произошёл, вставьте полный адрес из адресной строки после авторизации.',
      quota: 'Квота', refresh: 'Обновить', refreshing: 'Обновление', updatedJustNow: 'Только что',
      updatedAt: 'Обновлено: {time}', staleAt: 'Устаревшие данные: {time}', limitReached: 'Исчерпано',
      used: 'Использовано {n}%', resetsIn: 'Сброс через {span}', noReset: 'Время сброса неизвестно',
      day: '{n} дн.', hour: '{n} ч', minute: '{n} мин', soon: 'скоро',
      windowFiveHour: '5 часов', windowWeekly: 'Неделя', windowHours: '{n} ч', windowDays: '{n} дн.', windowMinutes: '{n} мин',
      noWindows: 'Нет данных об интервалах квоты.',
      'quota-signed-out': 'Войдите для просмотра квоты.', 'quota-unavailable': 'Не удалось получить квоту.',
      'quota-token-stale': 'Вход устарел. Войдите снова.', 'quota-token-rejected': 'OpenAI отклонил вход. Войдите снова.',
      'quota-throttled': 'Слишком много запросов. Повторите позже.', 'quota-blocked': 'Запрос заблокирован защитой ChatGPT.',
      'quota-stopped': 'Плагин остановлен.', accounts: 'Аккаунты ChatGPT', addAccount: 'Добавить аккаунт',
      accountLabel: 'Название аккаунта', rename: 'Переименовать', remove: 'Удалить',
      confirmRemove: 'Удалить локальную авторизацию аккаунта? Привязанные сессии остановятся до выбора другого аккаунта. Сеанс на стороне OpenAI не отзывается.', confirm: 'Подтвердить удаление',
      emptyAccounts: 'Аккаунтов пока нет. Добавьте аккаунт, затем явно выполните вход.',
      sessionAccount: 'Аккаунт ChatGPT этой сессии', chooseAccount: 'Выберите аккаунт',
      unconfigured: 'Вход не выполнен', loading: 'Загрузка…', busySession: 'Нельзя менять аккаунт, пока сессия занята.',
      isolatedHint: 'Для изоляции выберите в моделях «ChatGPT (session account)» (chatgpt-session). Этот переключатель не меняет модель автоматически.',
      requestFailed: 'Запрос не выполнен. Повторите или обновите страницу.', retry: 'Повторить',
      subagentHint: 'Выбор аккаунта недоступен для субагентов.',
    }

    Object.assign(copy.ru, { sessionAccount: 'ChatGPT', manageAccount: 'Управление аккаунтом', setupHint: '1. Добавьте аккаунты и войдите в них. 2. Выберите аккаунт в чате. 3. Выберите модель из ChatGPT (session account).', routeHint: 'Работает с моделями ChatGPT (session account). Старый OpenAI Codex использует общий аккаунт.', accountDetails: 'Название и удаление', inheritedAccount: 'Аккаунт родителя' })
    Object.assign(copy.en, { sessionAccount: 'ChatGPT', manageAccount: 'Manage account', setupHint: '1. Add accounts and sign in. 2. Choose an account in chat. 3. Choose a model under ChatGPT (session account).', routeHint: 'Uses ChatGPT (session account) models. Legacy OpenAI Codex uses the shared account.', accountDetails: 'Name and removal', inheritedAccount: 'Parent account' })
    Object.assign(copy.zh, { sessionAccount: 'ChatGPT', manageAccount: '管理账号', setupHint: '1. 添加账号并登录。2. 在聊天中选择账号。3. 选择 ChatGPT (session account) 模型。', routeHint: '适用于 ChatGPT (session account) 模型，旧 Codex 路由使用共享账号。', accountDetails: '名称与移除', inheritedAccount: '父会话账号' })

    const css = `
.gl{width:100%;max-width:760px;color:var(--dsw-alias-label-primary);display:flex;flex-direction:column;gap:14px;font-size:14px;line-height:22px}
.gl-account{border:1px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l2));border-radius:14px;overflow:hidden;background:var(--dsw-alias-settings-card-fill)}
.gl-account>.gl-card{border:0;border-radius:0;background:transparent}
.gl-account>.gl-card+.gl-card{border-top:1px solid var(--dsw-alias-border-l2)}
.gl-account-heading{padding:14px 16px 0;font-weight:600;overflow-wrap:anywhere}
.gl-account-manage{border-top:1px solid var(--dsw-alias-border-l2);padding:10px 14px}
.gl-account-manage>summary{cursor:pointer;color:var(--dsw-alias-label-secondary);font-size:12px}
.gl-account-manage .gl-row{padding:12px 0 0;flex-wrap:wrap;gap:8px}
.gl-account-manage .gl-input{flex:1 1 180px;width:100%}
.gl-account .gl-desc{display:none}
.gl-account .gl-windows{gap:12px}
.gl-dock{display:inline-flex;align-items:center;gap:6px;min-width:0;max-width:300px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:20px}
.gl-dock select{width:170px;max-width:100%;min-width:0;height:28px;border:1px solid var(--dsw-alias-border-l3);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;padding:0 6px;text-overflow:ellipsis}
.gl-dock select:disabled{opacity:.6}
.gl-dock-help{cursor:help;flex:none;font-size:12px}
.gl-dock-error{font-size:11px;color:var(--dsw-alias-state-error-primary)}
@media(max-width:600px){.gl-form{flex-wrap:wrap}.gl-form>.gl-input{flex-basis:100%}.gl-dock{max-width:230px}.gl-dock select{width:145px}}
.gl-heading{margin:0;font-size:18px;font-weight:600;line-height:26px}
.gl-intro{margin:-6px 0 0;color:var(--dsw-alias-label-tertiary);font-size:13px;line-height:20px}
.gl-card{border:.5px solid var(--dsw-alias-settings-card-stroke);border-radius:var(--dsw-radius-xl);background:var(--dsw-alias-settings-card-fill);display:flex;flex-direction:column;min-width:0;overflow:hidden}
.gl-row{display:flex;align-items:center;gap:12px;padding:14px;min-width:0}
.gl-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.gl-title{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:500;line-height:20px;min-width:0}
.gl-desc{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;overflow-wrap:anywhere}
.gl-end{flex:none;display:flex;align-items:center;gap:8px}
.gl-dot{width:8px;height:8px;border-radius:50%;flex:none;background:var(--dsw-alias-label-tertiary)}
.gl-dot[data-tone="ok"]{background:var(--dsw-alias-state-success-primary)}
.gl-dot[data-tone="busy"]{background:var(--dsw-alias-state-business-primary);animation:gl-pulse 1.2s ease-in-out infinite}
.gl-dot[data-tone="error"]{background:var(--dsw-alias-state-error-primary)}
@keyframes gl-pulse{50%{opacity:.35}}
@media (prefers-reduced-motion:reduce){.gl-dot[data-tone="busy"]{animation:none}}
.gl-chip{border-radius:var(--dsw-radius-xs);background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary);padding:0 6px;font-size:12px;line-height:18px;font-weight:400}
.gl-chip[data-tone="error"]{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 10%,transparent);color:var(--dsw-alias-state-error-primary)}
.gl-btn{height:32px;border-radius:var(--dsw-radius-md);border:.5px solid var(--dsw-alias-border-l3);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;padding:0 12px;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:6px}
.gl-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.gl-btn:disabled{opacity:.5;cursor:default}
.gl-btn:focus-visible,.gl-icon:focus-visible,.gl-input:focus-visible,.gl-link:focus-visible{outline:var(--dsw-focus-ring-width,2px) solid var(--dsw-focus-ring-color);outline-offset:2px}
.gl-btn[data-kind="primary"]{background:var(--dsw-alias-button-primary-fill);color:var(--dsw-alias-label-primary-foreground);border-color:transparent;font-weight:500}
.gl-btn[data-kind="primary"]:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-button-primary-fill))}
.gl-icon{width:28px;height:28px;border-radius:var(--dsw-radius-sm);border:0;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0}
.gl-icon:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.gl-icon:disabled{cursor:default}
.gl-icon[data-spin="true"] svg{animation:gl-spin .9s linear infinite}
@keyframes gl-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.gl-icon[data-spin="true"] svg{animation:none}}
.gl-sub{border-top:.5px solid var(--dsw-alias-border-l2);padding:12px 14px;display:flex;flex-direction:column;gap:10px}
.gl-note{margin:0;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;overflow-wrap:anywhere}
.gl-note[data-tone="error"]{border-radius:var(--dsw-radius-lg);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 8%,transparent);color:var(--dsw-alias-state-error-primary);padding:8px 10px}
.gl-link{color:var(--dsw-alias-state-business-primary);font:inherit;font-size:12px;background:0 0;border:0;padding:0;cursor:pointer;text-decoration:none}
.gl-link:hover{text-decoration:underline}
.gl-code{font-family:var(--ds-font-family-code,ui-monospace,monospace);font-size:20px;line-height:28px;letter-spacing:.12em;font-weight:500}
.gl-choices{display:flex;flex-wrap:wrap;gap:8px}
.gl-form{display:flex;gap:8px;min-width:0}
.gl-input{flex:1;min-width:0;height:32px;border-radius:var(--dsw-radius-md);border:.5px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit;font-size:13px;padding:0 10px}
.gl-head{display:flex;align-items:center;gap:8px;padding:12px 14px 0}
.gl-head-title{font-size:14px;font-weight:500;line-height:20px}
.gl-head-meta{margin-left:auto;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;font-variant-numeric:tabular-nums;white-space:nowrap}
.gl-windows{display:flex;flex-direction:column;gap:16px;padding:14px}
.gl-window{display:flex;flex-direction:column;gap:6px}
.gl-window-top{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.gl-window-name{font-size:13px;line-height:20px}
.gl-window-used{font-size:13px;line-height:20px;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-secondary)}
.gl-window-used[data-tone="error"]{color:var(--dsw-alias-state-error-primary)}
.gl-track{height:6px;border-radius:999px;background:var(--dsw-alias-bg-module-platform);box-shadow:inset 0 0 0 .5px var(--dsw-alias-border-l2);overflow:hidden}
.gl-fill{height:100%;border-radius:999px;background:var(--dsw-alias-brand-primary-new-colorprimary-new-color,var(--dsw-alias-brand-primary));transition:width .4s ease}
.gl-fill[data-tone="error"]{background:var(--dsw-alias-state-error-primary)}
@media (prefers-reduced-motion:reduce){.gl-fill{transition:none}}
.gl-window-reset{color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:18px;font-variant-numeric:tabular-nums}
.gl-skeleton{height:12px;border-radius:var(--dsw-radius-xs);background:var(--dsw-alias-bg-skeleton)}
`

    function text(t, key, vars) {
      let value = t(key)
      if (vars) {
        for (const name of Object.keys(vars)) value = value.split(`{${name}}`).join(vars[name])
      }
      return value
    }

    /** A translation, or null when the key is not one of ours. */
    function known(t, key) {
      const value = t(key)
      return value === key ? null : value
    }

    const RefreshIcon = h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true },
      h('path', { d: 'M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 2.5v3h-3', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }))

    function shortTime(ms) {
      return new Date(ms).toLocaleString(undefined, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    function clockTime(ms) {
      return new Date(ms).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    }

    /** "4 小时 12 分钟" / "4h 12m": the two largest units, which is what a person plans around. */
    function span(t, ms) {
      const minutes = Math.max(0, Math.round(ms / 60000))
      if (minutes < 1) return text(t, 'soon')
      const days = Math.floor(minutes / 1440)
      const hours = Math.floor((minutes % 1440) / 60)
      const mins = minutes % 60
      const parts = []
      if (days > 0) parts.push(text(t, 'day', { n: String(days) }))
      if (hours > 0) parts.push(text(t, 'hour', { n: String(hours) }))
      if (days === 0 && mins > 0) parts.push(text(t, 'minute', { n: String(mins) }))
      return parts.slice(0, 2).join(' ')
    }

    /**
     * Name a window by its length, which is what a person recognizes; `primary` and
     * `secondary` are the backend's slots, not names. A prefixed id belongs to a limit other
     * than the main one, so its group leads the label.
     */
    function windowLabel(t, window) {
      const mins = window.windowDurationMins
      const length = mins == null
        ? window.id
        : mins === 300
          ? text(t, 'windowFiveHour')
          : mins === 10080
            ? text(t, 'windowWeekly')
            : mins % 1440 === 0
              ? text(t, 'windowDays', { n: String(mins / 1440) })
              : mins % 60 === 0
                ? text(t, 'windowHours', { n: String(mins / 60) })
                : text(t, 'windowMinutes', { n: String(mins) })
      const cut = window.id.lastIndexOf(':')
      if (cut < 0) return length
      const group = window.id.slice(0, cut)
      return `${known(t, `group-${group}`) ?? group} · ${length}`
    }

    function planName(plan) {
      return plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : null
    }

    // Cookie-authenticated, document-relative URLs preserve a mounted Host path.
    async function request(path, body, signal) {
      const response = await fetch(path, {
        method: body === undefined ? 'GET' : 'POST', cache: 'no-store', credentials: 'same-origin', signal,
        headers: { accept: 'application/json', ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(typeof result?.error === 'string' ? result.error : `HTTP ${response.status}`)
      if (result?.ok === false || result?.error) throw new Error(typeof result.error === 'string' ? result.error : result.error?.message || 'Request failed')
      return result
    }
    const accountEvents = new EventTarget()
    function accountsChanged() { accountEvents.dispatchEvent(new Event('changed')) }
    function getAuth(accountId, signal) {
      return request(`api/chatgpt-auth?accountId=${encodeURIComponent(accountId)}`, undefined, signal)
    }
    function postAuth(accountId, body) {
      return request('api/chatgpt-auth', { ...body, accountId })
    }
    function useAccounts(sessionId) {
      const [snapshot, setSnapshot] = React.useState(null)
      const [error, setError] = React.useState('')
      const [pending, setPending] = React.useState(false)
      const generation = React.useRef(0)
      const mounted = React.useRef(false)
      const scopeKey = React.useRef(sessionId)
      scopeKey.current = sessionId
      const mutationActive = React.useRef(false)
      const refresh = React.useCallback(async () => {
        const ticket = ++generation.current
        try {
          const next = await request(`api/chatgpt-accounts${sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : ''}`)
          if (!Array.isArray(next?.accounts)) throw new Error('Invalid accounts response')
          if (mounted.current && ticket === generation.current) { setSnapshot(next); setError('') }
        } catch (e) {
          if (mounted.current && ticket === generation.current) setError(e instanceof Error ? e.message : 'Request failed')
        }
      }, [sessionId])
      React.useEffect(() => {
        mounted.current = true
        setSnapshot(null); setPending(false); mutationActive.current = false
        void refresh()
        const onChange = () => { void refresh() }
        accountEvents.addEventListener('changed', onChange)
        window.addEventListener('focus', onChange)
        const timer = setInterval(onChange, 5000)
        return () => {
          mounted.current = false; generation.current++
          clearInterval(timer); accountEvents.removeEventListener('changed', onChange); window.removeEventListener('focus', onChange)
        }
      }, [refresh])
      const mutate = async (body) => {
        if (pending || mutationActive.current) return false
        const targetScope = sessionId
        mutationActive.current = true
        setPending(true); setError(''); ++generation.current
        try {
          const next = await request('api/chatgpt-accounts', body)
          if (!Array.isArray(next?.accounts)) throw new Error('Invalid accounts response')
          if (mounted.current && scopeKey.current === targetScope) { ++generation.current; setSnapshot(next) }
          accountsChanged()
          return true
        } catch (e) {
          if (mounted.current && scopeKey.current === targetScope) setError(e instanceof Error ? e.message : 'Request failed')
          return false
        } finally {
          if (scopeKey.current === targetScope) { mutationActive.current = false; if (mounted.current) setPending(false) }
        }
      }
      return { snapshot, error, pending, refresh, mutate }
    }

    /** What the flow is asking, in this page's words where the question is one we recognize. */
    function PromptArea({ t, prompt, busy, send }) {
      const [draft, setDraft] = React.useState('')
      React.useEffect(() => {
        setDraft('')
      }, [prompt.id])

      if (prompt.kind === 'select') {
        return h('div', { className: 'gl-sub' },
          h('p', { className: 'gl-note' }, text(t, 'chooseMethod')),
          h('div', { className: 'gl-choices' }, (prompt.options ?? []).map((option, index) =>
            h('button', {
              key: option.id,
              type: 'button',
              className: 'gl-btn',
              'data-kind': index === 0 ? 'primary' : undefined,
              disabled: busy,
              onClick: () => void send({ action: 'answer', id: prompt.id, value: option.id }),
            }, known(t, `method_${option.id}`) ?? option.label))),
        )
      }
      const isCallback = typeof prompt.placeholder === 'string' && prompt.placeholder.includes('/auth/callback')
      const label = isCallback ? text(t, 'pasteCallback') : prompt.message
      return h('div', { className: 'gl-sub' },
        h('p', { className: 'gl-note' }, label),
        h('form', {
          className: 'gl-form',
          onSubmit: (event) => {
            event.preventDefault()
            void send({ action: 'answer', id: prompt.id, value: draft })
          },
        },
          h('input', {
            className: 'gl-input',
            type: prompt.kind === 'secret' ? 'password' : 'text',
            value: draft,
            placeholder: prompt.placeholder ?? '',
            'aria-label': label,
            onChange: (event) => setDraft(event.target.value),
          }),
          h('button', { type: 'submit', className: 'gl-btn', disabled: busy || draft === '' }, text(t, 'submit')),
        ),
      )
    }

    /** The page the flow announced: a device code to type, or a sign-in page already opened. */
    function NoticeArea({ t, notice }) {
      if (notice.code) {
        return h('div', { className: 'gl-sub' },
          h('p', { className: 'gl-note' }, text(t, 'deviceCode')),
          h('div', { className: 'gl-code' }, notice.code),
          notice.url
            ? h('a', { className: 'gl-link', href: notice.url, target: '_blank', rel: 'noreferrer' }, text(t, 'openVerification'))
            : null,
        )
      }
      if (notice.url) {
        return h('div', { className: 'gl-sub' },
          h('p', { className: 'gl-note' },
            text(t, 'browserOpened'), ' ',
            text(t, 'browserFallback'), ' ',
            h('a', { className: 'gl-link', href: notice.url, target: '_blank', rel: 'noreferrer' }, text(t, 'openManually'))),
        )
      }
      return h('div', { className: 'gl-sub' }, h('p', { className: 'gl-note' }, notice.message))
    }

    /**
     * The sign-in the harness does not offer.
     *
     * The flow belongs to pi-ai; this only starts it and renders its notices and questions.
     * An attempt is not resumable, so a reload during sign-in means starting over.
     */
    function AccountCard({ t, accountId, auth, setAuth, plan }) {
      const [busy, setBusy] = React.useState(false)

      const send = React.useCallback(async (body) => {
        setBusy(true)
        try {
          setAuth(await postAuth(accountId, body))
          accountsChanged()
        } catch (caught) {
          setAuth({ status: 'failed', label: null, methods: [], notice: null, prompt: null, code: caught instanceof Error ? caught.message : 'login-failed', revoked: null })
        } finally {
          setBusy(false)
        }
      }, [accountId, setAuth])

      const status = auth?.status ?? 'signed-out'
      const pending = status === 'pending'
      const signedIn = status === 'signed-in'
      const tone = signedIn ? 'ok' : pending ? 'busy' : status === 'failed' ? 'error' : undefined
      const title = signedIn
        ? text(t, 'signedIn')
        : pending
          ? text(t, 'signingIn')
          : status === 'cancelled'
            ? text(t, 'loginCancelled')
            : status === 'failed'
              ? text(t, 'loginFailed')
              : text(t, 'signedOut')
      const description = signedIn ? text(t, 'signedInHint') : pending ? null : text(t, 'signedOutHint')
      const error = (status === 'failed' || signedIn) && auth?.code ? (known(t, auth.code) ?? auth.code) : null
      const revokedNote = auth?.revoked === true
        ? text(t, 'revokedOk')
        : auth?.revoked === false
          ? text(t, 'revokedFailed')
          : null

      return h('section', { className: 'gl-card', 'aria-label': text(t, 'account') },
        h('div', { className: 'gl-row' },
          h('span', { className: 'gl-dot', 'data-tone': tone, 'aria-hidden': true }),
          h('div', { className: 'gl-main' },
            h('div', { className: 'gl-title' },
              h('span', null, title),
              signedIn && plan ? h('span', { className: 'gl-chip' }, plan) : null,
            ),
            description ? h('div', { className: 'gl-desc' }, description) : null,
          ),
          h('div', { className: 'gl-end' },
            pending
              ? h('button', { type: 'button', className: 'gl-btn', disabled: busy, onClick: () => void send({ action: 'cancel' }) }, text(t, 'cancel'))
              : signedIn
                ? h('button', { type: 'button', className: 'gl-btn', disabled: busy, onClick: () => void send({ action: 'login' }) }, text(t, 'signInAgain'))
                : h('button', {
                  type: 'button',
                  className: 'gl-btn',
                  'data-kind': 'primary',
                  disabled: busy,
                  onClick: () => void send({ action: 'login' }),
                }, text(t, 'signIn')),
          ),
        ),
        pending && auth?.notice ? h(NoticeArea, { t, notice: auth.notice }) : null,
        pending && auth?.prompt ? h(PromptArea, { t, prompt: auth.prompt, busy, send }) : null,
        error ? h('div', { className: 'gl-sub' }, h('p', { className: 'gl-note', 'data-tone': 'error' }, error)) : null,
        !error && revokedNote
          ? h('div', { className: 'gl-sub' }, h('p', { className: 'gl-note', 'data-tone': auth.revoked ? undefined : 'error' }, revokedNote))
          : null,
      )
    }

    Object.assign(copy.ru, { remaining: 'Остаётся {n}%', resetCountdown: 'До сброса: {span}', gptAccountsBlock: 'Аккаунты ChatGPT', otherProvidersBlock: 'Другие провайдеры', quotaStale: 'Данные устарели', quotaWeekly: 'Недельный лимит', quotaFiveHour: 'Лимит на 5 часов' })
    Object.assign(copy.en, { remaining: '{n}% remaining', resetCountdown: 'Resets in: {span}', gptAccountsBlock: 'ChatGPT accounts', otherProvidersBlock: 'Other providers', quotaStale: 'Outdated data', quotaWeekly: 'Weekly limit', quotaFiveHour: '5-hour limit' })
    Object.assign(copy.zh, { remaining: '剩余 {n}%', resetCountdown: '重置倒计时：{span}', gptAccountsBlock: 'ChatGPT 账号', otherProvidersBlock: '其他提供方', quotaStale: '数据已过期', quotaWeekly: '每周限额', quotaFiveHour: '5 小时限额' })
    function WindowRow({ t, window, now, card, pending, onRefresh }) {
      const percent = Number.isFinite(window.usedPercent) ? Math.max(0, Math.min(100, 100 - window.usedPercent)) : null
      const danger = percent !== null && percent <= 10
      const label = windowLabel(t, window)
      const title = label === text(t, 'windowWeekly') ? text(t, 'quotaWeekly') : label === text(t, 'windowFiveHour') ? text(t, 'quotaFiveHour') : label
      return h('div', { className: 'gl-limit' },
        h('div', { className: 'gl-limit-title' },
          h('span', null, title),
          onRefresh ? h('span', { className: 'gl-limit-update' },
            h('time', { dateTime: card?.fetchedAt ? new Date(card.fetchedAt).toISOString() : undefined, title: card?.fetchedAt ? text(t, 'updatedAt', { time: new Date(card.fetchedAt).toLocaleString() }) + (card.freshness === 'stale' ? ' · ' + text(t, 'quotaStale') : '') : text(t, 'pickerUnknown') },
              card?.fetchedAt ? new Date(card.fetchedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + (card.freshness === 'stale' ? ' ≈' : '') : '—'),
            h('button', { type: 'button', className: 'gl-icon', disabled: pending, title: text(t, pending ? 'refreshing' : 'refresh'), 'aria-label': title + ' · ' + text(t, pending ? 'refreshing' : 'refresh'), 'aria-busy': !!pending, 'data-spin': pending ? 'true' : undefined, onClick: onRefresh }, RefreshIcon)) : null),
        h('div', { className: 'gl-limit-meta' },
          h('span', { title: window.resetsAt == null ? undefined : shortTime(window.resetsAt) }, window.resetsAt == null ? text(t, 'noReset') : text(t, 'resetCountdown', { span: span(t, window.resetsAt - now) })),
          h('span', { 'data-tone': danger ? 'error' : undefined }, percent === null ? text(t, 'pickerUnknown') : text(t, 'remaining', { n: String(Math.round(percent)) }))),
        percent !== null ? h('div', { className: 'gl-limit-track', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(percent), 'aria-label': title + ' · ' + text(t, 'remaining', { n: String(Math.round(percent)) }) },
          h('div', { className: 'gl-limit-fill', 'data-tone': danger ? 'error' : undefined, style: { width: percent + '%' } })) : null)
    }
    function RemainingQuota({ t, card, now, pending, onRefresh }) {
      return h('div', { className: 'gl-limit-stack' },
        card?.windows?.length ? card.windows.map(window => h(WindowRow, { key: window.id, t, window, now, card, pending, onRefresh })) :
          h('div', { className: 'gl-limit-meta' }, h('span', null, text(t, 'pickerUnknown')), h('button', { type: 'button', className: 'gl-icon', disabled: pending, 'aria-label': text(t, 'refresh'), 'data-spin': pending ? 'true' : undefined, onClick: onRefresh }, RefreshIcon)))
    }

    function QuotaCard({ t, card, pending, onRefresh }) {
      const [now, setNow] = React.useState(Date.now())
      React.useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer) }, [])
      const meta = pending
        ? text(t, 'refreshing')
        : !card || card.fetchedAt == null
          ? null
          : card.freshness === 'fresh'
            ? (now - card.fetchedAt < 60_000 ? text(t, 'updatedJustNow') : text(t, 'updatedAt', { time: clockTime(card.fetchedAt) }))
            : text(t, 'staleAt', { time: shortTime(card.fetchedAt) })
      const message = card && card.status !== 'logged-in' && card.message
        ? (known(t, card.message) ?? card.message)
        : null
      const windows = card?.windows ?? []
      return h('section', { className: 'gl-card', 'aria-label': text(t, 'quota') },
        h('div', { className: 'gl-head' },
          h('span', { className: 'gl-head-title' }, text(t, 'quota')),
          card?.limitReached ? h('span', { className: 'gl-chip', 'data-tone': 'error' }, text(t, 'limitReached')) : null,
          meta ? h('span', { className: 'gl-head-meta' }, meta) : null,
          h('button', {
            type: 'button',
            className: 'gl-icon',
            'aria-label': text(t, 'refresh'),
            title: text(t, 'refresh'),
            'data-spin': pending ? 'true' : undefined,
            disabled: pending,
            onClick: onRefresh,
            style: meta ? undefined : { marginLeft: 'auto' },
          }, RefreshIcon),
        ),
        h('div', { className: 'gl-windows' },
          !card && pending
            ? [h('div', { key: 'a', className: 'gl-skeleton', style: { width: '40%' } }), h('div', { key: 'b', className: 'gl-skeleton', style: { width: '80%' } })]
            : null,
          message ? h('p', { className: 'gl-note', 'data-tone': card.freshness === 'stale' ? undefined : 'error' }, message) : null,
          card?.status === 'logged-in' && windows.length === 0 ? h('p', { className: 'gl-note' }, text(t, 'noWindows')) : null,
          windows.map((window) => h(WindowRow, { key: window.id, t, window, now })),
        ),
      )
    }

    function AccountPanel({ t, account, pending, mutate }) {
      const [auth, setAuth] = React.useState(null)
      const [card, setCard] = React.useState(null)
      const [quotaPending, setQuotaPending] = React.useState(false)
      const [error, setError] = React.useState('')
      const [label, setLabel] = React.useState(account.label)
      const [confirming, setConfirming] = React.useState(false)
      React.useEffect(() => { setLabel(account.label) }, [account.label])
      React.useEffect(() => {
        let live = true
        let inFlight = false
        const controller = new AbortController()
        const load = async () => {
          if (inFlight) return
          inFlight = true
          try {
            const next = await getAuth(account.id, controller.signal)
            if (live) { setAuth(next); setError('') }
          } catch (e) { if (live) setError(e instanceof Error ? e.message : 'Request failed') }
          finally { inFlight = false }
        }
        void load()
        const timer = auth?.status === 'pending' ? setInterval(() => { void load() }, 1500) : undefined
        return () => { live = false; controller.abort(); if (timer !== undefined) clearInterval(timer) }
      }, [account.id, auth?.status])
      const loadQuota = React.useCallback(async (refresh) => {
        setQuotaPending(true)
        try {
          const next = await request(`api/chatgpt-quota?accountId=${encodeURIComponent(account.id)}`, refresh ? {} : undefined)
          setCard(next)
        } catch {
          setCard(current => ({ status: 'query-failed', freshness: current ? 'stale' : 'empty',
            fetchedAt: current?.fetchedAt ?? null, message: 'quota-unavailable', planType: current?.planType ?? null,
            windows: current?.windows ?? [] }))
        } finally { setQuotaPending(false) }
      }, [account.id])
      const signedIn = auth?.status === 'signed-in'
      React.useEffect(() => { if (signedIn) void loadQuota(false); else setCard(null) }, [signedIn, loadQuota])
      return h('article', { className: 'gl-account', 'aria-label': account.label },
        h('div', { className: 'gl-account-heading' }, account.label),
        error ? h('p', { className: 'gl-note', role: 'alert' }, error) : null,
        auth ? h(AccountCard, { t, accountId: account.id, auth, setAuth, plan: planName(card?.planType) }) : h('p', { className: 'gl-note' }, text(t, 'loading')),
        signedIn ? h(QuotaCard, { t, card, pending: quotaPending, onRefresh: () => void loadQuota(true) }) : null,
        h('details', { className: 'gl-account-manage' },
          h('summary', null, text(t, 'accountDetails')),
          h('form', { className: 'gl-row', onSubmit: event => { event.preventDefault(); if (label.trim()) void mutate({ action: 'rename', accountId: account.id, label: label.trim() }) } },
            h('input', { className: 'gl-input', value: label, maxLength: 80, 'aria-label': text(t, 'accountLabel'), onChange: event => setLabel(event.target.value) }),
            h('button', { className: 'gl-btn', type: 'submit', disabled: pending || !label.trim() || label.trim() === account.label }, text(t, 'rename')),
            account.id !== 'legacy' ? h('button', { className: 'gl-btn', type: 'button', disabled: pending, onClick: () => setConfirming(true) }, text(t, 'remove')) : null),
          confirming ? h('div', { className: 'gl-sub' },
            h('p', { className: 'gl-note' }, text(t, 'confirmRemove')),
            h('div', { className: 'gl-choices' },
              h('button', { className: 'gl-btn', type: 'button', disabled: pending, onClick: () => void mutate({ action: 'remove', accountId: account.id }) }, text(t, 'confirm')),
              h('button', { className: 'gl-btn', type: 'button', disabled: pending, onClick: () => setConfirming(false) }, text(t, 'cancel')))) : null))
    }

    function GptLinkSection({ t }) {
      const { snapshot, error, pending, refresh, mutate } = useAccounts()
      const [label, setLabel] = React.useState('')
      return h('div', { className: 'gl' },
        h('style', null, css + pickerCss), h('h2', { className: 'gl-heading' }, text(t, 'accounts')),
        h('p', { className: 'gl-intro' }, text(t, 'setupHint')),
        h('form', { className: 'gl-form', onSubmit: async event => {
          event.preventDefault()
          if (label.trim() && await mutate({ action: 'create', label: label.trim() })) setLabel('')
        } },
          h('input', { className: 'gl-input', value: label, maxLength: 80, 'aria-label': text(t, 'accountLabel'), placeholder: text(t, 'accountLabel'), onChange: event => setLabel(event.target.value) }),
          h('button', { type: 'submit', className: 'gl-btn', disabled: pending || !label.trim() }, text(t, 'addAccount'))),
        error ? h('div', { role: 'alert' }, `${text(t, 'requestFailed')} ${error} `,
          h('button', { className: 'gl-btn', type: 'button', onClick: () => void refresh() }, text(t, 'retry'))) : null,
        !snapshot && !error ? h('p', null, text(t, 'loading')) : null,
        snapshot?.accounts.length === 0 ? h('p', { className: 'gl-note' }, text(t, 'emptyAccounts')) : null,
        snapshot?.accounts.map(account => h(AccountPanel, { key: account.id, t, account, pending, mutate })))
    }

    function SessionAccountSelector({ t, sessionId, useSession }) {
      const { snapshot, error, pending, refresh, mutate } = useAccounts(sessionId)
      const busy = useSession(s => s.running || s.awaitingFirstTurn || s.pendingSubmissions.length > 0)
      const removed = useSession(s => s.removed)
      const subagent = useSession(s => s.subagent !== null)
      const accounts = snapshot?.accounts ?? []
      const selected = snapshot?.sessionAccountId ?? ''
      const hint = text(t, subagent ? 'subagentHint' : busy ? 'busySession' : 'routeHint')
      return h('div', { className: 'gl-dock' },
        h('style', null, css),
        h('label', { htmlFor: 'gl-account-' + sessionId }, text(t, 'sessionAccount')),
        h('select', { id: 'gl-account-' + sessionId, value: selected, title: hint,
          'aria-label': text(t, 'sessionAccount'),
          disabled: busy || removed || subagent || pending || !snapshot || !!error,
          onChange: event => { if (!busy && !removed && !subagent && event.target.value) void mutate({ action: 'select', sessionId, accountId: event.target.value }) } },
          h('option', { value: '', disabled: true }, text(t, subagent ? 'inheritedAccount' : 'chooseAccount')),
          selected && !accounts.some(account => account.id === selected) ? h('option', { value: selected, disabled: true }, text(t, 'unconfigured')) : null,
          accounts.map(account => h('option', { key: account.id, value: account.id, disabled: !account.configured }, account.label + (account.configured ? '' : ' · ' + text(t, 'unconfigured'))))),
        h('span', { className: 'gl-dock-help', title: hint, tabIndex: 0, 'aria-label': hint }, 'ⓘ'),
        error ? h('button', { className: 'gl-icon', title: error + ' · ' + text(t, 'retry'), 'aria-label': text(t, 'retry'), onClick: () => void refresh() }, '↻') : null)
    }


    Object.assign(copy.ru, { pickerTitle: 'Аккаунт и модель', pickerSearch: 'Поиск аккаунта или модели', pickerClose: 'Закрыть', pickerQuota: 'Использовано', pickerUnknown: 'Квота недоступна', pickerChoose: 'Выбрать модель', pickerOther: 'Другие провайдеры', pickerBusy: 'Дождитесь завершения работы сессии', pickerRefresh: 'Обновить квоты', pickerPartial: 'Аккаунт выбран, но модель не изменилась. Проверьте выбор перед отправкой.', pickerNoResults: 'Ничего не найдено', pickerLoad: 'Загрузка моделей…', pickerInstruction: 'Выберите уровень рассуждений, затем нажмите на модель.', pickerEmptyAccounts: 'Добавьте аккаунт в Настройки → ChatGPT Link.', pickerEmptyModels: 'Нет доступных моделей. Нажмите обновление справа вверху.' })
    Object.assign(copy.en, { pickerTitle: 'Account and model', pickerSearch: 'Search accounts or models', pickerClose: 'Close', pickerQuota: 'Used', pickerUnknown: 'Quota unavailable', pickerChoose: 'Choose model', pickerOther: 'Other providers', pickerBusy: 'Wait until this session is idle', pickerRefresh: 'Refresh quotas', pickerPartial: 'Account changed but model selection failed. Check your selection before sending.', pickerNoResults: 'No matches', pickerLoad: 'Loading models…', pickerInstruction: 'Choose reasoning effort, then click a model.', pickerEmptyAccounts: 'Add an account in Settings → ChatGPT Link.', pickerEmptyModels: 'No available models. Use refresh at the top right.' })
    Object.assign(copy.zh, { pickerTitle: '账号与模型', pickerSearch: '搜索账号或模型', pickerClose: '关闭', pickerQuota: '已用', pickerUnknown: '额度不可用', pickerChoose: '选择模型', pickerOther: '其他提供方', pickerBusy: '请等待会话空闲', pickerRefresh: '刷新额度', pickerPartial: '账号已切换，但模型选择失败。发送前请检查。', pickerNoResults: '没有结果', pickerLoad: '正在加载模型…', pickerInstruction: '选择推理强度，然后点击模型。', pickerEmptyAccounts: '在设置 → ChatGPT Link 中添加账号。', pickerEmptyModels: '没有可用模型，请点击右上角刷新。' })
    Object.assign(copy.ru, { activeAccount: 'Используется', activeModel: 'Текущая' })
    Object.assign(copy.en, { activeAccount: 'In use', activeModel: 'Current' })
    Object.assign(copy.zh, { activeAccount: '使用中', activeModel: '当前' })
    Object.assign(copy.ru, { pickerPreview: 'Просмотр', pickerReasoning: 'Рассуждения', pickerApplyHint: 'Нажмите модель, чтобы применить выбор', pickerTabOther: 'Другие', pickerNotApplied: 'Ещё не применено' })
    Object.assign(copy.en, { pickerPreview: 'Preview', pickerReasoning: 'Reasoning', pickerApplyHint: 'Click a model to apply your selection', pickerTabOther: 'Other', pickerNotApplied: 'Not applied yet' })
    Object.assign(copy.zh, { pickerPreview: '预览', pickerReasoning: '推理', pickerApplyHint: '点击模型以应用选择', pickerTabOther: '其他', pickerNotApplied: '尚未应用' })
    const pickerCss = `
/* Siri Orb mesh adapted from SmoothUI (MIT), Eduardo Calvo.
   idle: rotation 20/.6=33.333s, sheen 12/(1+.6)*2=15s, breath5.5s. */
@property --gl-orb-angle{syntax:"<angle>";inherits:false;initial-value:0deg}
.gl-card-orb-clip{position:absolute;inset:1px;border-radius:inherit;overflow:hidden;pointer-events:none;z-index:0}
.gl-card-orb{display:block;position:absolute;inset:-18%;width:136%;height:136%;border-radius:inherit;isolation:isolate;opacity:.23;pointer-events:none;background:var(--dsw-alias-bg-layer-1);animation:gl-orb-breathe 5.5s cubic-bezier(.645,.045,.355,1) infinite;transition:opacity .3s ease,filter .3s ease;filter:saturate(.8)}
.gl-fan-card:not(:disabled):hover .gl-card-orb,.gl-fan-card:not(:disabled):focus-visible .gl-card-orb{opacity:.52;filter:saturate(1.3)}
.gl-card-orb-clip::after{content:'';position:absolute;inset:0;background:linear-gradient(to bottom,color-mix(in srgb,var(--dsw-alias-bg-layer-1) 12%,transparent),color-mix(in srgb,var(--dsw-alias-bg-layer-1) 72%,transparent));pointer-events:none;z-index:1}
.gl-fan-card>.gl-fan-top,.gl-fan-card>.gl-fan-name,.gl-fan-card>.gl-fan-remaining,.gl-fan-card>.gl-fan-state{position:relative;z-index:1}
.gl-card-orb::before,.gl-card-orb::after,.gl-card-orb-sheen,.gl-card-orb-rim{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none}
.gl-card-orb{--gl-c1:var(--dsw-alias-state-business-primary);--gl-c2:color-mix(in srgb,var(--dsw-alias-state-business-primary) 50%,var(--dsw-alias-label-primary));--gl-c3:color-mix(in srgb,var(--dsw-alias-state-business-primary) 80%,var(--dsw-alias-bg-layer-1));--gl-c4:color-mix(in srgb,var(--dsw-alias-state-business-primary) 65%,var(--dsw-alias-label-secondary))}
.gl-card-orb::before{background:conic-gradient(from calc(var(--gl-orb-angle)*2) at 25% 70%,var(--gl-c3),transparent 20% 80%,var(--gl-c3)),conic-gradient(from calc(var(--gl-orb-angle)*2) at 45% 75%,var(--gl-c2),transparent 30% 60%,var(--gl-c2)),conic-gradient(from calc(var(--gl-orb-angle)*-3) at 80% 20%,var(--gl-c1),transparent 40% 60%,var(--gl-c1)),conic-gradient(from calc(var(--gl-orb-angle)*1.5) at 60% 35%,var(--gl-c4),transparent 25% 75%,var(--gl-c4)),conic-gradient(from calc(var(--gl-orb-angle)*2) at 15% 5%,var(--gl-c2),transparent 10% 90%,var(--gl-c2)),conic-gradient(from var(--gl-orb-angle) at 20% 80%,var(--gl-c1),transparent 10% 90%,var(--gl-c1)),conic-gradient(from calc(var(--gl-orb-angle)*-2) at 85% 10%,var(--gl-c3),transparent 20% 80%,var(--gl-c3));filter:blur(4px) contrast(1.5) saturate(1.05);animation:gl-orb-turn 66.666667s linear infinite}
.gl-card-orb::after{background-image:radial-gradient(circle at center,var(--dsw-alias-bg-layer-1) .1px,transparent .1px);background-size:.2px .2px;backdrop-filter:blur(8px) contrast(3);mix-blend-mode:overlay;mask-image:radial-gradient(black 25%,transparent 75%)}
.gl-card-orb-sheen{background:radial-gradient(circle at 30% 24%,color-mix(in srgb,var(--dsw-alias-label-primary) 32%,transparent),transparent 34%),radial-gradient(circle at 72% 80%,color-mix(in srgb,var(--dsw-alias-label-primary) 7%,transparent),transparent 48%);animation:gl-orb-drift 15s ease-in-out infinite alternate;mix-blend-mode:screen}
.gl-card-orb-rim{box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dsw-alias-label-primary) 16%,transparent),inset 0 7px 14px color-mix(in srgb,var(--dsw-alias-label-primary) 22%,transparent),inset 0 -8px 16px color-mix(in srgb,var(--dsw-alias-bg-layer-1) 40%,transparent)}
.gl-card-orb::before{animation-delay:var(--gl-orb-phase,0s);animation-direction:var(--gl-orb-direction,normal)}
.gl-card-orb-sheen{animation-delay:var(--gl-orb-phase,0s)}
.gl-card-orb{animation-delay:var(--gl-orb-phase,0s)}
@keyframes gl-orb-turn{to{--gl-orb-angle:720deg}}
@keyframes gl-orb-drift{from{transform:translate(-6%,-4%) scale(1.05)}to{transform:translate(7%,6%) scale(1.12)}}
@keyframes gl-orb-breathe{0%,100%{transform:scale(.94)}50%{transform:scale(.9729)}}
@media(prefers-reduced-motion:reduce){.gl-card-orb,.gl-card-orb::before,.gl-card-orb-sheen{animation:none!important;transition:none!important}}

.gl-fan[data-paused=true] .gl-card-orb,.gl-fan[data-paused=true] .gl-card-orb::before,.gl-fan[data-paused=true] .gl-card-orb-sheen,.gl-fan-card[data-offscreen=true] .gl-card-orb,.gl-fan-card[data-offscreen=true] .gl-card-orb::before,.gl-fan-card[data-offscreen=true] .gl-card-orb-sheen{animation-play-state:paused}
.gl-fan[data-many=true] .gl-card-orb::after{backdrop-filter:none}
.gl-fan{position:relative;height:164px;flex:none;min-width:0;margin:0 4px 2px;font-family:inherit;isolation:isolate}
.gl-fan-card{box-sizing:border-box;position:absolute;left:50%;top:28px;width:128px;height:120px;transform-origin:50% 100%;border:1px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-xl,12px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);padding:10px;text-align:left;display:flex;flex-direction:column;gap:5px;font:inherit;cursor:pointer;will-change:transform}
.gl-fan-card:nth-child(3n+1){background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 96%,var(--dsw-alias-label-primary))}
.gl-fan-card:nth-child(3n+2){background:var(--dsw-alias-bg-layer-1)}
.gl-fan-card:nth-child(3n){background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 93%,var(--dsw-alias-label-primary))}
.gl-fan-card[aria-pressed=true]{border-color:var(--dsw-alias-state-business-primary);box-shadow:inset 0 0 0 1px var(--dsw-alias-state-business-primary)}
.gl-fan-card:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
.gl-fan-card:disabled{cursor:default;opacity:.6}
.gl-fan-top{display:flex;justify-content:space-between;font-size:10px;color:var(--dsw-alias-label-tertiary)}
.gl-fan-name{font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:auto}
.gl-fan-remaining{font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gl-fan-state{font-size:10px;line-height:14px;color:var(--dsw-alias-state-business-primary)}
.gl-fan[data-many=true]{height:auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:6px;padding:4px 0}
.gl-fan[data-many=true] .gl-fan-card{position:relative;top:auto;left:auto;width:100%!important;transform:none!important;height:100px;will-change:auto}
@media(prefers-reduced-motion:reduce){.gl-fan-card{will-change:auto}}

.gl-compact-tabs{display:flex;gap:4px;padding:0 12px 8px;flex:none}
.gl-compact-tabs button,.gl-account-tab,.gl-effort-button{border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary);border-radius:7px;padding:4px 9px;font:inherit;font-size:12px;cursor:pointer}
.gl-compact-tabs button[aria-pressed=true],.gl-account-tab[aria-pressed=true],.gl-effort-button[aria-pressed=true]{color:var(--dsw-alias-state-business-primary);border-color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 8%,transparent)}
.gl-account-tabs{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(96px,1fr);gap:6px;flex:none;overflow-x:auto;overflow-y:hidden;padding:2px 0 4px;scrollbar-width:thin}
.gl-account-tab{position:relative;box-sizing:border-box;display:flex;flex-direction:column;align-items:stretch;justify-content:center;gap:3px;width:100%;height:54px;min-width:0;border-radius:9px;padding:7px 10px;text-align:left}
.gl-account-tab>span:first-child{display:block;min-width:0;max-width:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:500;padding-right:8px}
.gl-account-tab small{display:block;font-size:10px;line-height:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary)}
.gl-account-tab[data-current=true]::after{content:'';position:absolute;top:8px;right:8px;width:5px;height:5px;border-radius:50%;background:var(--dsw-alias-state-business-primary)}
.gl-account-tab:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.gl-account-tab[aria-pressed=true]{box-shadow:inset 0 0 0 1px var(--dsw-alias-state-business-primary)}
.gl-account-tab:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}
.gl-preview-caption{font-size:11px;color:var(--dsw-alias-label-tertiary);display:flex;gap:6px;align-items:center;overflow-wrap:anywhere}
.gl-model-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px;flex:none}
.gl-model-cell{min-width:0;display:flex;align-items:center;justify-content:space-between;gap:4px;text-align:left;cursor:pointer;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary);border-radius:8px;padding:7px 9px;font:inherit;font-size:12px;min-height:34px}
.gl-model-cell>span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gl-model-cell:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.gl-model-cell[aria-pressed=true]{border-color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 8%,transparent)}
.gl-model-cell .gl-active-badge{font-size:9px;padding:0 4px}.gl-model-cell .gl-active-badge::before{display:none}
.gl-model-cell:disabled,.gl-account-tab:disabled,.gl-effort-button:disabled{opacity:.5;cursor:default}
.gl-efforts{display:flex;align-items:center;gap:4px;flex-wrap:wrap;font-size:11px;color:var(--dsw-alias-label-tertiary)}
.gl-efforts>span{margin-right:4px}.gl-effort-button{font-size:11px;padding:3px 8px}
.gl-compact-provider{width:100%;flex:none}

.gl-active-badge{display:inline-flex;align-items:center;flex:none;gap:4px;border-radius:5px;padding:1px 6px;font-size:10px;font-weight:500;line-height:16px;white-space:nowrap;color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 10%,transparent)}
.gl-active-badge::before{content:'';width:4px;height:4px;border-radius:50%;background:currentColor}
.gl-picker-account[data-selected=true]{border-color:var(--dsw-alias-state-business-primary)}
.gl-picker-account[data-selected=true]::after{content:'';position:absolute;inset:0;border:1px solid var(--dsw-alias-state-business-primary);border-radius:inherit;box-shadow:inset 2px 0 0 var(--dsw-alias-state-business-primary);pointer-events:none;z-index:5}
.gl-picker-account[data-selected=true]>.gl-picker-account-name{background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 6%,transparent)}
.gl-picker-account-name{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.gl-picker-account-name>.gl-active-badge{margin-left:auto}
.gl-picker-row[data-active=true]{background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 8%,transparent);box-shadow:inset 2px 0 0 var(--dsw-alias-state-business-primary)}
.gl-picker-row[data-active=true]>button{display:flex;align-items:center;gap:8px}
.gl-picker-row[data-active=true]>button>.gl-active-badge{margin-left:auto}
.gl-picker-row>button>span:first-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gl-picker-account-name>span:first-child{min-width:0;overflow-wrap:anywhere}

.gl-limit{min-width:0;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;padding:9px 12px;display:flex;flex-direction:column;gap:5px;background:var(--dsw-alias-settings-card-fill)}
.gl-limit-title{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px;font-weight:500;line-height:18px}
.gl-limit-title>.gl-limit-update{flex:none;gap:5px;font-weight:400;white-space:nowrap}
.gl-limit-meta{display:flex;align-items:baseline;justify-content:space-between;gap:10px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.gl-limit-meta [data-tone=error]{color:var(--dsw-alias-state-error-primary)}
.gl-limit-track{height:5px;overflow:hidden;border-radius:99px;background:var(--dsw-alias-bg-module-platform)}
.gl-limit-fill{height:100%;border-radius:99px;background:var(--dsw-alias-label-primary)}
.gl-limit-fill[data-tone=error]{background:var(--dsw-alias-state-error-primary)}
.gl-limit-stack{display:flex;flex-direction:column;gap:6px;min-width:0}
.gl-limit-update{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums}
.gl-limit-update .gl-icon{width:20px;height:20px}
.gl-picker-section{display:flex;flex-direction:column;gap:8px;flex:none}
.gl-picker-section>h3{font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--dsw-alias-label-tertiary);margin:2px 0;font-weight:600}
.gl-picker-others{border-top:1px solid var(--dsw-alias-border-l2);padding-top:10px}
.gl-picker-account{position:relative;isolation:isolate;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;overflow:hidden;flex:none}
.gl-picker-account[data-selected=true]{border-color:var(--dsw-alias-state-business-primary)}
.gl-picker-account>.gl-picker-group{border:0;border-radius:0}
.gl-picker-account-name{padding:8px 10px;font-weight:600;font-size:12px;overflow-wrap:anywhere}
.gl-picker-account-name small{font-weight:400;color:var(--dsw-alias-label-tertiary)}
.gl-picker-account>.gl-limit-stack,.gl-picker-account>.gl-note{margin:0;padding:0 8px 8px}
.gl-picker-account .gl-limit{padding:7px 9px}

.gl-picker-trigger{display:inline-flex;align-items:center;gap:6px;max-width:360px;min-width:0;border:0;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font:inherit;font-size:12px;padding:4px 6px;border-radius:8px}
.gl-picker-trigger:hover{background:var(--dsw-alias-interactive-bg-hover)}
.gl-picker-trigger>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:230px}
.gl-picker-quota{font-size:11px;color:var(--dsw-alias-label-tertiary);white-space:nowrap}
.gl-picker-dialog{box-sizing:border-box;width:min(480px,calc(100vw - 24px));max-height:min(640px,calc(100dvh - 32px));padding:0;border:1px solid var(--dsw-alias-border-l2);border-radius:16px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);overflow:hidden}
.gl-picker-dialog::backdrop{background:color-mix(in srgb,var(--dsw-alias-label-primary) 18%,transparent)}
.gl-picker-shell{display:flex;flex-direction:column;max-height:min(638px,calc(100dvh - 34px));font-size:13px;line-height:20px}
.gl-picker-head{display:flex;align-items:center;gap:10px;padding:10px 12px 8px}.gl-picker-head strong{flex:1;font-size:16px}
.gl-picker-search{margin:0 12px 8px;flex:none;box-sizing:border-box;width:calc(100% - 24px)}
.gl-picker-shell{min-height:0;overflow:hidden;isolation:isolate}
.gl-picker-shell>.gl-picker-head,.gl-picker-shell>.gl-picker-info{flex-shrink:0;position:relative;z-index:1;background:var(--dsw-alias-bg-layer-1)}
.gl-picker-list{flex:1 1 auto;min-height:0;overflow:auto;overscroll-behavior:contain;padding:4px 12px 12px;display:flex;flex-direction:column;gap:6px;position:relative;isolation:isolate;contain:paint;scroll-padding-block:8px}
.gl-picker-list .gl-picker-group>summary{position:static;inset:auto;z-index:auto}
.gl-picker-list .gl-picker-row{position:relative;z-index:auto;flex-shrink:0}
.gl-picker-list .gl-picker-group::details-content{position:static;overflow:visible}
.gl-picker-group{border:1px solid var(--dsw-alias-border-l2);border-radius:12px;overflow:hidden;flex:none}
.gl-picker-group>summary{cursor:pointer;list-style-position:inside;padding:8px 10px;background:var(--dsw-alias-settings-card-fill);overflow-wrap:anywhere;font-weight:600}
.gl-picker-group>summary small{display:block;font-size:11px;line-height:18px;font-weight:400;color:var(--dsw-alias-label-tertiary);margin:4px 0 0 16px}
.gl-picker-row{display:flex;align-items:center;gap:8px;padding:4px 10px;border-top:1px solid var(--dsw-alias-border-l2)}
.gl-picker-row>button{flex:1;min-width:0;text-align:left;border:0;background:transparent;color:inherit;cursor:pointer;padding:5px 4px;font:inherit;border-radius:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gl-picker-row>button:hover{background:var(--dsw-alias-interactive-bg-hover)}.gl-picker-row button[aria-pressed=true]{font-weight:600;color:var(--dsw-alias-state-business-primary)}
.gl-picker-row select{flex:none;max-width:112px;height:28px;background:var(--dsw-alias-bg-layer-1);color:inherit;border:1px solid var(--dsw-alias-border-l3);border-radius:6px;font:inherit;font-size:11px}
.gl-picker-row button:disabled{opacity:.5;cursor:default}.gl-picker-info{padding:0 12px 8px;margin:0;font-size:11px;color:var(--dsw-alias-label-secondary)}
@media(max-width:420px){.gl-picker-head{padding:12px}.gl-picker-list{padding:0 10px 12px}.gl-picker-trigger{max-width:230px}.gl-picker-quota{max-width:95px;overflow:hidden;text-overflow:ellipsis}}
`
    // Motion behavior adapted from DesignBookmark Fan Cards. No global theme or timers.
    function FanAccounts({ accounts, previewId, currentId, onPreview, quotaText, compactQuota, quotas, selecting, t }) {
      const root = React.useRef(null), nodes = React.useRef([]), engine = React.useRef(null)
      const [expanded, setExpanded] = React.useState(false)
      const [hot, setHot] = React.useState(-1)
      React.useEffect(() => {
        const media = matchMedia('(prefers-reduced-motion: reduce)')
        const spring = (x, k, c) => ({ x, t: x, v: 0, k, c })
        const model = { fan: spring(1, 220, 18), cards: accounts.map(() => (() => { const base = .65 + Math.random() * .7; return { lift: spring(0, 420, 20), scale: spring(1, 420, 22), energy: spring(base, 260, 24), base, phase: Math.random() * 33, direction: Math.random() > .5 ? 'normal' : 'reverse' } })()), reduced: media.matches, raf: 0, last: 0 }
        engine.current = model
        const step = (s, dt) => { s.v += (-s.k * (s.x - s.t) - s.c * s.v) * dt; s.x += s.v * dt }
        const settled = s => Math.abs(s.x - s.t) < .001 && Math.abs(s.v) < .01
        let cardWidth = 128, spread = 78
        model.cards.forEach((card, i) => {
          const node = nodes.current[i]; if (!node) return
          node.style.setProperty('--gl-orb-phase', '-' + card.phase.toFixed(3) + 's')
          node.style.setProperty('--gl-orb-direction', card.direction)
          card.animations = []
        })
        const render = () => {
          model.cards.forEach((card, i) => {
            const node = nodes.current[i]; if (!node) return
            const d = i - (accounts.length - 1) / 2
            const distance = Math.max(1, (accounts.length - 1) / 2)
            const x = d * (6 + model.fan.x * (spread - 6))
            const r = (d / distance) * (3 + model.fan.x * 9)
            const y = Math.abs(d / distance) * model.fan.x * 8 + card.lift.x
            if (!model.reduced && node.getAnimations) {
              if (!card.animations.length || card.animations.some(a => a.playState === 'idle')) card.animations = node.getAnimations({ subtree: true }).filter(a => ['gl-orb-turn', 'gl-orb-drift', 'gl-orb-breathe'].includes(a.animationName))
              const rate = Math.max(.5, card.energy.x)
              card.animations.forEach(animation => { if (Math.abs(animation.playbackRate - rate) > .005) animation.updatePlaybackRate(rate) })
            }
            node.style.transform = 'translate(calc(-50% + ' + x.toFixed(2) + 'px),' + y.toFixed(2) + 'px) rotate(' + r.toFixed(3) + 'deg) scale(' + card.scale.x.toFixed(4) + ')'
          })
        }
        const frame = time => {
          const dt = model.last ? Math.min((time - model.last) / 1000, 1 / 30) : 1 / 60; model.last = time
          for (let j = 0; j < 4; j++) { step(model.fan, dt / 4); model.cards.forEach(c => { step(c.lift, dt / 4); step(c.scale, dt / 4); step(c.energy, dt / 4) }) }
          render()
          if (![model.fan, ...model.cards.flatMap(c => [c.lift, c.scale, c.energy])].every(settled)) model.raf = requestAnimationFrame(frame)
          else { model.raf = 0; model.last = 0 }
        }
        model.wake = () => {
          if (model.reduced) { cancelAnimationFrame(model.raf); model.raf = 0; model.last = 0; [model.fan, ...model.cards.flatMap(c => [c.lift, c.scale, c.energy])].forEach(s => { s.x = s.t; s.v = 0 }); render(); return }
          if (!model.raf) model.raf = requestAnimationFrame(frame)
        }
        const reduce = () => { model.reduced = media.matches; model.cards.forEach(c => { c.animations = [] }); model.wake() }
        media.addEventListener('change', reduce)
        const resize = () => {
          const width = root.current?.clientWidth ?? 400
          cardWidth = Math.max(100, Math.min(144, width / Math.max(1, accounts.length)))
          spread = accounts.length < 2 ? 0 : Math.min(110, Math.max(34, (width - cardWidth - 14) / (accounts.length - 1)))
          nodes.current.forEach(node => { if (node) node.style.width = cardWidth + 'px' })
          render()
        }
        const visibility = () => { if (root.current) root.current.dataset.paused = document.hidden ? 'true' : 'false' }
        document.addEventListener('visibilitychange', visibility); visibility()
        const observer = new ResizeObserver(resize); if (root.current) observer.observe(root.current)
        const visibleCards = new IntersectionObserver(entries => entries.forEach(e => { e.target.dataset.offscreen = e.isIntersecting ? 'false' : 'true' }), { threshold: .01 })
        nodes.current.forEach(node => { if (node) visibleCards.observe(node) })
        resize(); model.wake()
        return () => { cancelAnimationFrame(model.raf); observer.disconnect(); visibleCards.disconnect(); document.removeEventListener('visibilitychange', visibility); media.removeEventListener('change', reduce); if (engine.current === model) engine.current = null }
      }, [accounts.map(a => a.id).join('|')])
      React.useEffect(() => {
        const model = engine.current; if (!model) return
        // Resting hand is already readable; interaction adds the original fan spread.
        model.fan.t = expanded ? 1 : .72
        model.cards.forEach((c, i) => { c.lift.t = i === hot ? -22 : 0; c.scale.t = i === hot ? 1.06 : 1; c.energy.t = c.base * (i === hot ? 2.8 : 1) })
        model.wake()
      }, [expanded, hot, accounts.map(a => a.id).join('|')])
      return h('div', { ref: root, className: 'gl-fan', role: 'group', 'aria-label': text(t, 'gptAccountsBlock'), 'data-many': accounts.length > 4 ? 'true' : undefined,
        onPointerEnter: () => setExpanded(true), onPointerLeave: () => { setExpanded(false); setHot(-1) },
        onFocus: () => setExpanded(true), onBlur: e => { if (!e.currentTarget.contains(e.relatedTarget)) { setExpanded(false); setHot(-1) } } },
        accounts.map((account, i) => h('button', { ref: node => { nodes.current[i] = node }, key: account.id, type: 'button', className: 'gl-fan-card',
          'aria-pressed': previewId === account.id, 'data-current': currentId === account.id ? 'true' : undefined,
          style: { zIndex: hot === i ? 30 : previewId === account.id ? 20 : i + 1 },
          title: account.label + ' · ' + quotaText(quotas[account.id]),
          'aria-label': account.label + ' · ' + (account.configured ? compactQuota(quotas[account.id]) : text(t, 'unconfigured')) + (currentId === account.id ? ' · ' + text(t, 'activeAccount') : ''),
          disabled: selecting, onPointerEnter: () => setHot(i), onFocus: () => setHot(i),
          onClick: () => { const c = engine.current?.cards[i]; if (c && !engine.current.reduced) { c.lift.v = -260; engine.current.wake() }; onPreview(account.id) } },
          h('span', { className: 'gl-card-orb-clip', 'aria-hidden': true }, h('span', { className: 'gl-card-orb' }, h('span', { className: 'gl-card-orb-sheen' }), h('span', { className: 'gl-card-orb-rim' }))),
          h('span', { className: 'gl-fan-top' }, h('span', null, 'ChatGPT'), h('span', null, String(i + 1).padStart(2, '0'))),
          h('strong', { className: 'gl-fan-name' }, account.label.split('@')[0]),
          h('span', { className: 'gl-fan-remaining' }, account.configured ? compactQuota(quotas[account.id]) : text(t, 'unconfigured')),
          h('span', { className: 'gl-fan-state' }, currentId === account.id ? text(t, 'activeAccount') : previewId === account.id ? text(t, 'pickerPreview') : '\u00a0'))))
    }

    function UnifiedPicker({ t, sessionId, useSession, directory, locked }) {
      const state = React.useSyncExternalStore(directory.store.subscribe, directory.store.getSnapshot, directory.store.getSnapshot)
      const { snapshot, refresh, error: accountError } = useAccounts(sessionId)
      const unavailable = useSession(s => s.subagent !== null)
      const busy = useSession(s => s.running || s.awaitingFirstTurn || s.pendingSubmissions.length > 0 || s.removed || s.subagent !== null) || locked
      const [open, setOpen] = React.useState(false)
      const [query, setQuery] = React.useState('')
      const [quotas, setQuotas] = React.useState({})
      const [quotaPending, setQuotaPending] = React.useState({})
      const quotaRequests = React.useRef(new Set())
      const [now, setNow] = React.useState(Date.now())
      React.useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer) }, [])
      const [error, setError] = React.useState('')
      const [selecting, setSelecting] = React.useState(false)
      const [tab, setTab] = React.useState('gpt')
      const [previewId, setPreviewId] = React.useState(null)
      const [otherProvider, setOtherProvider] = React.useState(null)
      const [commonEffort, setCommonEffort] = React.useState(null)
      const dialog = React.useRef(null), trigger = React.useRef(null), inFlight = React.useRef(false)
      const selectedId = snapshot?.sessionAccountId
      const accounts = snapshot?.accounts ?? []
      const selectedAccount = accounts.find(a => a.id === selectedId)
      const group = state.groups.find(g => g.id === state.current?.provider)
      const currentModel = group?.models.find(m => m.id === state.current?.model)
      const quotaText = card => !card || !card.windows?.length ? text(t, 'pickerUnknown') : card.windows.map(w => windowLabel(t, w) + ': ' + (Number.isFinite(w.usedPercent) ? text(t, 'remaining', { n: String(Math.round(Math.max(0, Math.min(100, 100 - w.usedPercent)))) }) : text(t, 'pickerUnknown'))).join(' · ') + (card.freshness === 'stale' ? ' ≈' : '')
      const loadQuota = React.useCallback(async (ids, force = false, signal) => {
        await Promise.all(ids.map(async id => {
          if (quotaRequests.current.has(id)) return
          quotaRequests.current.add(id)
          setQuotaPending(old => ({ ...old, [id]: true }))
          try {
            const card = await request('api/chatgpt-quota?accountId=' + encodeURIComponent(id), force ? {} : undefined, signal)
            if (!signal?.aborted) setQuotas(old => ({ ...old, [id]: card }))
          } catch {
            if (!signal?.aborted) setQuotas(old => old[id] ? { ...old, [id]: { ...old[id], freshness: 'stale' } } : old)
          } finally {
            quotaRequests.current.delete(id)
            setQuotaPending(old => ({ ...old, [id]: false }))
          }
        }))
      }, [])
      React.useEffect(() => { if (!unavailable) void directory.load().catch(e => setError(e.message)) }, [directory, unavailable])
      React.useEffect(() => {
        const controller = new AbortController()
        const ids = (open ? accounts.filter(a => a.configured).map(a => a.id) : selectedId ? [selectedId] : [])
        if (ids.length) void loadQuota(ids, false, controller.signal)
        const timer = setInterval(() => { if (ids.length) void loadQuota(ids, false, controller.signal) }, 60000)
        return () => { controller.abort(); clearInterval(timer) }
      }, [open, selectedId, accounts.map(a => a.id + a.configured).join(','), loadQuota])
      React.useEffect(() => {
        const node = dialog.current
        if (open) { if (node && !node.open) node.showModal() }
        else if (node?.open) { node.close(); trigger.current?.focus() }
        return () => { if (node?.open) node.close() }
      }, [open])
      const close = () => { if (!inFlight.current) { setOpen(false); trigger.current?.focus() } }
      const choose = async (account, provider, model) => {
        if (busy || inFlight.current) return
        inFlight.current = true; setSelecting(true); setError('')
        let changedAccount = false
        try {
          if (account && account.id !== selectedId) {
            await request('api/chatgpt-accounts', { action: 'select', sessionId, accountId: account.id })
            changedAccount = true; accountsChanged(); await refresh()
          }
          const key = provider + '/' + model.id
          const preferredEffort = displayedEffort
          const effort = model.reasoning?.efforts?.some(level => level.id === preferredEffort) ? preferredEffort : model.reasoning?.defaultEffort
          const result = await directory.select({ provider, model: model.id, ...(effort ? { reasoningEffort: effort } : {}) })
          if (!result.ok) throw new Error(result.error?.message ?? 'Selection failed')
          setOpen(false); trigger.current?.focus()
        } catch (e) {
          setError((changedAccount ? text(t, 'pickerPartial') + ' ' : '') + (e.message ?? 'Selection failed'))
        } finally { inFlight.current = false; setSelecting(false) }
      }
      const nativeModels = state.groups.find(g => g.id === 'chatgpt-session')?.models ?? []
      const otherGroups = state.groups.filter(g => g.id !== 'chatgpt-session')
      const previewAccount = accounts.find(a => a.id === previewId) ?? selectedAccount ?? accounts[0]
      const previewGroup = otherGroups.find(g => g.id === otherProvider) ?? otherGroups.find(g => g.id === state.current?.provider) ?? otherGroups[0]
      const provider = tab === 'gpt' ? 'chatgpt-session' : previewGroup?.id
      const models = tab === 'gpt' ? nativeModels : previewGroup?.models ?? []
      const previewIsCurrent = tab === 'gpt' ? state.current?.provider === 'chatgpt-session' && previewAccount?.id === selectedId : state.current?.provider === provider
      const levels = [...new Map(models.flatMap(m => m.reasoning?.efforts ?? []).map(level => [level.id, level])).values()]
      const displayedEffort = commonEffort ?? (previewIsCurrent ? state.current?.reasoningEffort : undefined) ?? models[0]?.reasoning?.defaultEffort
      const visibleModels = models.filter(m => m.name.toLowerCase().includes(query.trim().toLowerCase()))
      const compactQuota = card => {
        const w = card?.windows?.find(w => w.id === 'weekly' || w.id?.includes('week')) ?? card?.windows?.[0]
        return w && Number.isFinite(w.usedPercent) ? text(t, 'remaining', { n: String(Math.round(Math.max(0, Math.min(100, 100 - w.usedPercent)))) }) + (card.freshness === 'stale' ? ' ≈' : '') : '—'
      }
      const triggerQuotaText = card => {
        const w = card?.windows?.find(w => w.windowDurationMins === 10080 && !w.id.includes(':')) ?? card?.windows?.[0]
        if (!w) return text(t, 'pickerUnknown')
        const remaining = Number.isFinite(w.usedPercent) ? Math.round(Math.max(0, Math.min(100, 100 - w.usedPercent))) + '%' : '—'
        const reset = Number.isFinite(w.resetsAt) ? text(t, 'resetCountdown', { span: span(t, w.resetsAt - now) }) : text(t, 'noReset')
        return remaining + ' · ' + reset + (card.freshness === 'stale' ? ' ≈' : '')
      }
      const triggerLabel = currentModel ? currentModel.name + (state.current?.reasoningEffort ? ' · ' + state.current.reasoningEffort : '') + (state.current?.provider === 'chatgpt-session' && selectedAccount ? ' · ' + selectedAccount.label : '') : text(t, 'pickerChoose')
      if (unavailable) return null
      return h(React.Fragment, null,
        h('style', null, css + pickerCss),
        h('button', { ref: trigger, type: 'button', className: 'gl-picker-trigger', title: triggerLabel, onClick: () => { setQuery(''); setTab(state.current?.provider === 'chatgpt-session' ? 'gpt' : 'other'); setPreviewId(selectedId ?? null); setOtherProvider(state.current?.provider ?? null); setCommonEffort(null); setOpen(true) }, disabled: !!locked, 'aria-haspopup': 'dialog', 'aria-expanded': open },
          h('span', null, triggerLabel), state.current?.provider === 'chatgpt-session' && selectedId ? h('small', { className: 'gl-picker-quota', title: quotaText(quotas[selectedId]) + ' · ' + triggerQuotaText(quotas[selectedId]) }, triggerQuotaText(quotas[selectedId])) : null, ' ▾'),
        h('dialog', { ref: dialog, className: 'gl-picker-dialog', 'aria-label': text(t, 'pickerTitle'), onCancel: e => { e.preventDefault(); close() }, onClick: e => { if (e.target === dialog.current) close() } },
          h('div', { className: 'gl-picker-shell' },
            h('header', { className: 'gl-picker-head' }, h('strong', null, text(t, 'pickerTitle')),
              h('button', { type: 'button', className: 'gl-icon', title: text(t, 'pickerRefresh'), 'aria-label': text(t, 'pickerRefresh'), disabled: selecting, onClick: () => { void directory.load().catch(e => setError(e.message)); void refresh(); void loadQuota(accounts.filter(a => a.configured).map(a => a.id), true) } }, RefreshIcon),
              h('button', { type: 'button', className: 'gl-icon', 'aria-label': text(t, 'pickerClose'), disabled: selecting, onClick: close }, '×')),
            tab === 'other' ? h('input', { className: 'gl-input gl-picker-search', value: query, placeholder: text(t, 'pickerChoose'), 'aria-label': text(t, 'pickerSearch'), onChange: e => setQuery(e.target.value) }) : null,
            h('div', { className: 'gl-compact-tabs', role: 'group', 'aria-label': text(t, 'pickerTitle') },
              h('button', { type: 'button', 'aria-pressed': tab === 'gpt', onClick: () => { setTab('gpt'); setQuery(''); setCommonEffort(null) } }, 'ChatGPT'),
              h('button', { type: 'button', 'aria-pressed': tab === 'other', onClick: () => { setTab('other'); setQuery(''); setCommonEffort(null) } }, text(t, 'pickerTabOther'))),
            busy ? h('p', { className: 'gl-picker-info', role: 'status' }, text(t, 'pickerBusy')) : null,
            accountError ? h('p', { className: 'gl-picker-info', role: 'alert' }, accountError) : !snapshot ? h('p', { className: 'gl-picker-info', role: 'status' }, text(t, 'loading')) : !accounts.length ? h('p', { className: 'gl-picker-info' }, text(t, 'pickerEmptyAccounts')) : null,
            error || state.error ? h('p', { className: 'gl-picker-info', role: 'alert' }, error || state.error) : null,
            h('div', { className: 'gl-picker-list' },
              tab === 'gpt' ? h(React.Fragment, null,
                h(FanAccounts, { accounts, previewId: previewAccount?.id, currentId: state.current?.provider === 'chatgpt-session' ? selectedId : null,
                  onPreview: id => { setPreviewId(id); setQuery('') }, quotaText, compactQuota, quotas, selecting, t }),
                previewAccount ? h('div', { className: 'gl-preview-caption' }, h('span', null, previewAccount.label), h('span', { className: 'gl-active-badge' }, text(t, previewIsCurrent ? 'activeAccount' : 'pickerPreview'))) : null,
                previewAccount?.configured ? h(RemainingQuota, { t, card: quotas[previewAccount.id], now, pending: !!quotaPending[previewAccount.id], onRefresh: () => void loadQuota([previewAccount.id], true) }) : null)
                : h('select', { className: 'gl-input gl-compact-provider', value: previewGroup?.id ?? '', 'aria-label': text(t, 'otherProvidersBlock'), onChange: e => { setOtherProvider(e.target.value); setCommonEffort(null); setQuery('') } }, otherGroups.map(g => h('option', { value: g.id, key: g.id }, g.name))),
              levels.length ? h('div', { className: 'gl-efforts', role: 'group', 'aria-label': text(t, 'pickerReasoning') },
                h('span', null, text(t, 'pickerReasoning')),
                levels.map(level => h('button', { className: 'gl-effort-button', type: 'button', key: level.id, disabled: busy || selecting, 'aria-pressed': displayedEffort === level.id, onClick: () => setCommonEffort(level.id) }, level.name ?? level.id))) : null,
              h('div', { className: 'gl-model-grid' }, visibleModels.map(model => {
                const active = previewIsCurrent && state.current?.model === model.id
                const unsupportedEffort = !!model.reasoning?.efforts?.length && !!displayedEffort && !model.reasoning.efforts.some(level => level.id === displayedEffort)
                return h('button', { type: 'button', className: 'gl-model-cell', key: model.id, 'aria-pressed': active,
                  disabled: busy || selecting || unsupportedEffort || (tab === 'gpt' && !previewAccount?.configured),
                  title: model.name + ' · ' + (displayedEffort ?? ''), onClick: () => void choose(tab === 'gpt' ? previewAccount : null, provider, model) },
                  h('span', null, model.name), active ? h('span', { className: 'gl-active-badge' }, text(t, 'activeModel')) : null)
              })),
              !visibleModels.length ? h('p', { className: 'gl-note', role: 'status' }, text(t, state.status === 'loading' ? 'pickerLoad' : query ? 'pickerNoResults' : 'pickerEmptyModels')) : null,
              h('p', { className: 'gl-note' }, text(t, 'pickerApplyHint'))))))

    }

    // A link glyph, drawn with currentColor through a mask so it follows the nav's own color.
    const NAV_GLYPH = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="#000" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7.2 5.6l.9-.9a2.6 2.6 0 0 1 3.7 3.7l-1.5 1.5a2.6 2.6 0 0 1-3.7 0"/><path d="M8.8 10.4l-.9.9a2.6 2.6 0 0 1-3.7-3.7l1.5-1.5a2.6 2.6 0 0 1 3.7 0"/></svg>')
    const navCss = `
[data-gl-nav] > svg{display:none}
[data-gl-nav]::before{content:"";flex:none;width:16px;height:16px;background:currentColor;-webkit-mask:url("data:image/svg+xml,${NAV_GLYPH}") center/16px no-repeat;mask:url("data:image/svg+xml,${NAV_GLYPH}") center/16px no-repeat}
`

    /**
     * Give this section's nav entry its own icon.
     *
     * The settings shell picks nav icons from a fixed table of built-in ids and gives every
     * other section a gear, with no way to pass one in. So the entry is found by its label
     * and only marked with an attribute; the swap itself is CSS, which leaves React's nodes
     * untouched. If the shell changes its markup, the gear simply comes back.
     */
    function markNavEntry(label) {
      const style = document.createElement('style')
      style.textContent = navCss
      document.head.appendChild(style)
      let queued = 0
      const mark = () => {
        queued = 0
        const name = label()
        for (const span of document.querySelectorAll('button > span:last-child')) {
          const button = span.parentElement
          if (span.textContent === name && button.firstElementChild?.tagName.toLowerCase() === 'svg') {
            if (!button.hasAttribute('data-gl-nav')) button.setAttribute('data-gl-nav', '')
          } else if (button.hasAttribute('data-gl-nav')) {
            button.removeAttribute('data-gl-nav')
          }
        }
      }
      // Element additions are what open settings or relabel the nav; text edits (a streaming
      // reply) are not watched, and a burst of mutations costs one scan per frame.
      const observer = new MutationObserver(() => {
        if (queued === 0) queued = requestAnimationFrame(mark)
      })
      observer.observe(document.body, { childList: true, subtree: true })
      mark()
      return () => {
        observer.disconnect()
        cancelAnimationFrame(queued)
        style.remove()
        for (const button of document.querySelectorAll('[data-gl-nav]')) button.removeAttribute('data-gl-nav')
      }
    }

    return {
      inject: ['slots', 'locale', 'modelDirectories'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, copy), 'dsh-gpt-link: locale')
        const t = ctx.locale.bind(NS)
        // Navigation keeps the host's own icon; do not mutate other slots' DOM.
        // Do not filter another provider's DOM or auto-select a model/account.
        ctx.slots.inject('conversation.input.model', () => ctx.slots.register({
          name: 'conversation.input.model', priority: -100, locale: NS,
        }, props => h(UnifiedPicker, { ...props, t, directory: ctx.modelDirectories.directoryFor(props.sessionId) })))
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'codex-link',
          order: 40,
          label: () => t('nav'),
          locale: NS,
        }, function GptLinkSettings() {
          return h(GptLinkSection, { t })
        }))
      },
    }
  },
})
