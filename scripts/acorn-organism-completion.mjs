export const CONTRACT="acorn.organism-completion.v1";
const clamp=x=>Math.max(0,Math.min(1,Number(x)||0));
export const ORGANS=Object.freeze(["SELF_MODEL","EXPERIMENT","ECOSYSTEM","CAPABILITY_EVOLUTION","COLLECTIVE","TEMPORAL","ACTION_FACTORY","VALUE","RESILIENCE"]);
export function createOrganismState(input={}){return {contract:CONTRACT,organs:ORGANS.map(name=>({name,state:input[name]?.state||"DEFINED",evidence:input[name]?.evidence||[]})),authority:false,live:false};}
export function selfModel({capabilities=[],limits=[],uncertainties=[]}={}){return {capabilities,limits,uncertainties,authority:false};}
export function experiment({hypothesis,mode="SIMULATION"}={}){return {hypothesis,mode,state:"PLANNED",external_effect:false,authority:false};}
export function qualifyParticipant({id,capabilities=[],evidence=[]}={}){return {id,capabilities,evidence,qualified:evidence.length>0,authority:false};}
export function evolveCapability({capability,revision,evidence=[],measured=false,verified=false}={}){return {capability,revision,evidence,state:measured&&verified?"QUALIFIED":"PROPOSED",authority:false};}
export function collective({members=[],opinions=[]}={}){return {members,opinions,consensus:opinions.length>0&&new Set(opinions).size===1,dissent:new Set(opinions).size>1,authority:false};}
export function prediction({claim,horizon}={}){return {claim,horizon,state:"PREDICTED",authority:false};}
export function project({problem,phases=["ANALYZE","ARCHITECT","BUILD","TEST","VALIDATE","DEPLOY","MONITOR"]}={}){return {problem,phases,state:"PLANNED",authority:false};}
export function valueModel({revenue=0,cost=0,value=0}={}){return {revenue,cost,margin:revenue-cost,value,measured:true};}
export function recovery({component,alternatives=[]}={}){return {component,alternatives,state:"RECOVERY_PROPOSED",authority:false};}
export function optimizeOrganism({candidates=[],outcomes=[]}={}){const valid=outcomes.filter(x=>x.measured===true&&x.verified===true);return {candidates,validated_outcomes:valid.length,selected:valid.length?candidates[0]||null:null,authority:false,external_effect:false};}
export function assertOrganismConstitution(x={}){if(x.authority===true||x.auto_authorize===true||x.auto_spend===true||x.auto_contract===true||x.external_effect===true)throw new Error("ORGANISM_CONSTITUTION_VIOLATION");return true;}
