import assert from 'node:assert/strict'
import { createModelProbe } from '../scripts/diagnostics/model-probe.js'
import { zstdDecompressSync } from 'node:zlib'

/** Real installed encoder/decoder with synthetic OAuth and synthetic SSE.
 * The injected fetch is the ONLY possible network path and never opens a socket. */
export async function smokeModelProbe({ createModels, openaiCodexProvider }) {
  const payload = Buffer.from(JSON.stringify({ sub: 'synthetic-user', 'https://api.openai.com/auth': { chatgpt_account_id: 'synthetic-issuer' } })).toString('base64url')
  const grant = { type: 'oauth', access: 'eyJhbGciOiJub25lIn0.' + payload + '.synthetic', refresh: 'synthetic', accountId: 'synthetic-issuer', expires: Date.now() + 3600000 }
  const calls = [], record = { kind: 'grant', payload: grant }
  let leases = 0
  const accounts = { acquireAccount: async () => { leases++; return { accountId: 'synthetic', release() { leases-- } } },
    recordStore: () => ({ readRecord: async () => structuredClone(record) }),
    credentialStore: () => ({ read: async () => structuredClone(grant), list: async () => [], modify: async () => { throw Error('Must not refresh OAuth') }, delete: async () => { throw Error('Must not delete OAuth') } }),
  }
  const sse = events => new Response(events.map(value => 'event: ' + value.type + '\ndata: ' + JSON.stringify(value) + '\n\n').join(''), { headers: { 'content-type': 'text/event-stream' } })
  const probe = createModelProbe({ accounts, createModels, openaiCodexProvider, fetch: async (url, init) => {
    assert.equal(String(url), 'https://chatgpt.com/backend-api/codex/responses')
    assert.equal(init.method, 'POST')
    const headers = new Headers(init.headers)
    const body = typeof init.body === 'string' ? init.body : Buffer.from(headers.get('content-encoding') === 'zstd' ? zstdDecompressSync(init.body) : init.body).toString('utf8')
    const sent = JSON.parse(body)
    calls.push(sent)
    assert.equal(sent.model, 'gpt-6.2-sol')
    assert.equal(calls.length <= 2, true)
    const usage = { input_tokens: 1, output_tokens: 1, total_tokens: 2 }
    if (calls.length === 1) {
      assert.equal(sent.tools[0].name, 'diagnostic_echo')
      const item = { id: 'fc_synthetic', type: 'function_call', call_id: 'call_synthetic', name: 'diagnostic_echo', arguments: '{"value":"OK"}', status: 'completed' }
      return sse([
        { type: 'response.created', response: { id: 'response1', status: 'in_progress' } },
        { type: 'response.output_item.added', output_index: 0, item: { ...item, arguments: '' } },
        { type: 'response.function_call_arguments.delta', output_index: 0, item_id: item.id, delta: item.arguments },
        { type: 'response.output_item.done', output_index: 0, item },
        { type: 'response.completed', response: { id: 'response1', status: 'completed', output: [item], usage } },
      ])
    }
    assert.ok(sent.input.some(item => item.type === 'function_call_output' && item.call_id === 'call_synthetic' && item.output.includes('OK')))
    const item = { id: 'msg_synthetic', type: 'message', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: 'OK', annotations: [] }] }
    return sse([
      { type: 'response.created', response: { id: 'response2', status: 'in_progress' } },
      { type: 'response.output_item.added', output_index: 0, item: { ...item, content: [] } },
      { type: 'response.content_part.added', output_index: 0, content_index: 0, part: { type: 'output_text', text: '', annotations: [] } },
      { type: 'response.output_text.delta', output_index: 0, content_index: 0, delta: 'OK' },
      { type: 'response.output_item.done', output_index: 0, item },
      { type: 'response.completed', response: { id: 'response2', status: 'completed', output: [item], usage } },
    ])
  } })
  try {
    const result = await probe.probe('synthetic')
    assert.deepEqual({ status: result.status, toolCalled: result.toolCalled, toolResultAccepted: result.toolResultAccepted, replyValidated: result.replyValidated, error: result.error }, { status: 'passed', toolCalled: true, toolResultAccepted: true, replyValidated: true, error: null })
    assert.equal(calls.length, 2)
    assert.equal((await probe.probe('synthetic')).requestCount, 2)
    assert.equal(calls.length, 2)
  } finally { await probe.dispose() }
  assert.equal(leases, 0)
  console.log('Native model-probe codec passed: actual installed OAuth/Responses encoder + tool roundtrip decoder, synthetic SSE only, zero network.')
}
