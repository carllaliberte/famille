export const CONTRACT="acorn.system-decision-queue.v1";
export function buildDecisionQueue({opportunities=[],observations=[]}={}){
 const items=[...opportunities.map((x,i)=>({...x,decision_id:"opp-"+(i+1),status:"REQUIRES_HUMAN_OR_MEASURED_NEXT_STEP"})),...observations.map((x,i)=>({...x,decision_id:"obs-"+(i+1),status:"REQUIRES_OBSERVATION"}))];
 return {contract:CONTRACT,items:items.sort((a,b)=>(b.priority||0)-(a.priority||0)).slice(0,100),authority:false,human_gate:true,auto_authorize:false,auto_execute:false,live:false}
}
export function assertDecisionQueueConstitution(x={}){const v=[];if(x.authority===true)v.push("AUTHORITY_ESCALATION");if(x.human_gate!==true)v.push("HUMAN_GATE_MISSING");if(x.auto_execute===true)v.push("AUTO_EXECUTION");return {contract:CONTRACT,valid:!v.length,violations:v}}
