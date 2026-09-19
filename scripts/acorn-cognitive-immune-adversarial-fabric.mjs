/** ACORN — COGNITIVE IMMUNE & ADVERSARIAL FABRIC
 * Detects, contains and learns from contradictions, anomalies and untrusted inputs.
 * It can block a cognitive path; it cannot grant authority or execute effects.
 */
import crypto from "node:crypto";
export const CONTRACT="acorn.cognitive-immune-adversarial-fabric.v1";
export const THREAT_TYPES=Object.freeze(["CONTRADICTION","ANOMALY","UNVERIFIED","INJECTION","REPLAY","DRIFT","RESOURCE_ABUSE","UNKNOWN"]);
export const STATES=Object.freeze(["OBSERVED","SUSPECTED","CONTAINED","CLEARED","EXPIRED"]);
const A=v=>Array.isArray(v)?v:[]; const id=p=>`${p}_${crypto.randomUUID()}`;
export function createThreat({type,source,target=null,signals=[],evidence=[],severity=0.5}={}){
 if(!THREAT_TYPES.includes(type)) throw new Error("THREAT_TYPE_UNSUPPORTED");
 return {id:id("threat"),type,source:String(source||"unknown"),target,evidence:A(evidence),signals:A(signals),severity:Math.max(0,Math.min(1,Number(severity)||0)),state:"OBSERVED",authority:false,breaker_touched:false,created_at:new Date().toISOString()};
}
export function detectAnomalies({observations=[],baseline=null}={}){
 const base=Number(baseline);
 return A(observations).map(o=>({...o,anomaly:baseline!==null&&Number.isFinite(base)&&Number.isFinite(Number(o.value))&&Math.abs(Number(o.value)-base)>Math.max(1,Math.abs(base)*0.5)}));
}
export function assessTrust({evidence=[],verified=false,measured=false,expired=false}={}){
 if(expired) return {state:"EXPIRED",trust:0};
 if(verified===true&&measured===true&&A(evidence).length>0) return {state:"VERIFIED",trust:1};
 if(A(evidence).length>0) return {state:"EVIDENCE_BACKED",trust:.5};
 return {state:"UNVERIFIED",trust:0};
}
export function containThreat(threat,{reason="UNTRUSTED_PATH"}={}){
 return {...threat,state:"CONTAINED",containment:{reason,contained_at:new Date().toISOString()},authority:false,breaker_touched:false};
}
export function evaluateCognitivePath({evidence=[],verified=false,measured=false,expired=false,anomaly=false,threats=[]}={}){
 const trust=assessTrust({evidence,verified,measured,expired});
 const active=A(threats).filter(t=>["OBSERVED","SUSPECTED","CONTAINED"].includes(t.state));
 const blocked=expired||trust.trust===0||anomaly||active.some(t=>(Number(t.severity)||0)>=0.8);
 return {state:blocked?"BLOCKED":"ADMISSIBLE_FOR_COGNITION",trust,active_threats:active.length,authority:false,external_effect:false};
}
export function analyzeDrift({previous={},current={},keys=[]}={}){
 const changes=A(keys).filter(k=>JSON.stringify(previous[k])!==JSON.stringify(current[k]));
 return {drifted:changes.length>0,changes,measured:true,verified:false,authority:false};
}
export function learnThreatSignal({signal,outcome={}}={}){
 const valid=outcome.measured===true&&outcome.verified===true&&outcome.valid!==false;
 return {signal,state:valid?"LEARNED":"NO_LEARNING",measured:outcome.measured===true,verified:outcome.verified===true,authority:false};
}
export function buildImmuneSnapshot({threats=[],signals=[],at=new Date().toISOString()}={}){
 return {contract:CONTRACT,captured_at:at,threats:A(threats),signals:A(signals),authority:false,external_effect:false};
}
export function assertImmuneConstitution(snapshot={}){
 if(snapshot.authority===true) throw new Error("IMMUNE_CANNOT_GRANT_AUTHORITY");
 if(snapshot.breaker_touched===true) throw new Error("IMMUNE_CANNOT_TOUCH_BREAKER");
 if(snapshot.auto_authorize===true) throw new Error("IMMUNE_CANNOT_AUTHORIZE");
 if(snapshot.external_effect===true) throw new Error("IMMUNE_CANNOT_EXECUTE");
 if(snapshot.hidden_learning===true) throw new Error("IMMUNE_LEARNING_MUST_BE_EXPLICIT");
 return true;
}
