/** Installed runtime contract: synthetic native adapters, schemas, OAuth cancellation,
 * and discovery. Never reads the user's profile credentials or starts inference. */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const runtime = process.env.DSH_NODE_EXECUTABLE
if (!runtime || !process.env.DSH_INSTALL_DIR) {
  console.log('Installed-runtime contract not run: DSH_NODE_EXECUTABLE and DSH_INSTALL_DIR are required.')
  process.exit(1)
}
for (const relative of ['./smoke-runtime.mjs', '../test/smoke-installed.mjs']) {
  const result = spawnSync(runtime, [fileURLToPath(new URL(relative, import.meta.url))], {
    stdio: 'inherit', env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
  })
  if (result.error) {
    console.error('Installed runtime contract could not start.')
    process.exit(1)
  }
  if (result.status !== 0) process.exit(result.status ?? 1)
}
