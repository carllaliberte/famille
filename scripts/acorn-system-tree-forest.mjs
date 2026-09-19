import fs from "node:fs";
import path from "node:path";
import { auditAcorn } from "./acorn-self-auditing-system.mjs";

export const CONTRACT = "acorn.system-tree-forest.v1";

const exists = p => fs.existsSync(p);
const read = (root, file) => { try { return fs.readFileSync(path.join(root, file), "utf8"); } catch { return ""; } };
const uniq = a => [...new Set(a)];

function files(root, dir, pred) {
  const base = path.join(root, dir);
  if (!exists(base)) return [];
  const out = [];
  const visit = d => {
    for (const e of fs.readdirSync(d, {withFileTypes:true})) {
      if (e.name === ".git" || e.name === "node_modules") continue;
      const f = path.join(d,e.name);
      if (e.isDirectory()) visit(f);
      else if (pred(e.name)) out.push(path.relative(root,f).split(path.sep).join("/"));
    }
  };
  visit(base);
  return out.sort();
}

function kindForRuntime(file) {
  const n = path.basename(file);
  if (/cortex|brain|autonomy|autopilot/i.test(n)) return "COGNITIVE_TRUNK";
  if (/nervous|signal|connectivity|reality|world-model|perception/i.test(n)) return "SENSORY_NERVOUS_ORGAN";
  if (/memory|synaptic|knowledge|semantic|temporal/i.test(n)) return "MEMORY_KNOWLEDGE_ORGAN";
  if (/metabolism|resource|cost|energy/i.test(n)) return "RESOURCE_ORGAN";
  if (/security|trust|immune|adversarial|safety/i.test(n)) return "DEFENSE_ORGAN";
  if (/project|customer|value|economic|commerce|revenue|market/i.test(n)) return "VALUE_PROJECT_ORGAN";
  if (/capability|intelligence|tool|agent|federat|collective/i.test(n)) return "COGNITIVE_ECOSYSTEM_ORGAN";
  if (/experiment|twin|evolution|optimization|improvement|self-model/i.test(n)) return "ADAPTATION_ORGAN";
  if (/execution|effect|govern|proof|evidence|measurement|audit|convergence/i.test(n)) return "GOVERNANCE_PROOF_ORGAN";
  return "ORGAN";
}

export function buildSystemTree({root=process.cwd(), evidence=[], contracts=[]}={}) {
  const audit = auditAcorn({root,evidence,contracts});
  const nodes = [];
  const edges = [];
  const add = (id,type,label,meta={}) => nodes.push({id,type,label,...meta});

  add("root:constitution","ROOT","Acorn Constitution",{authority:false});
  add("root:governance","ROOT","Human Governance",{authority:"CARL"});
  add("root:reality","ROOT","Measured Reality",{live:false});
  edges.push(["root:constitution","root:governance"],["root:constitution","root:reality"]);

  const trunkIds = new Set();
  for (const r of audit.runtime) {
    const type = kindForRuntime(r.file);
    const id = "runtime:"+r.file;
    add(id,type,path.basename(r.file),{
      file:r.file, contracts:r.contracts, tested:audit.gaps.every(g=>!(g.id===r.file+":TEST_COVERAGE")),
      governed:r.hasConstitution
    });
    const parent = type === "COGNITIVE_TRUNK" ? "root:constitution"
      : type === "GOVERNANCE_PROOF_ORGAN" ? "root:governance"
      : "root:reality";
    edges.push([parent,id]);
    trunkIds.add(type);
  }

  for (const a of audit.architecture) {
    const id = "architecture:"+a.file;
    const linked = a.contract && audit.runtime.some(r=>r.contracts.includes(a.contract));
    add(id,linked?"BRANCH":"DEFINED_ONLY",path.basename(a.file),{
      file:a.file,contract:a.contract,runtimeHints:a.runtimeHints,implemented:linked
    });
    edges.push(["root:constitution",id]);
    for (const hint of a.runtimeHints) {
      const rid = "runtime:scripts/"+hint;
      if (audit.runtime.some(r=>r.file===rid)) edges.push([id,rid]);
    }
  }

  for (const t of audit.runtime) {
    const tested = !audit.gaps.some(g=>g.id===t.file+":TEST_COVERAGE");
    add("leaf:test:"+t.file,"LEAF",tested?"TESTED":"TEST_GAP",{runtime:t.file,tested});
    edges.push(["runtime:"+t.file,"leaf:test:"+t.file]);
  }

  const runtimeIds = new Set(audit.runtime.map(r=>"runtime:"+r.file));
  const connected = new Set(edges.flat());
  const orphanRuntime = [...runtimeIds].filter(id=>!connected.has(id));
  const disconnected = nodes.map(n=>n.id).filter(id=>!connected.has(id));

  const byType = {};
  for (const n of nodes) (byType[n.type] ??= 0, byType[n.type]++);
  const gapKinds = {};
  for (const g of audit.gaps) (gapKinds[g.kind] ??= 0, gapKinds[g.kind]++);

  return {
    contract:CONTRACT,
    generated_at:new Date().toISOString(),
    state:audit.gaps.length ? "FOREST_WITH_MEASURED_GAPS" : "FOREST_STRUCTURALLY_COHERENT",
    truth:"DESCRIPTIVE_REPOSITORY_GRAPH_NOT_LIVE_PROOF",
    roots:nodes.filter(n=>n.type==="ROOT").map(n=>n.id),
    nodes,
    edges,
    summary:{
      nodes:nodes.length,edges:edges.length,
      node_types:byType,
      measured_gaps:gapKinds,
      orphan_runtime:orphanRuntime,
      disconnected_nodes:disconnected,
      architecture_docs:audit.inventory.architecture_docs,
      runtime_modules:audit.inventory.runtime_modules,
      tests:audit.inventory.tests,
      workflows:audit.inventory.workflows
    },
    authority:false,
    auto_authorize:false,
    auto_execute:false,
    live:false
  };
}

export function forestHealth(tree={}) {
  const s=tree.summary||{};
  const gaps=Object.values(s.measured_gaps||{}).reduce((a,b)=>a+b,0);
  return {
    state:gaps?"GAPS_VISIBLE":"NO_GAPS_DETECTED",
    measured_gaps:gaps,
    orphan_runtime:(s.orphan_runtime||[]).length,
    disconnected_nodes:(s.disconnected_nodes||[]).length,
    evidence:"REPOSITORY_STRUCTURAL_EVIDENCE_ONLY"
  };
}

export function assertSystemTreeConstitution(tree={}) {
  const violations=[];
  if(tree.authority===true) violations.push("AUTHORITY_ESCALATION");
  if(tree.auto_authorize===true) violations.push("AUTO_AUTHORIZATION");
  if(tree.auto_execute===true) violations.push("AUTO_EXECUTION");
  if(tree.live===true) violations.push("FAKE_LIVE");
  return {contract:CONTRACT,valid:violations.length===0,violations};
}
