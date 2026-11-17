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
.gl-subagent-setup{padding:16px;display:flex;flex-direction:column;gap:10px;min-width:0;box-sizing:border-box}
.gl-subagent-setup>.gl-account-heading{padding:0;margin:0;font-size:14px;line-height:22px}
.gl-subagent-setup>.gl-note{max-width:62ch}
.gl-setup-status{display:flex;align-items:center;gap:8px;color:var(--dsw-alias-label-primary);font-weight:500}
.gl-subagent-setup>.gl-choices{padding-top:4px;gap:8px}
.gl-subagent-setup .gl-sub{padding:12px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-1)}
.gl-subagent-setup .gl-sub ul{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(min(210px,100%),1fr));gap:6px}
.gl-subagent-setup .gl-sub li{padding:6px 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere}
.gl-subagent-setup .gl-btn{max-width:100%;height:auto;min-height:32px;padding:6px 12px;white-space:normal;text-align:center;justify-content:center;line-height:18px}
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
    let defaultsCsrfToken = null
    let resetCsrfToken = null
    async function request(path, body, signal) {
      const defaultsRequest = path === 'api/chatgpt-defaults'
      if (defaultsRequest && body !== undefined && !defaultsCsrfToken) {
        await request('api/chatgpt-defaults', undefined, signal)
        if (!defaultsCsrfToken) throw new Error('DEFAULT_CSRF_INVALID')
      }
      const resetRequest = path.startsWith('api/chatgpt-resets')
      if (resetRequest && body !== undefined && !resetCsrfToken) {
        await request('api/chatgpt-resets?accountId=' + encodeURIComponent(body.accountId), undefined, signal)
        if (!resetCsrfToken) throw new Error('RESET_CSRF_INVALID')
      }
      const response = await fetch(path, {
        method: body === undefined ? 'GET' : 'POST', cache: 'no-store', credentials: 'same-origin', signal,
        headers: { accept: 'application/json', ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(resetRequest && body !== undefined ? { 'x-chatgpt-reset-csrf': resetCsrfToken } : {}), ...(defaultsRequest && body !== undefined ? { 'x-chatgpt-defaults-csrf': defaultsCsrfToken } : {}) },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      })
      const result = await response.json().catch(() => null)
      if (resetRequest && body === undefined && typeof result?.csrfToken === 'string' && /^[a-f0-9]{64}$/.test(result.csrfToken)) resetCsrfToken = result.csrfToken
      if (resetRequest && result?.error === 'RESET_CSRF_INVALID') resetCsrfToken = null
      if (defaultsRequest && body === undefined && response.ok && typeof result?.csrfToken === 'string' && /^[a-f0-9]{64}$/.test(result.csrfToken)) defaultsCsrfToken = result.csrfToken
      if (defaultsRequest && result?.error === 'DEFAULT_CSRF_INVALID') defaultsCsrfToken = null
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
    // Factory injection: after copy.ru is defined, before locale registration.
    // Existing lexical dependencies: React, h, copy, request(path, body, signal).
    // Render ONLY inside the weekly RemainingQuota block, below the fan cards:
    // h(ResetMenu, { t, accountId, accountLabel, disabled, onConsumed })
    // Source: designbookmark.com/motion-src/dynamic-menu/{menu.js,menu.css}
    // and shared/{motion.js,tokens.css}. No shared Motion globals or autoplay.
    Object.assign(copy.en, {
      resetLimit: 'Reset limit', resetRefresh: 'Refresh resets', resetLoading: 'Loading resets…',
      resetEmpty: 'No available resets.', resetError: 'Could not load resets. Refresh to try again.',
      resetExpires: 'Expires: {time}', resetNoExpiry: 'Expiration not provided', resetType: 'Reset type: {type}',
      resetUnknownType: 'Unspecified', resetStepOne: 'Warning · 1 of 2', resetStepTwo: 'Final warning · 2 of 2',
      resetWarningOne: 'Account: {account}. {type}. This permanently spends one reset. This is not the automatic quota reset timer.',
      resetWarningTwo: 'Account: {account}. {type}. Spending this reset cannot be undone. Continue only if you want to spend it now.',
      resetContinue: 'Continue to final warning', resetSpend: 'Yes, spend reset', resetCancel: 'Cancel',
      resetUnknown: 'The result is unknown. Do not repeat the spend. Check quota and refresh the reset list.',
      resetDone: 'Reset spent. Quota refresh requested.', resetActionError: 'Confirmation failed. Cancel and refresh the list.',
      resetUpdated: 'List updated: {time}', resetFreshness: 'Freshness: {value}',
    })
    Object.assign(copy.ru, {
      resetLimit: 'Сброс лимита', resetRefresh: 'Обновить сбросы', resetLoading: 'Загрузка сбросов…',
      resetEmpty: 'Доступных сбросов нет.', resetError: 'Не удалось загрузить сбросы. Обновите список.',
      resetExpires: 'Действует до: {time}', resetNoExpiry: 'Срок действия не указан', resetType: 'Тип сброса: {type}',
      resetUnknownType: 'Не указан', resetStepOne: 'Предупреждение · 1 из 2', resetStepTwo: 'Последнее предупреждение · 2 из 2',
      resetWarningOne: 'Аккаунт: {account}. {type}. Будет безвозвратно потрачен один сброс. Это не таймер автоматического обновления квоты.',
      resetWarningTwo: 'Аккаунт: {account}. {type}. Расход этого сброса нельзя отменить. Продолжайте, только если хотите потратить его сейчас.',
      resetContinue: 'К последнему предупреждению', resetSpend: 'Да, потратить сброс', resetCancel: 'Отмена',
      resetUnknown: 'Результат неизвестен. Не повторяйте расход. Проверьте квоту и обновите список сбросов.',
      resetDone: 'Сброс потрачен. Запрошено обновление квоты.', resetActionError: 'Подтверждение не удалось. Отмените и обновите список.',
      resetUpdated: 'Список обновлён: {time}', resetFreshness: 'Актуальность: {value}',
    })
    Object.assign(copy.zh, {
      resetLimit: '重置额度', resetRefresh: '刷新重置次数', resetLoading: '正在加载重置次数…',
      resetEmpty: '没有可用的重置次数。', resetError: '无法加载重置次数，请刷新列表。',
      resetExpires: '有效期至：{time}', resetNoExpiry: '未提供有效期', resetType: '重置类型：{type}',
      resetUnknownType: '未指定', resetStepOne: '警告 · 第 1/2 步', resetStepTwo: '最终警告 · 第 2/2 步',
      resetWarningOne: '账号：{account}。{type}。这将永久消耗一次重置，并非额度自动恢复倒计时。',
      resetWarningTwo: '账号：{account}。{type}。消耗此重置无法撤销。仅在确定现在使用时继续。',
      resetContinue: '继续查看最终警告', resetSpend: '是，消耗一次重置', resetCancel: '取消',
      resetUnknown: '结果未知，请勿重复消耗。请检查额度并刷新重置列表。',
      resetDone: '已消耗重置，已请求刷新额度。', resetActionError: '确认失败，请取消并刷新列表。',
      resetUpdated: '列表更新时间：{time}', resetFreshness: '新鲜度：{value}',
    })

    copy.en.resetCodexType = 'Full reset of Codex rate limits'
    copy.ru.resetCodexType = 'Полный сброс лимитов Codex'
    copy.zh.resetCodexType = '完全重置 Codex 速率限制'

    copy.en.resetDescription = 'Restores eligible 5-hour/weekly Codex limits; does not change your plan.'
    copy.ru.resetDescription = 'Восстанавливает доступные 5-часовые/недельные лимиты Codex; не меняет тариф.'
    copy.zh.resetDescription = '恢复符合条件的 Codex 5 小时/每周额度；不会更改套餐。'
    copy.en.resetWait = 'Please wait…'
    copy.ru.resetWait = 'Подождите…'
    copy.zh.resetWait = '请稍候…'

    Object.assign(copy.ru, { resetNothing: 'Лимиты уже восстановлены: сейчас сбрасывать нечего.', resetNoCredit: 'Этот сброс больше недоступен. Обновите список.', resetAlready: 'Этот сброс уже был использован. Обновите список.' })
    Object.assign(copy.en, { resetNothing: 'Limits are already restored; nothing to reset now.', resetNoCredit: 'This reset is no longer available. Refresh the list.', resetAlready: 'This reset has already been used. Refresh the list.' })
    Object.assign(copy.zh, { resetNothing: '额度已恢复，目前无需重置。', resetNoCredit: '此次重置已不可用，请刷新列表。', resetAlready: '此次重置已使用，请刷新列表。' })
    Object.assign(copy.ru, { resetCardTitle: 'Полный сброс', resetCardsTitle: 'Доступные сбросы', resetCardExpiry: 'До {time}' })
    Object.assign(copy.en, { resetCardTitle: 'Full reset', resetCardsTitle: 'Available resets', resetCardExpiry: 'Until {time}' })
    Object.assign(copy.zh, { resetCardTitle: '完全重置', resetCardsTitle: '可用重置', resetCardExpiry: '有效期至 {time}' })
    function MiniCardOrb({ seed = 0 }) {
      return h('span', { className: 'gl-mini-orb', 'aria-hidden': true, style: { '--gl-orb-phase': '-' + (seed * 7.13).toFixed(2) + 's', '--gl-orb-direction': seed % 2 ? 'reverse' : 'normal' } }, h('span', { className: 'gl-card-orb' }, h('span', { className: 'gl-card-orb-sheen' })))
    }
    function ResetChoiceCard({ children, disabled, onClick, ...props }) {
      const node = React.useRef(null), engine = React.useRef(null)
      React.useEffect(() => {
        const media = matchMedia('(prefers-reduced-motion: reduce)')
        const base = .65 + Math.random() * .7
        const model = { rate: base, target: base, velocity: 0, lift: 0, liftTarget: 0, liftVelocity: 0, raf: 0, last: 0 }
        engine.current = model
        const animations = () => node.current?.getAnimations({ subtree: true }).filter(a => ['gl-orb-turn','gl-orb-drift','gl-orb-breathe'].includes(a.animationName)) ?? []
        const render = () => {
          if (!node.current) return
          node.current.style.transform = 'translateY(' + model.lift.toFixed(2) + 'px)'
          for (const animation of animations()) animation.updatePlaybackRate(Math.max(.5, model.rate))
        }
        const frame = time => {
          const dt = Math.min(model.last ? (time-model.last)/1000 : 1/60,1/30); model.last=time
          for(let i=0;i<4;i++) {
            model.velocity += (-260*(model.rate-model.target)-24*model.velocity)*dt/4; model.rate+=model.velocity*dt/4
            model.liftVelocity += (-420*(model.lift-model.liftTarget)-20*model.liftVelocity)*dt/4; model.lift+=model.liftVelocity*dt/4
          }
          render()
          if(Math.abs(model.rate-model.target)>.001||Math.abs(model.velocity)>.01||Math.abs(model.lift-model.liftTarget)>.01||Math.abs(model.liftVelocity)>.01)model.raf=requestAnimationFrame(frame)
          else {model.raf=0;model.last=0}
        }
        model.hot = value => {
          model.target=base*(value?2.8:1);model.liftTarget=value?-4:0
          if(media.matches){cancelAnimationFrame(model.raf);model.raf=0;model.lift=0;model.rate=base;render()}
          else if(!model.raf)model.raf=requestAnimationFrame(frame)
        }
        const reduce=()=>model.hot(false);media.addEventListener('change',reduce)
        render();return()=>{cancelAnimationFrame(model.raf);media.removeEventListener('change',reduce);engine.current=null}
      }, [])
      return h('button', { ...props, ref: node, type:'button', disabled,
        onPointerEnter:()=>{if(!disabled)engine.current?.hot(true)},onPointerLeave:()=>engine.current?.hot(false),
        onFocus:()=>{if(!disabled)engine.current?.hot(true)},onBlur:()=>engine.current?.hot(false),onClick },children)
    }

    Object.assign(copy.ru, {
      resetBusyError: 'Аккаунт занят работающей сессией. Дождитесь её завершения и выберите сброс снова.',
      resetAuthError: 'Авторизация аккаунта истекла или отклонена. Обновите авторизацию в настройках ChatGPT.',
      resetCreditError: 'Этот сброс уже недоступен или истёк. Обновите данные верхней кнопкой ↻.',
      resetConsentError: 'Подтверждение истекло или аккаунт изменился. Выберите сброс заново.',
      resetOriginError: 'Запрос заблокирован проверкой адреса окна DSH. Обновите страницу; если повторится, сообщите код ниже.',
      resetNetworkError: 'Сервис сбросов недоступен или ограничивает запросы. Повторите позже.',
    })
    Object.assign(copy.en, { resetBusyError: 'Account is busy in a running session. Wait for it to finish, then select the reset again.', resetAuthError: 'Account authorization expired or was rejected. Reauthorize in ChatGPT settings.', resetCreditError: 'This reset expired or is no longer available. Refresh using ↻ above.', resetConsentError: 'Confirmation expired or the account changed. Select the reset again.', resetOriginError: 'Blocked by the DSH origin check. Reload the page and report the code if it persists.', resetNetworkError: 'Reset service unavailable or rate limited. Try later.' })
    Object.assign(copy.zh, { resetBusyError: '账号正在被运行中的会话使用，请等待结束后重试。', resetAuthError: '账号授权已过期或被拒绝，请在设置中重新授权。', resetCreditError: '此重置已过期或不可用，请点击上方 ↻ 刷新。', resetConsentError: '确认已过期或账号已更改，请重新选择。', resetOriginError: 'DSH 来源检查已阻止请求，请刷新页面。', resetNetworkError: '重置服务不可用或请求受限，请稍后重试。' })
    function resetErrorKey(code) {
      if (code === 'ACCOUNT_BUSY' || code === 'LOGIN_IN_PROGRESS') return 'resetBusyError'
      if (['RESET_TOKEN_EXPIRED','RESET_SIGNED_OUT','RESET_AUTH','ACCOUNT_SIGNED_OUT'].includes(code)) return 'resetAuthError'
      if (code === 'RESET_CREDIT_UNAVAILABLE') return 'resetCreditError'
      if (['RESET_CONFIRMATION_INVALID','RESET_CONFIRMATION_EXPIRED','RESET_ACCOUNT_CHANGED'].includes(code)) return 'resetConsentError'
      if (code === 'RESET_FORBIDDEN_ORIGIN' || code === 'RESET_CSRF_INVALID') return 'resetOriginError'
      if (['RESET_NETWORK','RESET_THROTTLED','RESET_HTTP','RESET_UNAVAILABLE'].includes(code)) return 'resetNetworkError'
      return 'resetActionError'
    }
    function ResetMenu({ t, accountId, accountLabel, disabled, onConsumed, onBusyChange, autoOpen = false }) {
      const [open, setOpen] = React.useState(false)
      const [data, setData] = React.useState(null)
      const [flow, setFlow] = React.useState(null)
      const [busy, setBusy] = React.useState(false)
      const [message, setMessage] = React.useState('')
      const [errorCode, setErrorCode] = React.useState('')
      const root = React.useRef(null), head = React.useRef(null), body = React.useRef(null)
      const cancelButton = React.useRef(null), epoch = React.useRef(0), controller = React.useRef(null)
      const lock = React.useRef(false), armed = React.useRef(false), consuming = React.useRef(false)
      const flowRef = React.useRef(null)
      const cancelNonce = pending => {
        if (pending?.nonce) request('api/chatgpt-resets', { action: 'cancel', accountId: pending.accountId, nonce: pending.nonce }).catch(() => {})
      }
      const current = React.useRef({ accountId, open, disabled })
      current.current = { accountId, open, disabled }
      const menuId = React.useId()
      const tr = (key, vars) => {
        let value = t(key)
        Object.entries(vars || {}).forEach(([k, v]) => { value = String(value).split('{' + k + '}').join(String(v)) })
        return value
      }
      const stamp = value => {
        const date = new Date(value)
        return value && Number.isFinite(date.getTime()) ? date.toLocaleString() : tr('resetNoExpiry')
      }
      const typeText = credit => tr('resetType', { type: credit?.resetType === 'codex_rate_limits' ? tr('resetCodexType') : tr('resetUnknownType') })
      const invalidate = () => {
        if (consuming.current) return
        cancelNonce(flowRef.current); flowRef.current = null
        epoch.current++; controller.current?.abort(); controller.current = null
        lock.current = false; armed.current = false; setBusy(false); setFlow(null)
      }
      const close = () => { if (consuming.current) return; invalidate(); setOpen(false); head.current?.focus() }
      React.useEffect(() => {
        invalidate(); setOpen(autoOpen); setData(null); setMessage(''); setErrorCode('')
        if (autoOpen) void load(false)
        return () => { epoch.current++; controller.current?.abort(); if (!consuming.current) { cancelNonce(flowRef.current); flowRef.current = null } }
      }, [accountId, autoOpen])
      React.useEffect(() => { if (disabled && !consuming.current && flowRef.current) { invalidate(); setOpen(autoOpen) } }, [disabled, autoOpen])
      const load = async refresh => {
        if (!accountId || lock.current) return
        const token = ++epoch.current
        controller.current?.abort(); controller.current = new AbortController()
        lock.current = true; setBusy(true); setFlow(null); setMessage('')
        try {
          const result = await request(refresh ? 'api/chatgpt-resets' : 'api/chatgpt-resets?accountId=' + encodeURIComponent(accountId),
            refresh ? { action: 'list', accountId } : undefined, controller.current.signal)
          if (token !== epoch.current) return
          if (result?.error || !Array.isArray(result?.credits) || result.availableCount === null) throw new Error('invalid-list')
          setData(result)
        } catch (error) { if (token === epoch.current && error.name !== 'AbortError') { setData(null); setMessage('resetError') } }
        finally { if (token === epoch.current) { lock.current = false; setBusy(false) } }
      }
      const change = async (action, credit) => {
        if (lock.current || disabled || !open || !accountId) return
        if (action !== 'begin' && !armed.current) return
        if (action === 'advance' && flow?.stage !== 1 || action === 'consume' && flow?.stage !== 2) return
        armed.current = false; lock.current = true; setBusy(true); setMessage(''); setErrorCode('')
        const token = ++epoch.current
        const payload = action === 'begin' ? { creditId: credit.id } : { nonce: flow.nonce }
        if (action === 'consume') { consuming.current = true; try { onBusyChange?.(true) } catch (_) {} }
        try {
          const result = await request('api/chatgpt-resets', { action, accountId, ...payload })
          if (token !== epoch.current) {
            if (action !== 'consume') cancelNonce({ accountId, nonce: result?.nonce })
            else if (result?.outcome === 'reset') { try { onConsumed?.(accountId, result) } catch (_) {} }
            return
          }
          if (action === 'consume') {
            flowRef.current = null; setFlow(null); setData(null)
            const success = result?.outcome === 'reset'
            setMessage(({ reset: 'resetDone', nothing_to_reset: 'resetNothing', no_credit: 'resetNoCredit', already_redeemed: 'resetAlready' })[result?.outcome] ?? 'resetUnknown')
            if (success) { try { onConsumed?.(accountId, result) } catch (_) {} }
          } else {
            const stage = action === 'begin' ? 1 : 2
            if (result?.stage !== stage || typeof result.nonce !== 'string' || !result.nonce) throw new Error('invalid-confirmation')
            flowRef.current = { accountId, stage, nonce: result.nonce, credit: credit || flow.credit }
            setFlow(flowRef.current)
          }
        } catch (error) {
          if (token === epoch.current) {
            const code = typeof error?.message === 'string' && /^[A-Z_]{1,60}$/.test(error.message) ? error.message : 'RESET_REQUEST_FAILED'
            setFlow(null); if (action === 'consume') setData(null)
            setErrorCode(code)
            setMessage(action === 'consume' ? 'resetUnknown' : resetErrorKey(code))
          }
        } finally {
          if (action === 'consume') { consuming.current = false; try { onBusyChange?.(false) } catch (_) {} }
          if (token === epoch.current) { lock.current = false; setBusy(false) }
        }
      }
      // Every new warning focuses Cancel, not the next destructive action. A new
      // pointerdown or non-repeating keydown ON that stage's button must arm it.
      React.useEffect(() => { armed.current = false; if (flow) cancelButton.current?.focus() }, [flow?.stage])
      const arm = event => {
        if (event.type === 'pointerdown' && event.button === 0 && event.detail < 2 || event.type === 'keydown' && !event.repeat && (event.key === 'Enter' || event.key === ' ')) armed.current = true
      }
      const credits = (data?.credits || []).filter(c => c && c.status === 'available')
      const button = (label, onClick, extra) => h('button', { type: 'button', onClick, disabled: busy || disabled || !open, ...extra }, label)
      return h('div', {
        ref: root, className: 'gpt-reset-menu' + (autoOpen ? ' gpt-reset-auto' : '') + (flow ? ' gpt-reset-warning' : ''),
        onKeyDown: event => { if (event.key === 'Escape' && open) { event.preventDefault(); event.stopPropagation(); if (autoOpen) invalidate(); else close() } },
      }, flow ? h(MiniCardOrb, { seed: 23 }) : null, h('style', null, `
        .gpt-reset-warning{isolation:isolate;overflow:hidden;border-radius:9px}
        .gpt-reset-warning>.reset-body,.gpt-reset-warning>.reset-head{position:relative;z-index:1}
        .gpt-reset-warning>.reset-body{background:transparent}
        .gpt-reset-menu{position:relative;width:100%;max-width:100%;margin-top:6px;color:var(--dsw-alias-label-primary);font:inherit}
        .gpt-reset-menu button{font:inherit;font-size:12px;color:inherit;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-module-platform);border-radius:7px;padding:6px 9px;text-align:left;cursor:pointer;white-space:normal}
        .gpt-reset-menu button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
        .gpt-reset-menu button:disabled{opacity:.5;cursor:default}.gpt-reset-menu button:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
        .gpt-reset-menu .reset-head{height:28px;display:inline-flex;align-items:center;gap:8px;padding:0 9px;font-size:11px;font-weight:500;background:var(--dsw-alias-bg-layer-1)}
        .gpt-reset-menu .reset-toggle{display:inline-block;font-size:11px;line-height:1;transition:transform .12s ease}
        .gpt-reset-menu .reset-head[aria-expanded=true] .reset-toggle{transform:rotate(180deg)}
        .gpt-reset-menu .reset-body{position:relative;margin-top:6px;max-height:240px;overflow:auto;overscroll-behavior:contain;padding:9px;box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-layer-1);animation:gl-reset-dropdown-in .12s ease-out}
        .gpt-reset-menu .reset-body[hidden]{display:none}
        .gpt-reset-menu .reset-row{margin:0 0 7px;opacity:1}.gpt-reset-menu .reset-row:empty{display:none}.gpt-reset-menu .reset-row:last-child{margin-bottom:0}
        .gpt-reset-menu .reset-row>button{width:100%;min-height:28px}
        .gpt-reset-menu .reset-row:has(>button)+.reset-row:has(>button){padding-top:7px;border-top:1px solid var(--dsw-alias-border-l2)}
        .gpt-reset-menu small{display:block;color:var(--dsw-alias-label-tertiary);font-size:10px;line-height:1.45;overflow-wrap:anywhere}
        .gpt-reset-menu p{font-size:12px;line-height:1.5;overflow-wrap:anywhere;margin:7px 0}
        .gpt-reset-menu .reset-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
        @keyframes gl-reset-dropdown-in{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:translateY(0)}}
        @media(prefers-reduced-motion:reduce){.gpt-reset-menu .reset-body{animation:none}.gpt-reset-menu .reset-toggle{transition:none}}
        .gpt-reset-auto .reset-body{margin-top:0;padding:0;border:0;background:transparent;max-height:200px}
        .reset-choice-heading{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:10px;line-height:16px;color:var(--dsw-alias-label-tertiary);margin:0 0 5px}.reset-choice-heading time{margin-left:auto;text-align:right;font-variant-numeric:tabular-nums}
        .reset-choice-cards{display:flex;justify-content:center;flex-wrap:wrap;gap:6px;padding:7px 2px 5px;scrollbar-width:thin}
        .gpt-reset-menu .reset-choice-card{position:relative;isolation:isolate;overflow:hidden;box-sizing:border-box;width:122px;flex:0 0 122px;height:66px;min-width:0;display:flex;flex-direction:column;align-items:stretch;justify-content:center;gap:2px;padding:6px 7px;border:1px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-xl,12px);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary)}
        .reset-choice-card>span:not(.reset-choice-orb),.reset-choice-card>strong{position:relative;z-index:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .reset-choice-card>strong{font-size:11px;line-height:16px;font-weight:600}
        .reset-choice-number{font-size:9px;line-height:12px;color:var(--dsw-alias-label-tertiary)}
        .reset-choice-expiry{font-size:9px;line-height:13px;color:var(--dsw-alias-label-secondary)}
        .reset-choice-orb{position:absolute;inset:0;overflow:hidden;pointer-events:none;z-index:0;border-radius:inherit}
        .reset-choice-orb::after{content:'';position:absolute;inset:0;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 42%,transparent)}
        .gpt-reset-menu .reset-choice-card:hover:not(:disabled){border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-bg-layer-1)}
        .reset-choice-card:hover:not(:disabled) .gl-card-orb,.reset-choice-card:focus-visible .gl-card-orb{opacity:.45;filter:saturate(1.2)}
        .reset-choice-card .gl-card-orb::after{backdrop-filter:none}
        .gpt-reset-auto .reset-body>.reset-row:last-child>button{width:auto;padding:3px 6px;font-size:10px;min-height:22px;background:transparent}

      `), !autoOpen ? h('button', {
        ref: head, type: 'button', className: 'reset-head', disabled: disabled || !accountId || consuming.current,
        'aria-expanded': open, 'aria-controls': menuId,
        onClick: () => { if (open) close(); else { setOpen(true); setMessage(''); load(false) } },
      }, tr('resetLimit') + (typeof data?.availableCount === 'number' ? ' · ' + data.availableCount : ''), h('span', { className: 'reset-toggle', 'aria-hidden': true }, '▾')) : null,
      h('div', { id: menuId, ref: body, className: 'reset-body', hidden: !open, 'aria-hidden': !open, inert: !open ? '' : undefined },
        !autoOpen ? h('small', { className: 'reset-row', 'data-reset-row': true }, accountLabel || accountId) : null,
        h('div', { role: 'status', 'aria-live': 'polite', className: 'reset-row', 'data-reset-row': true },
          busy ? tr('resetLoading') : message ? h(React.Fragment, null, tr(message), errorCode ? h('small', { style: { marginTop: '3px', fontFamily: 'monospace' } }, errorCode) : null) : null),
        flow ? h('div', { className: 'reset-row', 'data-reset-row': true, role: 'group', 'aria-label': tr(flow.stage === 1 ? 'resetStepOne' : 'resetStepTwo') },
          h('strong', null, tr(flow.stage === 1 ? 'resetStepOne' : 'resetStepTwo')),
          h('p', null, tr(flow.stage === 1 ? 'resetWarningOne' : 'resetWarningTwo', { account: accountLabel || accountId, type: typeText(flow.credit) })),
          h('small', null, tr('resetExpires', { time: stamp(flow.credit.expiresAt) })),
          h('div', { className: 'reset-actions' },
            button(tr(consuming.current ? 'resetWait' : 'resetCancel'), () => { if (!consuming.current) { invalidate(); setMessage('') } }, { ref: cancelButton, disabled: !open || consuming.current }),
            button(tr(flow.stage === 1 ? 'resetContinue' : 'resetSpend'), () => change(flow.stage === 1 ? 'advance' : 'consume'), {
              key: 'confirm-stage-' + flow.stage, onPointerDown: arm, onKeyDown: arm,
            }))) : h(React.Fragment, null,
          !busy && !credits.length && !message ? h('p', { className: 'reset-row', 'data-reset-row': true }, tr('resetEmpty')) : null,
           h('div', { className: 'reset-choice-cards' }, credits.map((credit, index) =>
             h(ResetChoiceCard, { key: credit.id, className: 'reset-choice-card',
               title: typeText(credit) + '. ' + tr('resetDescription') + ' · ' + tr('resetExpires', { time: stamp(credit.expiresAt) }),
               'aria-label': typeText(credit) + ' · ' + tr('resetExpires', { time: stamp(credit.expiresAt) }),
               disabled: busy || disabled || !open || credit.resetType !== 'codex_rate_limits' || !!(credit.expiresAt && new Date(credit.expiresAt).getTime() <= Date.now()), onClick: () => change('begin', credit) },
               h('span', { className: 'reset-choice-orb', 'aria-hidden': true, style: { '--gl-orb-phase': '-' + (index * 7.13).toFixed(2) + 's', '--gl-orb-direction': index % 2 ? 'reverse' : 'normal' } }, h('span', { className: 'gl-card-orb' }, h('span', { className: 'gl-card-orb-sheen' }))),
               h('strong', null, tr('resetCardTitle')),
               h('span', { className: 'reset-choice-expiry' }, credit.expiresAt ? tr('resetCardExpiry', { time: new Date(credit.expiresAt).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }) : tr('resetNoExpiry')),
               ))),
        )))
    }

    function createOrbLink() {
      const sources = new Map(), mirrors = new Map()
      return { sources, mirrors,
        sync(id) {
          const source = sources.get(id); if (!source) return
          const srcAnimations = source.getAnimations?.({ subtree: true }) ?? []
          for (const [node, owner] of mirrors) {
            if (owner !== id || !node.isConnected) continue
            for (const key of ['--gl-orb-phase', '--gl-orb-direction']) node.style.setProperty(key, source.style.getPropertyValue(key))
            node.dataset.orbHot = source.dataset.orbHot ?? 'false'
            node.dataset.offscreen = source.dataset.offscreen ?? 'false'
            const targetAnimations = node.getAnimations?.({ subtree: true }) ?? []
            for (const target of targetAnimations) {
              const original = srcAnimations.find(a => a.animationName === target.animationName)
              if (!original || !['gl-orb-turn', 'gl-orb-drift', 'gl-orb-breathe'].includes(original.animationName)) continue
              target.playbackRate = original.playbackRate
              if (typeof original.currentTime === 'number') target.currentTime = original.currentTime
              if (original.playState === 'paused') target.pause()
              else if (target.playState === 'paused') target.play()
            }
          }
        },
      }
    }
    function OrbDecoration() {
      return h('span', { className: 'gl-card-orb-clip', 'aria-hidden': true }, h('span', { className: 'gl-card-orb' }, h('span', { className: 'gl-card-orb-sheen' }), h('span', { className: 'gl-card-orb-rim' })))
    }

    Object.assign(copy.ru, { cardResetIn: 'Сброс: {span}' })
    Object.assign(copy.en, { cardResetIn: 'Reset: {span}' })
    Object.assign(copy.zh, { cardResetIn: '重置：{span}' })
    Object.assign(copy.ru, { cardResetCount: 'Сбросы: {n}', cardResetCountHint: 'Доступные ручные сбросы лимитов Codex' })
    Object.assign(copy.en, { cardResetCount: 'Resets: {n}', cardResetCountHint: 'Available manual Codex limit resets' })
    Object.assign(copy.zh, { cardResetCount: '重置：{n}', cardResetCountHint: '可用的 Codex 手动额度重置' })
    function accountResetWindow(card) {
      const windows = card?.windows ?? []
      return windows.find(w => w.windowDurationMins === 10080 && !w.id?.includes(':')) ?? windows.find(w => !w.id?.includes(':')) ?? windows[0]
    }
    function accountResetCaption(t, card, now) {
      const w = accountResetWindow(card)
      return Number.isFinite(w?.resetsAt) ? text(t, 'cardResetIn', { span: span(t, w.resetsAt - now) }) : text(t, 'noReset')
    }
    function accountResetTitle(t, card) {
      const w = accountResetWindow(card)
      return Number.isFinite(w?.resetsAt) ? windowLabel(t, w) + ' · ' + new Date(w.resetsAt).toLocaleString() : text(t, 'noReset')
    }
    function accountFill(card) {
      const windows = card?.windows ?? []
      const window = windows.find(w => w.windowDurationMins === 10080 && !w.id?.includes(':')) ?? windows.find(w => !w.id?.includes(':')) ?? windows[0]
      return window && Number.isFinite(window.usedPercent) ? Math.max(0, Math.min(100, 100 - window.usedPercent)) : null
    }
    function WindowRow({ t, window, now, card, pending, onRefresh, orbLink, accountId, resetControl }) {
      const surface = React.useRef(null)
      React.useEffect(() => {
        const node = surface.current
        if (!node || !orbLink || !accountId) return
        orbLink.current.mirrors.set(node, accountId)
        const frame = requestAnimationFrame(() => orbLink.current.sync(accountId))
        return () => { cancelAnimationFrame(frame); orbLink.current.mirrors.delete(node) }
      }, [orbLink, accountId])
      const percent = Number.isFinite(window.usedPercent) ? Math.max(0, Math.min(100, 100 - window.usedPercent)) : null
      const danger = percent !== null && percent <= 10
      const label = windowLabel(t, window)
      const title = label === text(t, 'windowWeekly') ? text(t, 'quotaWeekly') : label === text(t, 'windowFiveHour') ? text(t, 'quotaFiveHour') : label
      return h('div', { ref: surface, className: 'gl-limit' + (orbLink ? ' gl-limit-animated' : ''), style: { '--gl-quota-fill': '100%' } },
        orbLink ? h(OrbDecoration) : null,
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
          h('div', { className: 'gl-limit-fill', 'data-tone': danger ? 'error' : undefined, style: { width: percent + '%' } })) : null, resetControl)
    }
    function RemainingQuota({ t, card, now, pending, onRefresh, orbLink, accountId, accountLabel, resetDisabled, onConsumed, onResetBusyChange }) {
      return h('div', { className: 'gl-limit-stack' },
        card?.windows?.length ? card.windows.map((window, index) => h(WindowRow, { key: window.id, t, window, now, card, pending, onRefresh, orbLink, accountId, resetControl: accountId && index === (card.windows.findIndex(w => w.windowDurationMins === 10080 && !w.id?.includes(':')) < 0 ? 0 : card.windows.findIndex(w => w.windowDurationMins === 10080 && !w.id?.includes(':'))) ? h(ResetMenu, { t, accountId, accountLabel, disabled: resetDisabled, onConsumed, onBusyChange: onResetBusyChange }) : null })) :
          h('div', null, h('div', { className: 'gl-limit-meta' }, h('span', null, text(t, 'pickerUnknown')), h('button', { type: 'button', className: 'gl-icon', disabled: pending, 'aria-label': text(t, 'refresh'), 'data-spin': pending ? 'true' : undefined, onClick: onRefresh }, RefreshIcon)), accountId ? h(ResetMenu, { t, accountId, accountLabel, disabled: resetDisabled, onConsumed, onBusyChange: onResetBusyChange }) : null))
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

    const SUBAGENT_MODELS = Object.freeze(['gpt-6-astra', 'gpt-6.1-sol', 'gpt-6-sol', 'gpt-6-luna', 'gpt-5.6-sol', 'gpt-5.6-terra', 'gpt-5.6-luna'])
    const SUBAGENT_SETTINGS = 'subagent-model-selection-settings'
    async function readSubagentSettings(remote) {
      const result = await remote.settings.describe()
      if (!result?.ok || !Array.isArray(result.value?.namespaces)) throw new Error('setupUnavailable')
      const descriptor = result.value.namespaces.find(entry => entry?.ns === SUBAGENT_SETTINGS)
      const value = descriptor?.value
      if (!descriptor || !Number.isSafeInteger(descriptor.revision) || typeof value?.enabled !== 'boolean' || !Array.isArray(value.allowedModels)
        || value.allowedModels.some(route => typeof route?.provider !== 'string' || typeof route?.model !== 'string')) throw new Error('setupUnavailable')
      return { descriptor, writable: result.value.writable === true,
        configured: value.enabled && SUBAGENT_MODELS.every(model => value.allowedModels.some(route => route.provider === 'chatgpt-session' && route.model === model)) }
    }
    async function configureSubagentModels(remote) {
      // Fresh read + optimistic revision: preserve other user routes, never overwrite a concurrent edit.
      const current = await readSubagentSettings(remote)
      if (!current.writable) throw new Error('setupReadOnly')
      if (current.configured) return current
      const allowedModels = current.descriptor.value.allowedModels.map(route => ({ ...route }))
      for (const model of SUBAGENT_MODELS) if (!allowedModels.some(route => route.provider === 'chatgpt-session' && route.model === model)) allowedModels.push({ provider: 'chatgpt-session', model })
      const result = await remote.settings.mutate(SUBAGENT_SETTINGS, [
        { op: 'set', path: ['enabled'], value: true },
        { op: 'set', path: ['allowedModels'], value: allowedModels },
      ], current.descriptor.revision)
      if (!result.ok) throw new Error(result.error?.code === 'settings/conflict' ? 'setupConflict' : 'setupFailed')
      const verified = await readSubagentSettings(remote)
      if (!verified.configured) throw new Error('setupConflict')
      return verified
    }
    function SubagentSetup({ t, remote }) {
      const [state, setState] = React.useState(null), [error, setError] = React.useState('')
      const [busy, setBusy] = React.useState(false), [confirming, setConfirming] = React.useState(false)
      const [saved, setSaved] = React.useState(false)
      const alive = React.useRef(false), lock = React.useRef(false), cancel = React.useRef(null)
      const load = async () => {
        if (lock.current) return
        lock.current = true; setBusy(true); setError('')
        try { const next = await readSubagentSettings(remote); if (alive.current) setState(next) }
        catch { if (alive.current) { setState(null); setError('setupUnavailable') } }
        finally { lock.current = false; if (alive.current) setBusy(false) }
      }
      React.useEffect(() => { alive.current = true; void load(); return () => { alive.current = false } }, [remote])
      React.useEffect(() => { if (confirming) cancel.current?.focus() }, [confirming])
      const apply = async () => {
        if (lock.current || !confirming) return
        lock.current = true; setBusy(true); setError(''); setSaved(false)
        try {
          const next = await configureSubagentModels(remote)
          if (alive.current) { setState(next); setConfirming(false); setSaved(true) }
        } catch (e) { if (alive.current) { setError(['setupReadOnly','setupConflict','setupUnavailable'].includes(e.message) ? e.message : 'setupFailed'); setConfirming(false); setState(null) } }
        finally { lock.current = false; if (alive.current) setBusy(false) }
      }
      return h('section', { className: 'gl-account gl-subagent-setup', 'aria-label': text(t, 'setupTitle') },
        h('h3', { className: 'gl-account-heading' }, text(t, 'setupTitle')),
        h('p', { className: 'gl-note gl-setup-status', role: 'status', 'aria-live': 'polite' },
          h('span', { className: 'gl-dot', 'data-tone': busy ? 'busy' : state?.configured ? 'ok' : error ? 'error' : undefined, 'aria-hidden': true }),
          text(t, busy ? 'loading' : state?.configured ? 'setupReady' : state ? 'setupNeeded' : 'setupUnavailable')),
        h('p', { className: 'gl-note' }, text(t, 'setupNewChats')),
        saved ? h('p', { className: 'gl-note', role: 'status' }, text(t, 'setupSaved')) : null,
        error ? h('p', { className: 'gl-note', role: 'alert' }, text(t, error)) : null,
        state && !state.writable ? h('p', { className: 'gl-note' }, text(t, 'setupReadOnly')) : null,
        confirming ? h('div', { className: 'gl-sub', role: 'group', 'aria-label': text(t, 'setupConfirm') },
          h('p', { className: 'gl-note' }, text(t, 'setupConfirm')),
          h('ul', null, SUBAGENT_MODELS.map(model => h('li', { key: model }, 'chatgpt-session/' + model))),
          h('div', { className: 'gl-choices' },
            h('button', { ref: cancel, className: 'gl-btn', type: 'button', disabled: busy, onClick: () => setConfirming(false) }, text(t, 'cancel')),
            h('button', { className: 'gl-btn', type: 'button', disabled: busy, onClick: apply }, text(t, 'confirm')))) :
          h('div', { className: 'gl-choices' },
            h('button', { className: 'gl-btn', type: 'button', disabled: busy || !state?.writable || state.configured, onClick: () => { setSaved(false); setConfirming(true) } }, text(t, 'setupAction')),
            h('button', { className: 'gl-btn', type: 'button', disabled: busy, onClick: load }, text(t, 'refresh'))))
    }
    Object.assign(copy.ru, { setupTitle: 'Модели субагентов', setupReady: 'Настроено: доступны все 7 моделей ChatGPT.', setupNeeded: 'Требуется настройка.', setupAction: 'Настроить субагентов', setupNewChats: 'Применяется только к новым чатам. Субагенты наследуют выбранный аккаунт родителя.', setupConfirm: 'Включить выбор моделей и добавить эти 7 маршрутов? Остальные разрешения, включая openai-codex, сохранятся. Убрать ненужные маршруты можно в настройках Subagent.', setupSaved: 'Сохранено. Создайте новый чат, чтобы применить разрешения.', setupUnavailable: 'Настройки субагентов недоступны. Проверьте официальный плагин Subagent и обновите статус.', setupReadOnly: 'Настройки доступны только для чтения.', setupConflict: 'Настройки изменились параллельно. Обновите статус и подтвердите ещё раз.', setupFailed: 'Не удалось сохранить настройки. Обновите статус и повторите подтверждение.' })
    Object.assign(copy.en, { setupTitle: 'Subagent models', setupReady: 'Configured: all 7 ChatGPT models available.', setupNeeded: 'Setup required.', setupAction: 'Set up subagents', setupNewChats: 'Applies only to new chats. Subagents inherit the parent’s selected account.', setupConfirm: 'Enable model selection and add these 7 routes? All other permissions, including openai-codex, remain unchanged. Remove unwanted routes in Subagent settings.', setupSaved: 'Saved. Start a new chat to apply permissions.', setupUnavailable: 'Subagent settings unavailable. Check the official Subagent plugin and refresh status.', setupReadOnly: 'Settings are read-only.', setupConflict: 'Settings changed concurrently. Refresh status and confirm again.', setupFailed: 'Could not save settings. Refresh status and confirm again.' })
    Object.assign(copy.zh, { setupTitle: '子代理模型', setupReady: '已配置：全部 7 个 ChatGPT 模型可用。', setupNeeded: '需要配置。', setupAction: '配置子代理', setupNewChats: '仅适用于新会话。子代理继承父会话选择的账号。', setupConfirm: '启用模型选择并添加这 7 个路由？其他权限（包括 openai-codex）保持不变。可在 Subagent 设置中移除不需要的路由。', setupSaved: '已保存。请新建会话以应用权限。', setupUnavailable: '子代理设置不可用。请检查官方 Subagent 插件并刷新状态。', setupReadOnly: '设置为只读。', setupConflict: '设置已被其他操作修改。请刷新状态并重新确认。', setupFailed: '保存失败。请刷新状态并重新确认。' })

    function GptLinkSection({ t, remote }) {
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
        snapshot?.accounts.map(account => h(AccountPanel, { key: account.id, t, account, pending, mutate })),
        h(SubagentSetup, { t, remote }))
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


    Object.assign(copy.ru, { pickerTitle: 'Аккаунт и модель', pickerSearch: 'Поиск аккаунта или модели', pickerClose: 'Закрыть', pickerQuota: 'Использовано', pickerUnknown: 'Квота недоступна', pickerChoose: 'Выбрать модель', pickerOther: 'Другие провайдеры', pickerBusy: 'Во время работы нельзя менять модель. Ручной сброс доступен.', pickerRefresh: 'Обновить квоты', pickerPartial: 'Аккаунт выбран, но модель не изменилась. Проверьте выбор перед отправкой.', pickerNoResults: 'Ничего не найдено', pickerLoad: 'Загрузка моделей…', pickerInstruction: 'Выберите уровень рассуждений, затем нажмите на модель.', pickerEmptyAccounts: 'Добавьте аккаунт в Настройки → ChatGPT Link.', pickerEmptyModels: 'Нет доступных моделей. Нажмите обновление справа вверху.' })
    Object.assign(copy.en, { pickerTitle: 'Account and model', pickerSearch: 'Search accounts or models', pickerClose: 'Close', pickerQuota: 'Used', pickerUnknown: 'Quota unavailable', pickerChoose: 'Choose model', pickerOther: 'Other providers', pickerBusy: 'Model changes are blocked while running. Manual resets remain available.', pickerRefresh: 'Refresh quotas', pickerPartial: 'Account changed but model selection failed. Check your selection before sending.', pickerNoResults: 'No matches', pickerLoad: 'Loading models…', pickerInstruction: 'Choose reasoning effort, then click a model.', pickerEmptyAccounts: 'Add an account in Settings → ChatGPT Link.', pickerEmptyModels: 'No available models. Use refresh at the top right.' })
    Object.assign(copy.zh, { pickerTitle: '账号与模型', pickerSearch: '搜索账号或模型', pickerClose: '关闭', pickerQuota: '已用', pickerUnknown: '额度不可用', pickerChoose: '选择模型', pickerOther: '其他提供方', pickerBusy: '运行时无法切换模型，但仍可手动重置额度。', pickerRefresh: '刷新额度', pickerPartial: '账号已切换，但模型选择失败。发送前请检查。', pickerNoResults: '没有结果', pickerLoad: '正在加载模型…', pickerInstruction: '选择推理强度，然后点击模型。', pickerEmptyAccounts: '在设置 → ChatGPT Link 中添加账号。', pickerEmptyModels: '没有可用模型，请点击右上角刷新。' })
    Object.assign(copy.ru, { activeAccount: 'Используется', activeModel: 'Текущая' })
    Object.assign(copy.en, { activeAccount: 'In use', activeModel: 'Current' })
    Object.assign(copy.zh, { activeAccount: '使用中', activeModel: '当前' })
    Object.assign(copy.ru, { pickerPreview: 'Просмотр', pickerReasoning: 'Рассуждения', pickerApplyHint: 'Нажмите модель, чтобы применить выбор', pickerTabOther: 'Другие', pickerNotApplied: 'Ещё не применено' })
    Object.assign(copy.en, { pickerPreview: 'Preview', pickerReasoning: 'Reasoning', pickerApplyHint: 'Click a model to apply your selection', pickerTabOther: 'Other', pickerNotApplied: 'Not applied yet' })
    Object.assign(copy.zh, { pickerPreview: '预览', pickerReasoning: '推理', pickerApplyHint: '点击模型以应用选择', pickerTabOther: '其他', pickerNotApplied: '尚未应用' })
    const pickerCss = `
.gl-picker-dialog.gl-picker-widget{position:fixed;inset:auto;margin:0;max-width:calc(100vw - 16px);max-height:var(--gl-widget-height,620px);z-index:1000;border-radius:12px;clip-path:inset(0 round 12px);box-shadow:0 8px 28px color-mix(in srgb,var(--dsw-alias-label-primary) 14%,transparent)}
.gl-picker-dialog.gl-picker-widget:popover-open{display:block}
.gl-picker-dialog.gl-picker-widget::backdrop{background:transparent;pointer-events:none}
.gl-picker-widget>.gl-picker-shell{max-height:calc(var(--gl-widget-height,620px) - 2px)}
.gl-picker-widget .gl-picker-head{padding:8px 10px 6px}
.gl-picker-widget .gl-picker-head strong{font-size:13px}
.gl-picker-widget .gl-picker-shell>.gl-picker-head{border-radius:11px 11px 0 0}

/* Four peer groups: a single compact rhythm, without redundant captions. */
.gl-picker-shell .gl-picker-list{gap:7px}
.gl-picker-shell .gl-picker-list>.gl-account-mini-grid,
.gl-picker-shell .gl-picker-list>.gpt-reset-menu,
.gl-picker-shell .gl-picker-list>.gl-efforts,
.gl-picker-shell .gl-picker-list>.gl-model-grid{box-sizing:border-box;flex:none;width:100%;min-width:0;margin:0;padding:6px;border:1px solid var(--dsw-alias-border-l2);border-radius:11px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 55%,var(--dsw-alias-bg-module-platform));gap:5px}
.gl-picker-shell .gl-picker-list>.gpt-reset-menu .reset-body{margin:0;padding:0;border:0;border-radius:0;background:transparent;overflow:visible;max-height:none}
.gl-picker-shell .gl-picker-list>.gpt-reset-menu .reset-choice-cards{margin:0;padding:0;gap:5px}
.gl-picker-shell .gl-picker-list>.gpt-reset-menu .reset-row{margin:0}
.gl-picker-shell .gl-picker-list>.gpt-reset-menu .reset-row:empty{display:none}
.gl-picker-shell .gl-picker-list>.gl-account-mini-grid{align-items:stretch}
.gl-picker-shell .gl-picker-list>.gl-model-grid:empty{display:none}

.gl-account-mini-card>.gl-mini-orb{clip-path:inset(calc(100% - var(--gl-account-quota-fill,0%)) 0 0 0);transition:clip-path .65s cubic-bezier(.22,1,.36,1)}
.gl-account-mini-card[data-quota-stale=true]>.gl-mini-orb{opacity:.65}
@media(prefers-reduced-motion:reduce){.gl-account-mini-card>.gl-mini-orb{transition:none}}

.gl-account-mini-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;flex:none;padding:5px 0;min-width:0}
.gl-account-mini-grid>.gl-account-mini-card{position:relative;isolation:isolate;overflow:hidden;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:2px;min-width:0;height:86px;padding:6px;border:1px solid var(--dsw-alias-border-l3);border-radius:9px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font:inherit;font-size:10px;line-height:13px;text-align:center;cursor:pointer}
.gl-account-mini-card>strong,.gl-account-mini-card>span:not(.gl-mini-orb){position:relative;z-index:1;display:block;max-width:100%;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gl-account-mini-card>.gl-account-mini-name{font-size:11px;line-height:15px;font-weight:500}
.gl-account-mini-card>span:not(.gl-mini-orb){color:var(--dsw-alias-label-secondary);font-size:9px;line-height:12px}
.gl-account-mini-grid>.gl-account-mini-card[aria-pressed=true]{border-color:var(--dsw-alias-state-business-primary);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dsw-alias-state-business-primary) 30%,transparent)}
.gl-account-mini-card>.gl-account-mini-active{color:var(--dsw-alias-state-business-primary)!important}
.gl-account-mini-card:hover:not(:disabled) .gl-card-orb,.gl-account-mini-card:focus-visible .gl-card-orb{opacity:.45;filter:saturate(1.2)}
.gl-account-mini-card:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}
.gl-account-mini-card:disabled{opacity:.5;cursor:default}
@media(max-width:380px){.gl-account-mini-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}

/* Account cards use the same centered mini-card material as reset cards. */
.gl-picker-list .gl-fan,.gl-picker-list .gl-fan[data-many=true]{height:auto;display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:5px;margin:0;padding:7px 2px 5px}
.gl-picker-list .gl-fan .gl-fan-card,.gl-picker-list .gl-fan[data-many=true] .gl-fan-card{position:relative;left:auto;top:auto;width:106px!important;flex:0 0 106px;height:96px!important;min-height:96px;grid-template-rows:11px 15px 12px 12px 12px 12px;row-gap:1px!important;padding:6px 7px!important;border-radius:9px;border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-1);text-align:center;transform-origin:center;will-change:transform}
.gl-picker-list .gl-fan .gl-fan-card>.gl-fan-top{justify-content:center;font-size:9px;line-height:11px}
.gl-picker-list .gl-fan .gl-fan-card>.gl-fan-name{font-size:11px;line-height:15px;font-weight:500}
.gl-picker-list .gl-fan .gl-fan-card>.gl-fan-remaining,.gl-picker-list .gl-fan .gl-fan-card>.gl-fan-reset,.gl-picker-list .gl-fan .gl-fan-card>.gl-fan-reset-count,.gl-picker-list .gl-fan .gl-fan-card>.gl-fan-state{font-size:9px;line-height:12px}
.gl-picker-list .gl-fan .gl-card-orb-clip::after{background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 42%,transparent)}
.gl-picker-list .gl-fan .gl-card-orb{opacity:.23}
.gl-picker-list .gl-fan .gl-card-orb::after{backdrop-filter:none}
.gl-picker-list .gl-fan .gl-fan-card:hover:not(:disabled) .gl-card-orb,.gl-picker-list .gl-fan .gl-fan-card:focus-visible .gl-card-orb{opacity:.45;filter:saturate(1.2)}

.gl-fan .gl-fan-card:hover:not(:disabled) .gl-card-orb,.gl-fan .gl-fan-card:focus-visible .gl-card-orb{opacity:.45;filter:saturate(1.2)}

.gl-header-updated{font-size:10px;line-height:16px;color:var(--dsw-alias-label-tertiary);font-variant-numeric:tabular-nums;white-space:nowrap;margin-right:-5px}
.gl-picker-list .gl-model-cell,.gl-picker-list .gl-effort-button,.gl-picker-list .gpt-reset-menu .reset-choice-card{border:1px solid var(--dsw-alias-border-l3);border-radius:9px;background:var(--dsw-alias-bg-layer-1);font-family:inherit;font-size:11px;font-weight:500;text-align:center;box-sizing:border-box;padding:5px 7px;isolation:isolate}
.gl-picker-list .gl-model-cell,.gl-picker-list .gl-effort-button{height:32px;min-height:32px;justify-content:center}
.gl-picker-list .gpt-reset-menu .reset-choice-card{height:44px;justify-content:center;align-items:center}
.gl-picker-list .reset-choice-card>strong{font-size:11px;font-weight:500;line-height:15px}
.gl-picker-list .gl-mini-orb,.gl-picker-list .reset-choice-orb{opacity:1}
.gl-picker-list .gl-mini-orb .gl-card-orb,.gl-picker-list .reset-choice-orb .gl-card-orb{opacity:.23}
.gl-picker-list .gl-mini-orb::after,.gl-picker-list .reset-choice-orb::after{background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 42%,transparent)}

/* One compact material for resets, effort and models. */
.gl-picker-list .gpt-reset-menu .reset-choice-card{width:112px;flex-basis:112px;height:48px;padding:5px 7px;gap:1px;border-radius:9px}
.gl-picker-list .reset-choice-card>strong{font-size:10px;line-height:14px}
.gl-picker-list .reset-choice-expiry{font-size:9px;line-height:12px}
.gl-picker-list .reset-choice-cards{gap:5px;padding:5px 2px 3px}
.gl-picker-list .gl-efforts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px;padding-top:3px}
.gl-picker-list .gl-efforts>span{grid-column:1/-1;font-size:10px;margin:0;line-height:14px}
.gl-picker-list .gl-effort-button,.gl-picker-list .gl-model-cell{position:relative;isolation:isolate;overflow:hidden;box-sizing:border-box;display:flex;align-items:center;justify-content:center;border:1px solid var(--dsw-alias-border-l3);border-radius:9px;background:var(--dsw-alias-bg-layer-1);padding:5px 6px;color:var(--dsw-alias-label-primary);font-size:11px;line-height:16px;min-height:30px;height:30px;cursor:pointer}
.gl-picker-list .gl-effort-button[aria-pressed=true],.gl-picker-list .gl-model-cell[aria-pressed=true]{border-color:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-state-business-primary);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dsw-alias-state-business-primary) 30%,transparent)}
.gl-picker-list .gl-model-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;padding-top:3px}
.gl-mini-label{position:relative;z-index:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gl-mini-orb{position:absolute;inset:0;z-index:0;border-radius:inherit;overflow:hidden;pointer-events:none}
.gl-mini-orb::after{content:'';position:absolute;inset:0;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 48%,transparent)}
.gl-mini-orb .gl-card-orb{opacity:.18}
.gl-mini-orb .gl-card-orb::after{backdrop-filter:none}
.gl-effort-button:hover:not(:disabled) .gl-card-orb,.gl-model-cell:hover:not(:disabled) .gl-card-orb,.gl-effort-button:focus-visible .gl-card-orb,.gl-model-cell:focus-visible .gl-card-orb{opacity:.42;filter:saturate(1.2)}
.gl-picker-list .gl-effort-button:focus-visible,.gl-picker-list .gl-model-cell:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:-2px}
@media(max-width:380px){.gl-picker-list .gl-model-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}

/* Keep header hover paint inside the rounded picker. */
.gl-picker-dialog{overflow:hidden!important;clip-path:inset(0 round 16px)}
.gl-picker-shell>.gl-picker-head{overflow:hidden;isolation:isolate;border-radius:15px 15px 0 0}
.gl-picker-head>.gl-icon{position:relative;flex:0 0 28px;width:28px;height:28px;min-width:28px;min-height:28px;box-sizing:border-box;padding:0;margin:0;overflow:hidden;border-radius:7px;clip-path:inset(0 round 7px);box-shadow:none}
.gl-picker-head>.gl-icon:hover{box-shadow:none;transform:none}
.gl-picker-head>.gl-icon::before,.gl-picker-head>.gl-icon::after{display:none!important}

/* Fixed text tracks: labels never shrink into each other. */
.gl-fan .gl-fan-card{display:grid!important;grid-template-rows:14px 17px 14px 13px 13px 14px;align-content:center;row-gap:2px!important;padding:9px!important;height:120px!important;min-height:120px;overflow:hidden}
.gl-fan .gl-fan-card>.gl-fan-top{grid-row:1;font-size:10px;line-height:14px}
.gl-fan .gl-fan-card>.gl-fan-name{grid-row:2;margin:0;font-size:12px;line-height:17px}
.gl-fan .gl-fan-card>.gl-fan-remaining{grid-row:3;font-size:10px;line-height:14px}
.gl-fan .gl-fan-card>.gl-fan-reset{grid-row:4;font-size:9px;line-height:13px}
.gl-fan .gl-fan-card>.gl-fan-reset-count{grid-row:5;font-size:10px;line-height:13px}
.gl-fan .gl-fan-card>.gl-fan-state{grid-row:6;font-size:10px;line-height:14px}
.gl-fan .gl-fan-card>.gl-fan-top,.gl-fan .gl-fan-card>.gl-fan-name,.gl-fan .gl-fan-card>.gl-fan-remaining,.gl-fan .gl-fan-card>.gl-fan-reset,.gl-fan .gl-fan-card>.gl-fan-reset-count,.gl-fan .gl-fan-card>.gl-fan-state{min-width:0;min-height:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

.gl-fan-reset-count{position:relative;z-index:1;font-size:10px;line-height:13px;color:var(--dsw-alias-label-secondary);white-space:nowrap;font-variant-numeric:tabular-nums}

.gl-fan-card>.gl-fan-reset{position:relative;z-index:1;font-size:9px;line-height:13px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gl-fan-card{gap:3px!important;padding:9px!important}
.gl-fan[data-many=true] .gl-fan-card{height:120px!important}
.gl-account-actions{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:start;gap:8px;flex:none}
.gl-account-actions>.gpt-reset-menu{margin-top:0}
.gl-account-refresh{display:flex;align-items:center;gap:3px;font-size:10px;color:var(--dsw-alias-label-tertiary);height:28px;font-variant-numeric:tabular-nums}


.gl-limit-animated{position:relative;isolation:isolate;overflow:hidden}
.gl-limit-animated>.gl-limit-title,.gl-limit-animated>.gl-limit-meta,.gl-limit-animated>.gl-limit-track,.gl-limit-animated>.gpt-reset-menu{position:relative;z-index:1}
.gl-limit-animated[data-orb-hot=true] .gl-card-orb{opacity:.52;filter:saturate(1.3)}
.gl-limit-animated[data-offscreen=true] .gl-card-orb,.gl-limit-animated[data-offscreen=true] .gl-card-orb::before,.gl-limit-animated[data-offscreen=true] .gl-card-orb-sheen{animation-play-state:paused}

/* Siri Orb mesh adapted from SmoothUI (MIT), Eduardo Calvo.
   idle: rotation 20/.6=33.333s, sheen 12/(1+.6)*2=15s, breath5.5s. */
@property --gl-orb-angle{syntax:"<angle>";inherits:false;initial-value:0deg}
.gl-card-orb-clip{position:absolute;inset:1px;border-radius:inherit;overflow:hidden;pointer-events:none;z-index:0;clip-path:inset(calc(100% - var(--gl-quota-fill,0%)) 0 0 0);transition:clip-path .65s cubic-bezier(.22,1,.36,1)}
.gl-fan-card[data-quota-known=false] .gl-card-orb-clip{visibility:hidden}
.gl-fan-card[data-quota-stale=true] .gl-card-orb-clip{opacity:.65}
@media(prefers-reduced-motion:reduce){.gl-card-orb-clip{transition:none}}
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
.gl-fan[data-many=true] .gl-fan-card{position:relative;top:auto;left:auto;width:100%!important;height:100px;will-change:auto}
@media(prefers-reduced-motion:reduce){.gl-fan-card{will-change:auto}}

.gl-compact-tabs{display:flex;align-items:center;flex-wrap:wrap;gap:4px;padding:0 12px 8px;flex:none}
.gl-new-chat-defaults{margin-left:auto;display:flex;align-items:center;gap:4px;font-size:11px;color:var(--dsw-alias-label-secondary);cursor:pointer;position:relative}
.gl-new-chat-defaults input{accent-color:var(--dsw-alias-state-business-primary);margin:0}
.gl-new-chat-defaults input:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:2px}
.gl-new-chat-defaults:has(input:disabled){opacity:.6;cursor:default}
.gl-defaults-status{position:absolute;right:0;top:100%;z-index:2;max-width:240px;padding:4px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l2);border-radius:4px}
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
    function FanAccounts({ accounts, previewId, currentId, onPreview, quotaText, compactQuota, quotas, selecting, t, now, resets }) {
      return h('div', { className: 'gl-account-mini-grid', role: 'group', 'aria-label': text(t, 'gptAccountsBlock') },
        accounts.map((account, index) => h(ResetChoiceCard, {
          key: account.id, className: 'gl-account-mini-card', disabled: selecting,
          style: { '--gl-account-quota-fill': (account.configured ? accountFill(quotas[account.id]) ?? 0 : 0) + '%' },
          'data-quota-stale': quotas[account.id]?.freshness === 'stale' ? 'true' : undefined,
          'aria-pressed': previewId === account.id, 'data-current': currentId === account.id ? 'true' : undefined,
          title: account.label + ' · ' + quotaText(quotas[account.id]) + ' · ' + accountResetTitle(t, quotas[account.id]),
          'aria-label': account.label + ' · ' + (account.configured ? compactQuota(quotas[account.id]) : text(t, 'unconfigured')),
          onClick: () => onPreview(account.id),
        }, h(MiniCardOrb, { seed: index + 11 }),
          h('strong', { className: 'gl-account-mini-name' }, account.label.split('@')[0]),
          h('span', null, account.configured ? compactQuota(quotas[account.id]) : text(t, 'unconfigured')),
          h('span', null, account.configured ? accountResetCaption(t, quotas[account.id], now) : '—'),
          h('span', null, text(t, 'cardResetCount', { n: String(account.configured && Number.isInteger(resets?.[account.id]?.availableCount) ? resets[account.id].availableCount : '—') })),
          currentId === account.id ? h('span', { className: 'gl-account-mini-active' }, text(t, 'activeAccount')) : null)))
    }

    Object.assign(copy.ru, { defaultsLabel: 'Для новых чатов', defaultsTitle: 'Сохранить этот аккаунт, текущую модель ChatGPT и уровень рассуждений только для будущих новых чатов', defaultsLoading: 'Загрузка настроек новых чатов…', defaultsError: 'Настройки новых чатов недоступны. Откройте виджет заново.', defaultsUnavailable: 'Выберите доступную модель ChatGPT и настроенный аккаунт.' })
    Object.assign(copy.en, { defaultsLabel: 'For new chats', defaultsTitle: 'Save this account, current ChatGPT model and reasoning effort for future new chats only', defaultsLoading: 'Loading new chat defaults…', defaultsError: 'New chat defaults unavailable. Reopen the widget.', defaultsUnavailable: 'Select an available ChatGPT model and a configured account.' })
    Object.assign(copy.zh, { defaultsLabel: '用于新会话', defaultsTitle: '仅为未来新会话保存此账号、当前 ChatGPT 模型和推理强度', defaultsLoading: '正在加载新会话设置…', defaultsError: '新会话设置不可用，请重新打开选择器。', defaultsUnavailable: '请选择可用的 ChatGPT 模型和已配置账号。' })

    function newChatCombo(current, nativeModels, account, reasoningEffort, tab) {
      const nativeModel = current?.provider === 'chatgpt-session' && nativeModels.find(model => model.id === current.model)
      if (tab !== 'gpt' || !nativeModel || !account?.configured || typeof reasoningEffort !== 'string' || !nativeModel.reasoning?.efforts?.some(level => level.id === reasoningEffort)) return null
      return { accountId: account.id, model: nativeModel.id, reasoningEffort }
    }
    function defaultsMatch(saved, combo) {
      return !!(saved?.enabled && combo && saved.accountId === combo.accountId && saved.model === combo.model && saved.reasoningEffort === combo.reasoningEffort)
    }
    function NewChatDefaults({ open, combo, disabled, t }) {
      const [saved, setSaved] = React.useState(null)
      const [loading, setLoading] = React.useState(false)
      const [busy, setBusy] = React.useState(false)
      const [failed, setFailed] = React.useState(false)
      const operation = React.useRef({ epoch: 0, locked: false, controller: null })
      React.useEffect(() => {
        const op = operation.current, epoch = ++op.epoch
        op.controller?.abort(); op.locked = false
        setSaved(null); setFailed(false); setBusy(false); setLoading(open)
        if (!open) return
        const controller = new AbortController(); op.controller = controller
        request('api/chatgpt-defaults', undefined, controller.signal).then(result => {
          if (epoch === op.epoch && !controller.signal.aborted) setSaved(result)
        }).catch(() => {
          if (epoch === op.epoch && !controller.signal.aborted) setFailed(true)
        }).finally(() => {
          if (epoch === op.epoch && !controller.signal.aborted) setLoading(false)
        })
        return () => { ++op.epoch; controller.abort(); op.locked = false }
      }, [open])
      const checked = defaultsMatch(saved, combo)
      // A missing saved account must not block explicitly replacing it with a valid preview.
      const unavailable = !saved || !combo
      const change = async () => {
        const op = operation.current
        if (!open || disabled || loading || failed || unavailable || op.locked) return
        op.locked = true; setBusy(true); setFailed(false)
        const epoch = op.epoch, signal = op.controller.signal
        try {
          const result = await request('api/chatgpt-defaults', checked ? { action: 'disable' } : { action: 'save', ...combo }, signal)
          if (epoch === op.epoch && !signal.aborted) setSaved(result)
        } catch {
          if (epoch === op.epoch && !signal.aborted) { setSaved(null); setFailed(true) }
        } finally {
          if (epoch === op.epoch && !signal.aborted) { op.locked = false; setBusy(false) }
        }
      }
      const status = failed ? 'defaultsError' : loading ? 'defaultsLoading' : unavailable ? 'defaultsUnavailable' : 'defaultsTitle'
      return h('label', { className: 'gl-new-chat-defaults', title: text(t, status) },
        h('input', { type: 'checkbox', checked, disabled: !open || disabled || loading || busy || failed || unavailable, onChange: change, 'aria-busy': loading || busy }),
        h('span', null, text(t, 'defaultsLabel')),
        failed || loading ? h('span', { className: 'gl-defaults-status', role: failed ? 'alert' : 'status' }, text(t, status)) : null)
    }

    function UnifiedPicker({ t, sessionId, useSession, directory, locked }) {
      const state = React.useSyncExternalStore(directory.store.subscribe, directory.store.getSnapshot, directory.store.getSnapshot)
      const { snapshot, refresh, error: accountError } = useAccounts(sessionId)
      const unavailable = useSession(s => s.subagent !== null)
      const busy = useSession(s => s.running || s.awaitingFirstTurn || s.pendingSubmissions.length > 0 || s.removed || s.subagent !== null) || locked
      // Generating blocks model changes, not an explicitly confirmed manual reset.
      const resetUnavailable = useSession(s => s.removed || s.subagent !== null) || locked
      const orbLink = React.useRef(null)
      if (!orbLink.current) orbLink.current = createOrbLink()
      const [open, setOpen] = React.useState(false)
      const [query, setQuery] = React.useState('')
      const [quotas, setQuotas] = React.useState({})
      const [resets, setResets] = React.useState({})
      const [quotaPending, setQuotaPending] = React.useState({})
      const quotaRequests = React.useRef(new Set())
      const [now, setNow] = React.useState(Date.now())
      React.useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer) }, [])
      const [error, setError] = React.useState('')
      const [selecting, setSelecting] = React.useState(false)
      const [resetBusy, setResetBusy] = React.useState(false)
      const [refreshingAll, setRefreshingAll] = React.useState(false)
      const refreshAllLock = React.useRef(false)
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
      const loadResets = React.useCallback(async (ids, force = false, signal) => {
        await Promise.all(ids.map(async id => {
          try {
            const result = await request('api/chatgpt-resets' + (force ? '' : '?accountId=' + encodeURIComponent(id)), force ? { action: 'list', accountId: id } : undefined, signal)
            if (!signal?.aborted) setResets(old => ({ ...old, [id]: result?.error ? { availableCount: null } : result }))
          } catch { if (!signal?.aborted) setResets(old => ({ ...old, [id]: { availableCount: null } })) }
        }))
      }, [])
      React.useEffect(() => {
        if (!open) return
        const controller = new AbortController()
        const ids = accounts.filter(a => a.configured).map(a => a.id)
        if (ids.length) void loadResets(ids, false, controller.signal)
        const timer = setInterval(() => { if (ids.length) void loadResets(ids, false, controller.signal) }, 60000)
        return () => { controller.abort(); clearInterval(timer) }
      }, [open, accounts.map(a => a.id + a.configured).join(','), loadResets])
      React.useEffect(() => { if (!unavailable) void directory.load().catch(e => setError(e.message)) }, [directory, unavailable])
      React.useEffect(() => {
        const controller = new AbortController()
        const ids = (open ? accounts.filter(a => a.configured).map(a => a.id) : selectedId ? [selectedId] : [])
        if (ids.length) void loadQuota(ids, false, controller.signal)
        const timer = setInterval(() => { if (ids.length) void loadQuota(ids, false, controller.signal) }, 60000)
        return () => { controller.abort(); clearInterval(timer) }
      }, [open, selectedId, accounts.map(a => a.id + a.configured).join(','), loadQuota])
      React.useLayoutEffect(() => {
        const node = dialog.current, anchor = trigger.current
        if (!node || !anchor || !open) return
        let frame = 0
        const place = () => {
          const box = anchor.getBoundingClientRect(), edge = 8, gap = 7
          const width = Math.min(440, window.innerWidth - edge * 2)
          const above = Math.max(0, box.top - edge - gap), below = Math.max(0, window.innerHeight - box.bottom - edge - gap)
          const upwards = above > below
          const maxHeight = Math.max(80, Math.min(620, upwards ? above : below))
          node.style.width = width + 'px'
          node.style.setProperty('--gl-widget-height', maxHeight + 'px')
          const height = Math.min(node.getBoundingClientRect().height || maxHeight, maxHeight)
          node.style.left = Math.max(edge, Math.min(window.innerWidth - width - edge, box.left)) + 'px'
          node.style.top = Math.max(edge, Math.min(window.innerHeight - height - edge, upwards ? box.top - gap - height : box.bottom + gap)) + 'px'
          node.dataset.side = upwards ? 'above' : 'below'
        }
        if (node.showPopover) node.showPopover()
        else if (!node.open) node.show()
        place()
        node.focus({ preventScroll: true })
        const schedule = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; place() }) }
        const observer = new ResizeObserver(schedule); observer.observe(node); observer.observe(anchor)
        window.addEventListener('resize', schedule)
        document.addEventListener('scroll', schedule, true)
        return () => {
          cancelAnimationFrame(frame); observer.disconnect()
          window.removeEventListener('resize', schedule); document.removeEventListener('scroll', schedule, true)
          if (node.hidePopover && node.matches(':popover-open')) node.hidePopover()
          if (node.open) node.close()
        }
      }, [open])
      React.useEffect(() => {
        if (!open) return
        const outside = event => {
          if (!dialog.current?.contains(event.target) && !trigger.current?.contains(event.target) && !inFlight.current && !resetBusy) { setOpen(false); trigger.current?.focus({ preventScroll: true }) }
        }
        const escape = event => {
          if (event.key === 'Escape' && !event.defaultPrevented && !inFlight.current && !resetBusy) { event.preventDefault(); setOpen(false); trigger.current?.focus({ preventScroll: true }) }
        }
        document.addEventListener('pointerdown', outside); document.addEventListener('keydown', escape)
        return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape) }
      }, [open, resetBusy])
      const close = () => { if (!inFlight.current && !resetBusy) { setOpen(false); trigger.current?.focus() } }
      const choose = async (account, provider, model) => {
        if (busy || resetBusy || inFlight.current) return
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
        const remaining = accountFill(card)
        return remaining === null ? '—' : text(t, 'remaining', { n: String(Math.round(remaining)) }) + (card.freshness === 'stale' ? ' ≈' : '')
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
        h('button', { ref: trigger, type: 'button', className: 'gl-picker-trigger', title: triggerLabel, onClick: () => { setQuery(''); setTab(state.current?.provider === 'chatgpt-session' ? 'gpt' : 'other'); setPreviewId(selectedId ?? null); setOtherProvider(state.current?.provider ?? null); setCommonEffort(null); if (!resetBusy && !inFlight.current) setOpen(value => !value) }, disabled: !!locked || resetBusy, 'aria-haspopup': 'dialog', 'aria-expanded': open },
          h('span', null, triggerLabel), state.current?.provider === 'chatgpt-session' && selectedId ? h('small', { className: 'gl-picker-quota', title: quotaText(quotas[selectedId]) + ' · ' + triggerQuotaText(quotas[selectedId]) }, triggerQuotaText(quotas[selectedId])) : null, ' ▾'),
        h('dialog', { ref: dialog, popover: 'manual', tabIndex: -1, className: 'gl-picker-dialog gl-picker-widget', 'aria-modal': false, 'aria-label': text(t, 'pickerTitle'), onCancel: e => { e.preventDefault(); close() }, onClick: e => { if (e.target === dialog.current) close() } },
          h('div', { className: 'gl-picker-shell' },
            h('header', { className: 'gl-picker-head' }, h('strong', null, text(t, 'pickerTitle')),
              h('time', { className: 'gl-header-updated', title: text(t, 'updatedAt', { time: new Date(Math.max(0, ...Object.values(quotas).map(q => q?.fetchedAt ?? 0), ...Object.values(resets).map(r => r?.fetchedAt ?? 0))).toLocaleString() }) },
                refreshingAll ? '…' : Math.max(0, ...Object.values(quotas).map(q => q?.fetchedAt ?? 0), ...Object.values(resets).map(r => r?.fetchedAt ?? 0)) > 0 ? new Date(Math.max(0, ...Object.values(quotas).map(q => q?.fetchedAt ?? 0), ...Object.values(resets).map(r => r?.fetchedAt ?? 0))).toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }) + ' · ' + clockTime(Math.max(0, ...Object.values(quotas).map(q => q?.fetchedAt ?? 0), ...Object.values(resets).map(r => r?.fetchedAt ?? 0))) : '—'),
              h('button', { type: 'button', className: 'gl-icon', 'aria-label': text(t, 'pickerRefresh'), 'aria-busy': refreshingAll, 'data-spin': refreshingAll ? 'true' : undefined, disabled: selecting || resetBusy || refreshingAll, onClick: async () => {
                if(refreshAllLock.current)return
                refreshAllLock.current=true;setRefreshingAll(true)
                try { const ids=accounts.filter(a=>a.configured).map(a=>a.id); await Promise.all([directory.load().catch(e=>setError(e.message)),refresh(),loadQuota(ids,true),loadResets(ids,true)]) }
                finally {refreshAllLock.current=false;setRefreshingAll(false)}
              } }, RefreshIcon),
              h('button', { type: 'button', className: 'gl-icon', 'aria-label': text(t, 'pickerClose'), disabled: selecting || resetBusy, onClick: close }, '×')),
            tab === 'other' ? h('input', { className: 'gl-input gl-picker-search', value: query, placeholder: text(t, 'pickerChoose'), 'aria-label': text(t, 'pickerSearch'), onChange: e => setQuery(e.target.value) }) : null,
            h('div', { className: 'gl-compact-tabs', role: 'group', 'aria-label': text(t, 'pickerTitle') },
              h('button', { type: 'button', 'aria-pressed': tab === 'gpt', disabled: resetBusy, onClick: () => { setTab('gpt'); setQuery(''); setCommonEffort(null) } }, 'ChatGPT'),
              h('button', { type: 'button', 'aria-pressed': tab === 'other', disabled: resetBusy, onClick: () => { setTab('other'); setQuery(''); setCommonEffort(null) } }, text(t, 'pickerTabOther')),
              h(NewChatDefaults, { open, combo: newChatCombo(state.current, nativeModels, previewAccount, displayedEffort, tab), disabled: !!locked || selecting, t })),
            busy ? h('p', { className: 'gl-picker-info', role: 'status' }, text(t, 'pickerBusy')) : null,
            accountError ? h('p', { className: 'gl-picker-info', role: 'alert' }, accountError) : !snapshot ? h('p', { className: 'gl-picker-info', role: 'status' }, text(t, 'loading')) : !accounts.length ? h('p', { className: 'gl-picker-info' }, text(t, 'pickerEmptyAccounts')) : null,
            error || state.error ? h('p', { className: 'gl-picker-info', role: 'alert' }, error || state.error) : null,
            h('div', { className: 'gl-picker-list' },
              tab === 'gpt' ? h(React.Fragment, null,
                h(FanAccounts, { accounts, previewId: previewAccount?.id, currentId: state.current?.provider === 'chatgpt-session' ? selectedId : null,
                  onPreview: id => { setPreviewId(id); setQuery('') }, quotaText, compactQuota, quotas, selecting: selecting || resetBusy, t, orbLink, now, resets }),
                 previewAccount?.configured ? h(ResetMenu, { key: previewAccount.id, t, accountId: previewAccount.id, accountLabel: previewAccount.label, autoOpen: true, disabled: resetUnavailable || selecting, onBusyChange: setResetBusy, onConsumed: id => { void loadQuota([id], true); void loadResets([id], true) } }) : null)
                : h('select', { className: 'gl-input gl-compact-provider', value: previewGroup?.id ?? '', 'aria-label': text(t, 'otherProvidersBlock'), onChange: e => { setOtherProvider(e.target.value); setCommonEffort(null); setQuery('') } }, otherGroups.map(g => h('option', { value: g.id, key: g.id }, g.name))),
              levels.length ? h('div', { className: 'gl-efforts', role: 'group', 'aria-label': text(t, 'pickerReasoning') },
                levels.map((level, index) => h(ResetChoiceCard, { className: 'gl-effort-button', type: 'button', key: level.id, disabled: busy || selecting || resetBusy, 'aria-pressed': displayedEffort === level.id, onClick: () => setCommonEffort(level.id) }, h(MiniCardOrb, { seed: index + 1 }), h('span', { className: 'gl-mini-label' }, level.name ?? level.id)))) : null,
              h('div', { className: 'gl-model-grid' }, visibleModels.map(model => {
                const active = previewIsCurrent && state.current?.model === model.id
                const unsupportedEffort = !!model.reasoning?.efforts?.length && !!displayedEffort && !model.reasoning.efforts.some(level => level.id === displayedEffort)
                return h(ResetChoiceCard, { type: 'button', className: 'gl-model-cell', key: model.id, 'aria-pressed': active,
                  disabled: busy || selecting || resetBusy || unsupportedEffort || (tab === 'gpt' && !previewAccount?.configured),
                  title: model.name + ' · ' + (displayedEffort ?? ''), onClick: () => void choose(tab === 'gpt' ? previewAccount : null, provider, model) },
                  h(MiniCardOrb, { seed: visibleModels.indexOf(model) + 5 }), h('span', { className: 'gl-mini-label' }, model.name))
              })),
              !visibleModels.length ? h('p', { className: 'gl-note', role: 'status' }, text(t, state.status === 'loading' ? 'pickerLoad' : query ? 'pickerNoResults' : 'pickerEmptyModels')) : null,
              null))))

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
      inject: ['slots', 'locale', 'modelDirectories', 'remote', 'remote.settings'],
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
          return h(GptLinkSection, { t, remote: ctx.remote })
        }))
      },
    }
  },
})
