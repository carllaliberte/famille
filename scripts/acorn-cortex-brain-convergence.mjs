/** ACORN — CORTEX/BRain convergence runtime. This is integration, not a second brain. */
import {protocolEnvelope,negotiateProtocol,assertProtocolConstitution} from "./acorn-universal-cognitive-protocol.mjs";
import {createSemanticEvent,appendEvent,summarizeEventSpine} from "./acorn-universal-semantic-event-spine.mjs";
import {createStateSpace,updateBeliefs,applyInterference,collapseStateSpace} from "./acorn-cognitive-computation-engine.mjs";
import {buildSystemContext} from "./acorn-continuous-system-context-fabric.mjs";
import {buildCapabilityMesh,assertCapabilityMeshConstitution} from "./acorn-universal-capability-mesh.mjs";
import {collectRuntimeEvidence} from "./acorn-runtime-evidence-activation.mjs";
import {assertConstitution} from "./acorn-mega-08-cortex-completion.mjs";
export const CONTRACT="acorn.cortex.brain-convergence.v1";
export const CYCLE=Object.freeze(["INGEST","NORMALIZE","CONTEXTUALIZE","REMEMBER","DISCOVER","COMPUTE","COMPOSE","PLAN","REQUEST_AUTHORIZATION","ACT_THROUGH_GOVERNANCE","OBSERVE","MEASURE","VERIFY","LEARN","OPTIMIZE","REOBSERVE"]);
export function runCortexBrainCycle({task={},events=[],observations=[],nodes=[],capabilities=[],outcomes=[],connectors=[],hypotheses=[]}={}){
 const env=protocolEnvelope({type:"TASK",payload:task,source:"acorn-cortex"});
 const protocol=negotiateProtocol({local:{schemas:["TASK","STATE","EVENT","CAPABILITY","EVIDENCE","MEASUREMENT"],versions:["1"]},remote:{schemas:["TASK","STATE","EVENT","CAPABILITY","EVIDENCE","MEASUREMENT"],versions:["1"]}});
 const context=buildSystemContext({events,observations,nodes});
 const space=applyInterference({space:updateBeliefs({space:createStateSpace({hypotheses,context,task}),likelihoods:{},evidence:[]}),relations:[]});
 const computation=collapseStateSpace?collapseStateSpace({space,requireMeasured:false}):space;
 const capabilityMesh=buildCapabilityMesh({capabilities,context,outcomes});
 const event=createSemanticEvent({type:"CONTEXT",payload:{context,computation_state_count:computation.states?.length||0},source:"acorn-cortex",correlation_id:env.event_id});
 const appended=appendEvent({log:events,event});
 const evidence=collectRuntimeEvidence({runs:[],connectors,capabilities,outcomes});
 const constitution={protocol:assertProtocolConstitution({}),capability:assertCapabilityMeshConstitution(capabilityMesh),convergence:assertConstitution({})};
 const gaps=[];
 if(!protocol.compatible)gaps.push("PROTOCOL_COMPATIBILITY");
 if(context.contradictions?.length)gaps.push("CONTEXT_CONTRADICTIONS");
 if(!capabilityMesh.routes?.length)gaps.push("NO_LIVE_CAPABILITY_ROUTE");
 if(evidence.state!=="RUNTIME_EVIDENCE_PRESENT")gaps.push("RUNTIME_EVIDENCE");
 return {contract:CONTRACT,cycle:CYCLE,state:gaps.length?"GAPS_MEASURED":"CONVERGENCE_CANDIDATE",task,protocol,context,computation,capabilityMesh,evidence,event_spine:summarizeEventSpine({log:appended.log}),gaps,constitution,authority:false,auto_authorize:false,auto_execute:false,live:false,external_effect:false};
}
export function assertCortexBrainConvergence(x={}){const v=[];if(x.authority===true)v.push("AUTHORITY_ESCALATION");if(x.auto_authorize===true)v.push("AUTO_AUTHORIZATION");if(x.auto_execute===true)v.push("AUTO_EXECUTION");if(x.breaker_bypass===true)v.push("BREAKER_BYPASS");if(x.fake_live===true)v.push("FAKE_LIVE");return {contract:CONTRACT,valid:!v.length,violations:v};}
