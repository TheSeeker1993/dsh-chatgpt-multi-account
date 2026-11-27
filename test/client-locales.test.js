import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import { createAutomaticSearchProvider } from '../search/auto.js'
import { createChatGPTSearchProvider } from '../search/provider.js'

const added = ['ja', 'es', 'fr', 'de', 'pt']
const placeholders = value => (value.match(/\{[^{}]+\}/g) ?? []).sort()

function registeredLocales() {
  let plugin, messages
  const source = readFileSync(new URL('../client/index.js', import.meta.url), 'utf8')
  const react = { createElement: () => null, createContext: () => ({}) }
  vm.runInNewContext(source, { EventTarget, window: { __ModuleLoader__: {
    load(entry) { plugin = entry.factory(() => react) },
  } } })
  plugin.apply({
    effect(fn, label) { if (label === 'dsh-gpt-link: locale') fn() },
    locale: { register(namespace, value) { assert.equal(namespace, 'dsh-gpt-link'); messages = value }, bind() {} },
    inject() {}, remote: { settings: {} }, slots: { inject() {} },
  })
  return messages
}

test('DSH receives eight client locales, including complete translations and matching interpolation variables', () => {
  const messages = registeredLocales()
  assert.deepEqual(Object.keys(messages).sort(), ['en', 'ru', 'zh', ...added].sort())
  const keys = Object.keys(messages.en).sort()
  for (const locale of added) {
    assert.deepEqual(Object.keys(messages[locale]).sort(), keys, locale)
    for (const key of keys) {
      const value = messages[locale][key]
      assert.ok(typeof value === 'string' && value.trim(), `${locale}.${key}`)
      assert.deepEqual(placeholders(value), placeholders(messages.en[key]), `${locale}.${key}`)
    }
  }
})

test('activation and quota copy distinguish temporary failures from reauthentication without claiming a server rejection', () => {
  const messages = registeredLocales()
  assert.equal(messages.ru.advancedActivation, 'Активировать расширенный режим')
  assert.match(messages.ru['quota-refresh-failed'], /^Временно не удалось обновить авторизацию/)
  assert.equal(messages.ru['quota-reauth-required'], 'Для обновления авторизации войдите в этот аккаунт снова.')
  for (const locale of ['en', 'ru', 'zh', ...added]) {
    assert.ok(messages[locale].advancedActivation)
    assert.ok(messages[locale]['quota-refresh-failed'])
    assert.ok(messages[locale]['quota-reauth-required'])
    assert.doesNotMatch(messages[locale]['quota-reauth-required'], /OpenAI/)
  }
})

test('new languages include packaged descriptions and web search provider descriptions', () => {
  const auto = createAutomaticSearchProvider({}, null, null).provider
  const chatgpt = createChatGPTSearchProvider({}, {}, {}).provider
  for (const locale of added) {
    const { meta } = JSON.parse(readFileSync(new URL(`../locale/${locale}.json`, import.meta.url), 'utf8'))
    for (const value of [meta.title, meta.description, auto.description[locale], chatgpt.description[locale]]) {
      assert.ok(typeof value === 'string' && value.trim(), locale)
    }
  }
})
