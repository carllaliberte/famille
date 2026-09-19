import test from "node:test";
import assert from "node:assert/strict";
import {assessKnowledge,buildObservationCandidates,selectObservationCandidate,planKnowledgeLoop,recordKnowledgeOutcome,assertKnowledgeLoopConstitution} from "../scripts/acorn-autonomous-knowledge-loop.mjs";

test("unknown reality creates a knowledge gap",()=>{const a=assessKnowledge([]);assert.equal(a.state,"GAP_FOUND");});
test("conflict becomes an explicit reconciliation candidate",()=>{const a=buildObservationCandidates({gaps:[{kind:"CONFLICT",priority:1}]});assert.equal(a[0].purpose,"RECONCILE_CONFLICT");});
test("selection is deterministic and bounded",()=>{const c=buildObservationCandidates({gaps:[{kind:"STALE_EVIDENCE",priority:.8},{kind:"CONFLICT",priority:1}]});const s=selectObservationCandidate(c);assert.equal(s.kind,"CONFLICT");assert.equal(s.auto_execute,false);});
test("plan never performs observation",()=>{const p=planKnowledgeLoop({observations:[],capability:"read_repository"});assert.equal(p.state,"SELECTED");assert.equal(p.next,"WAITING_FOR_OBSERVATION");assert.equal(p.auto_execute,false);});
test("measured verified observation can close a planned knowledge step",()=>{const p=planKnowledgeLoop({observations:[],capability:"read_repository"});const r=recordKnowledgeOutcome(p,{observation:{source:"github",subject:"repo",value:"reachable",evidence:[{at:"2026-09-19"}]},verified:true,measured:true});assert.equal(r.state,"LEARNED");assert.equal(r.authority,false);});
test("constitution blocks automatic execution and authority",()=>{assert.equal(assertKnowledgeLoopConstitution({auto_execute:true}).valid,false);assert.equal(assertKnowledgeLoopConstitution({authority:true}).valid,false);assert.equal(assertKnowledgeLoopConstitution({}).valid,true);});
