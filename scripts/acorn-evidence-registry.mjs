/** ACORN — EVIDENCE REGISTRY
 * Evidence is a dated state, never an eternal essence.
 */
import { evidenceRecord } from "./acorn-enterprise-state.mjs";
export function registerEvidence(input){return evidenceRecord(input);}
export function evidenceIsCurrent(e,at=Date.now()){
 if(e.status!=="MEASURED") return false;
 return !e.valid_until || Date.parse(e.valid_until)>=at;
}
export function strongestCurrentEvidence(items=[],at=Date.now()){
 return items.filter(e=>evidenceIsCurrent(e,at)).sort((a,b)=>(b.strength-b.margin)-(a.strength-a.margin))[0]||null;
}
export function proofGate({evidence=[],required=1}={}){
 const current=evidence.filter(e=>evidenceIsCurrent(e));
 return {ready:current.length>=required,current_count:current.length,required,measured_at:new Date().toISOString()};
}
