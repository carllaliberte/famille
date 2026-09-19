import {runNeuralInteroperability} from "./acorn-neural-interoperability-conductor.mjs";
export const CONTRACT="acorn.system-interoperability-adapter.v1";
const ADAPTERS={"cortex":"CORTEX","world-model":"WORLD_MODEL","reality":"PERCEPTION","memory":"MEMORY","synaptic":"MEMORY","capability":"CAPABILITY","intelligence":"INTELLIGENCE","tool":"TOOL","resource":"RESOURCE","evidence":"EVIDENCE","execution":"ACTION","outcome":"OUTCOME","governance":"GOVERNANCE","project":"PROJECT","customer":"CUSTOMER","connectivity":"CONNECTOR","experiment":"EXPERIMENT"};
export function classifySystemModule(name){const n=String(name).toLowerCase();const k=Object.keys(ADAPTERS).find(x=>n.includes(x));return ADAPTERS[k]||"UNKNOWN"}
export function buildSystemInteroperability({modules=[],links=[],signals=[]}={}){const nodes=modules.map(m=>({...m,type:m.type||classifySystemModule(m.id||m.name)}));return runNeuralInteroperability({nodes,edges:links,signals})}
export function assertAdapterConstitution(x={}){return {contract:CONTRACT,valid:x.auto_execute!==true&&x.authority!==true,violations:[...(x.auto_execute===true?["AUTO_EXECUTION"]:[]),...(x.authority===true?["AUTHORITY_ESCALATION"]:[])]}}
