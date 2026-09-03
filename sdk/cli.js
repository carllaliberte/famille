#!/usr/bin/env node
/**
 * Local card consumer. Exit 0 = four cards hold (preview).
 * Exit 2 = classical or refus. Never a receipt.
 */
import { readFileSync } from 'node:fs'
import { peutDire } from './peut-dire.js'

const path = process.argv[2]
if (!path || path === '-h' || path === '--help') {
  process.stderr.write('usage: node sdk/cli.js <carte.json>\n')
  process.exit(2)
}

const carte = JSON.parse(readFileSync(path, 'utf8'))
const r = peutDire(carte)
process.stdout.write(JSON.stringify(r, null, 2) + '\n')
process.exit(r.quantique ? 0 : 2)
