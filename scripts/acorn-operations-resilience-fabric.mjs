/** ACORN — OPERATIONS & RESILIENCE FABRIC */
const ISO=()=>new Date().toISOString();
const uid=p=>`${p}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
export function createSla({service,targets={availability:0.99,response_ms:500,completion_hours:24},escalation="HUMAN"}={}){return{id:uid("sla"),service,targets,escalation,human_escalation:true,created_at:ISO()}};
export function observeService({service,health="UNKNOWN",latencyMs=null,errorRate=null,evidence=[]}={}){return{id:uid("obs"),service,health,latency_ms:latencyMs,error_rate:errorRate,evidence,measured_at:ISO()}};
export function createIncident({service,severity="P2",symptoms=[],observations=[],impact="UNKNOWN"}={}){return{id:uid("inc"),service,severity,symptoms,observations,impact,state:"OPEN",human_escalation:true,created_at:ISO()}};
export function resolveIncident(incident,{resolution,evidence=[]}={}){return{...incident,state:"RESOLVED",resolution,evidence,resolved_at:ISO()}};
export function capacityPlan({resources=[],demand=[],constraints=[]}={}){return{id:uid("capacity"),resources,demand,constraints,actions:resources.map(r=>({resource:r.id,action:"MEASURE_AND_PLAN"})),auto_scaling_authority:false,measured_at:ISO()}};
export function resilienceSnapshot({observations=[],incidents=[],slas=[],capacity=[]}={}){return{observations:observations.length,open_incidents:incidents.filter(i=>i.state==="OPEN").length,slas:slas.length,capacity_plans:capacity.length,human_escalation:true,measured_at:ISO()}};
