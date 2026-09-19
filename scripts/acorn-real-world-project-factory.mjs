export const CONTRACT="acorn.real-world-project-factory.v1";
export function defineProject({goal,requirements=[],capabilities=[],deliverables=[]}={}){return {goal,requirements,capabilities,deliverables,state:"PLANNED",authority:false};}
export function buildProjectPlan({project,tasks=[]}={}){return {...project,tasks,state:"READY",external_effect:false,requires_authorization:true};}
export function executeProjectStep({plan,step,authorized=false}={}){return {plan,step,state:authorized?"READY":"BLOCKED",human_authorized:authorized,external_effect:false,authority:false};}
export function recordProjectOutcome({result,evidence=[]}={}){return {result,evidence,measured:false,verified:false,authority:false};}
export function assertProjectFactoryConstitution(){return {authority:false,auto_contract:false,auto_spend:false,auto_publish:false,auto_execute:false,human_authorization_required:true};}
