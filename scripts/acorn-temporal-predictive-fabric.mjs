export const CONTRACT="acorn.temporal-predictive-fabric.v1";
export function createTemporalSignal({value,time_horizon=null,confidence=0.5,provenance=null}={}){return {value,time_horizon,confidence,provenance,state:"OBSERVED",authority:false};}
export function createPrediction({inputs=[],horizon,confidence=0.5}={}){return {inputs,horizon,confidence,state:"PREDICTED",fact:false,authority:false};}
export function comparePrediction({prediction,observed}={}){const matches=JSON.stringify(prediction?.value)===JSON.stringify(observed?.value);return {matches,prediction,observed,measured:true,verified:false};}
export function learnTemporalModel({comparison={},verified=false}={}){return {learned:comparison.measured===true&&verified===true,authority:false,source:"MEASURED_VERIFIED_ONLY"};}
export function assertTemporalConstitution(){return {authority:false,breaker_touched:false,external_effect:false,prediction_is_not_fact:true,learning_requires_verification:true};}
