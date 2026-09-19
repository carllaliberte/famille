export const CONTRACT="acorn.experimentation-digital-twin.v1";
export function createExperiment({hypothesis,baseline=null,variables=[],mode="SIMULATION"}={}){return {id:crypto.randomUUID(),contract:CONTRACT,hypothesis,baseline,variables,mode,state:"PLANNED",authority:false};}
export function simulateExperiment({experiment,outcomes=[]}={}){return {...experiment,state:"SIMULATED",predicted:outcomes,external_effect:false};}
export function comparePrediction({predicted=[],observed=[]}={}){return {matches:JSON.stringify(predicted)===JSON.stringify(observed),predicted,observed,measured:true};}
export function learnExperiment({comparison={},verified=false}={}){return {learned:comparison.measured===true&&verified===true,authority:false};}
