#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
const packageName = packageJson.name
const packageVersion = packageJson.version

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: options.stdio ?? 'inherit',
    shell: options.shell ?? false,
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
  return result
}

const browser = spawnSync('npm', ['config', 'get', 'browser'], {
  encoding: 'utf8',
  shell: false,
})
const browserValue = (browser.stdout || '').trim()
if (browserValue !== 'open -a Dia') {
  run('npm', ['config', 'set', 'browser', 'open -a Dia'])
}

const expectScript = `
set timeout 300
spawn npm publish --access public --registry https://registry.npmjs.org/
expect {
  -re {Press ENTER to open in the browser} {
    send "\\r"
    exp_continue
  }
  eof
}
catch wait result
exit [lindex $result 3]
`

console.log(`Publishing ${packageName}@${packageVersion} via Dia TTY flow...`)
run('expect', ['-c', expectScript])

const published = spawnSync(
  'npm',
  ['view', `${packageName}@${packageVersion}`, 'version', '--registry', 'https://registry.npmjs.org/'],
  { encoding: 'utf8', shell: false },
)

if (published.status !== 0 || (published.stdout || '').trim() !== packageVersion) {
  console.error(`Publish did not land on npm for ${packageName}@${packageVersion}`)
  process.exit(1)
}

console.log(`Published ${packageName}@${packageVersion}`)
run('open', ['-a', 'Dia', `https://www.npmjs.com/package/${packageName}`])
