// Installed-runtime test helper. Compiles the shipped bridge source in memory;
// never modifies DSH, opens a listening socket or reads any profile credentials.
import assert from 'node:assert/strict'
import { createRequire, stripTypeScriptTypes } from 'node:module'
import { readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { Readable } from 'node:stream'
import { EventEmitter } from 'node:events'

export async function checkFetchBridge(route) {
  const require = createRequire(join(process.env.DSH_INSTALL_DIR, 'package.json'))
  const sourcePath = join(dirname(require.resolve('@deepseek-ai/dsh-client-connection/package.json')), 'src/http-bridge.ts')
  assert.ok(statSync(sourcePath).size < 65536)
  const source = stripTypeScriptTypes(readFileSync(sourcePath, 'utf8'), { mode: 'strip' })
  const { bridge } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))
  const invoke = async mode => {
    const req = Readable.from([])
    Object.assign(req, { url: route.path + '?accountId=not-configured', method: 'GET', headers: {} })
    const res = new EventEmitter(), chunks = []
    Object.assign(res, { destroyed: false, writableEnded: false,
      writeHead(status, headers) { this.status = status; this.headers = headers },
      write(chunk) { chunks.push(Buffer.from(chunk)); return true },
      end() { this.writableEnded = true },
    })
    await bridge(req, res, { requestBodyMode: () => mode, fetch: request => route.fetch(request) }, { principal: { kind: 'owner' } })
    return { status: res.status, headers: res.headers, report: JSON.parse(Buffer.concat(chunks).toString('utf8')) }
  }
  // Reproduce the previous defect against the actual bridge, not a mock handler.
  await assert.rejects(invoke(undefined), /GET|HEAD|body/i)
  assert.equal(route.requestBody, 'buffered')
  const actual = await invoke(route.requestBody)
  assert.equal(actual.status, 200)
  assert.equal(actual.headers['cache-control'], 'no-store')
  assert.equal(actual.report.error, 'ACCOUNT_NOT_FOUND')
  console.log('Installed Fetch bridge passed: missing requestBody reproduces GET-body failure; buffered GET reaches the diagnostic handler.')
}
