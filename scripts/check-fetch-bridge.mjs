// Installed-runtime test helper. Compiles the shipped bridge source in memory;
// never modifies DSH, opens a listening socket or reads any profile credentials.
import assert from 'node:assert/strict'
import { createRequire, stripTypeScriptTypes } from 'node:module'
import { readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { Readable } from 'node:stream'
import { EventEmitter } from 'node:events'

async function loadBridge() {
  const require = createRequire(join(process.env.DSH_INSTALL_DIR, 'package.json'))
  const sourcePath = join(dirname(require.resolve('@deepseek-ai/dsh-client-connection/package.json')), 'src/http-bridge.ts')
  assert.ok(statSync(sourcePath).size < 65536)
  const source = stripTypeScriptTypes(readFileSync(sourcePath, 'utf8'), { mode: 'strip' })
  return (await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))).bridge
}

async function invokeBridge(route, { mode, url = route.path, method = 'GET', headers = {}, body }) {
  const bridge = await loadBridge()
  const req = Object.assign(Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))]), { url, method, headers })
  const res = new EventEmitter(), chunks = []
  Object.assign(res, { destroyed: false, writableEnded: false,
    writeHead(status, headers) { this.status = status; this.headers = headers },
    write(chunk) { chunks.push(Buffer.from(chunk)); return true },
    end() { this.writableEnded = true },
  })
  // The browser trust and owner checks run outside bridge; simulate an already admitted owner request.
  await bridge(req, res, { requestBodyMode: () => mode, fetch: request => route.fetch(request) }, { principal: { kind: 'owner' } })
  return { status: res.status, headers: res.headers, data: JSON.parse(Buffer.concat(chunks).toString('utf8')) }
}

export async function checkFetchBridge(route) {
  const url = route.path + '?accountId=not-configured'
  // Reproduce the previous defect against the actual bridge, not a mock handler.
  await assert.rejects(invokeBridge(route, { url }), /GET|HEAD|body/i)
  assert.equal(route.requestBody, 'buffered')
  const actual = await invokeBridge(route, { mode: route.requestBody, url })
  assert.equal(actual.status, 200)
  assert.equal(actual.headers['cache-control'], 'no-store')
  assert.equal(actual.data.error, 'ACCOUNT_NOT_FOUND')
  console.log('Installed Fetch bridge passed: missing requestBody reproduces GET-body failure; buffered GET reaches the diagnostic handler.')
}

export async function checkAccountSelectBridge(route, sessionId, accountId) {
  const actual = await invokeBridge(route, {
    mode: route.requestBody,
    method: 'POST',
    headers: {
      host: '127.0.0.1:12028', origin: 'http://127.0.0.1:12028',
      'sec-fetch-site': 'same-origin', 'content-type': 'application/json',
    },
    body: { action: 'select', sessionId, accountId },
  })
  assert.equal(actual.status, 200, JSON.stringify(actual.data))
  assert.equal(actual.data.sessionAccountId, accountId)
}
