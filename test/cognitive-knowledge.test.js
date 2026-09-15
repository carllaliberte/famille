import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { contributionId, ingestContribution, queryKnowledge, supersedeContribution, retractContribution } from '../scripts/cognitive-knowledge.mjs';

function ledger() { return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'acorn-knowledge-')), 'ledger.jsonl'); }
function base() { return { version:'cognitive-knowledge.v1', source_identity:'grok', kind:'observation', subject:'test', content:'observable result', state:'observed', provenance:{source:'test',observed_at:'2026-09-15T00:00:00.000Z'}, observed_at:'2026-09-15T00:00:00.000Z' }; }

test('deterministic id is stable and excludes supplied id', () => { const a=base(); assert.equal(contributionId(a), contributionId({...a,id:'ignored'})); });
test('ingestion is append-only and idempotent', () => { const file=ledger(); const a=ingestContribution(base(),{ledgerFile:file}); const b=ingestContribution(base(),{ledgerFile:file}); assert.equal(a.status,'appended'); assert.equal(b.status,'duplicate'); assert.equal(fs.readFileSync(file,'utf8').trim().split('\n').length,1); });
test('query indexes subject, source, state and conditions', () => { const file=ledger(); ingestContribution({...base(),conditions:['build']},{ledgerFile:file}); assert.equal(queryKnowledge({subject:'test',source_identity:'grok',state:'observed',condition:'build'},file).length,1); });
test('supersession creates a new record without mutating the target', () => { const file=ledger(); const first=ingestContribution(base(),{ledgerFile:file}).contribution; const second=supersedeContribution({...base(),content:'new result',observed_at:'2026-09-15T01:00:00.000Z',provenance:{source:'test',observed_at:'2026-09-15T01:00:00.000Z'}},first.id,{ledgerFile:file}).contribution; assert.notEqual(first.id,second.id); assert.deepEqual(second.supersedes,[first.id]); });
test('retraction is explicit and append-only', () => { const file=ledger(); const first=ingestContribution(base(),{ledgerFile:file}).contribution; const ret=retractContribution({...base(),content:'explicit retraction',observed_at:'2026-09-15T02:00:00.000Z',provenance:{source:'test',observed_at:'2026-09-15T02:00:00.000Z'}},first.id,{ledgerFile:file}).contribution; assert.equal(ret.state,'retracted'); assert.deepEqual(ret.retracts,[first.id]); assert.equal(fs.readFileSync(file,'utf8').trim().split('\n').length,2); });
test('secret/private reasoning material is rejected', () => { assert.throws(()=>ingestContribution({...base(),content:'private chain-of-thought and api key'}, {ledgerFile:ledger()}), /not shareable/); });
test('declared state is never silently promoted', () => { const file=ledger(); const r=ingestContribution({...base(),state:'declared'},{ledgerFile:file}); assert.equal(r.contribution.state,'declared'); });
