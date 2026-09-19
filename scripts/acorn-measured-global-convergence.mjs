import fs from "node:fs";
import path from "node:path";

export const CONTRACT="acorn.measured-global-convergence.v1";
export const CHECKS=Object.freeze([
  "DEFINED","IMPLEMENTED","INTEGRATED","TESTED","OBSERVED","MEASURED","VERIFIED",
  "LIVE","CONNECTED","EVIDENCED","REUSABLE","GOVERNED","RESOURCE_AWARE",
  "SECURE","ECONOMIC","TEMPORAL","HUMAN_SOVEREIGN"
]);

const A=v=>Array.isArray(v)?v:[];
const exists=p=>fs.existsSync(p);

function architectureDocs(root){
  const dir=path.join(root,"docs","architecture");
  if(!exists(dir)) return [];
  return fs.readdirSync(dir).filter(x=>x.endsWith(".md")).sort();
}

function runtimeModules(root){
  const dir=path.join(root,"scripts");
  if(!exists(dir)) return [];
  return fs.readdirSync(dir).filter(x=>x.startsWith("acorn-")&&x.endsWith(".mjs")).sort();
}

export function measureArchitecture({root=process.cwd(),contracts=[],runtime=[],evidence=[]}={}){
  const docs=architectureDocs(root);
  const modules=runtime.length?A(runtime):runtimeModules(root);
  const declared=A(contracts).length?A(contracts):docs;
  const implemented=new Set(modules.map(x=>x.replace(/^acorn-/,"").replace(/\.mjs$/,"")));
  const rows=declared.map(id=>{
    const key=String(id).replace(/^.*\//,"").replace(/\.md$/,"").replace(/^\d+-/,"");
    const implementation=modules.find(x=>x.includes(key));
    const ev=A(evidence).filter(e=>e?.id===id||e?.key===key);
    const measured=ev.some(e=>e.measured===true);
    const verified=ev.some(e=>e.verified===true);
    return {id,key,defined:true,implemented:Boolean(implementation),tested:ev.some(e=>e.tested===true),observed:ev.some(e=>e.observed===true),measured,verified,live:ev.some(e=>e.live===true),evidence:ev.length,governed:ev.some(e=>e.governed===true)};
  });
  const missing=rows.flatMap(r=>{
    const out=[];
    if(!r.implemented) out.push("IMPLEMENTATION");
    if(!r.tested) out.push("TESTS");
    if(!r.observed) out.push("OBSERVATION");
    if(!r.measured) out.push("MEASUREMENT");
    if(!r.verified) out.push("VERIFICATION");
    if(!r.evidence) out.push("EVIDENCE");
    if(!r.governed) out.push("GOVERNANCE");
    return out.map(kind=>({id:r.id,key:r.key,kind}));
  });
  return {
    contract:CONTRACT,
    checks:CHECKS,
    counts:{architectures:rows.length,implemented:rows.filter(x=>x.implemented).length,measured:rows.filter(x=>x.measured).length,verified:rows.filter(x=>x.verified).length,live:rows.filter(x=>x.live).length},
    coverage:rows.length?rows.filter(x=>x.verified).length/rows.length:0,
    rows,
    missing,
    state:missing.length?"GAPS_MEASURED":"NO_DECLARED_GAPS",
    completion:"NEVER_ASSUMED",
    authority:false,
    auto_authorize:false,
    auto_execute:false
  };
}

export function convergenceVerdict(snapshot={}){
  const violations=[];
  if(snapshot.authority===true) violations.push("AUTHORITY_ESCALATION");
  if(snapshot.auto_authorize===true) violations.push("AUTO_AUTHORIZATION");
  if(snapshot.auto_execute===true) violations.push("AUTO_EXECUTION");
  if(snapshot.breaker_bypass===true) violations.push("BREAKER_BYPASS");
  return {contract:CONTRACT,valid:violations.length===0,violations,completion:"MEASURED_ONLY",next_step:snapshot.missing?.length?"CLOSE_MEASURED_GAPS":"REOBSERVE_SYSTEM"};
}
