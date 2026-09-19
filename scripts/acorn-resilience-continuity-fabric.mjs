export const CONTRACT="acorn.resilience-continuity-fabric.v1";
export function createContinuityPlan({criticalPaths=[],dependencies=[],fallbacks=[]}={}){return {criticalPaths,dependencies,fallbacks,state:"PLANNED",authority:false};}
export function assessResilience({services=[],failures=[]}={}){return {services,failures,coverage:services.length?Math.max(0,1-failures.length/services.length):0,measured:true};}
export function recover({plan,failed=[]}={}){return {plan,failed,state:failed.length?"RECOVERY_REQUIRED":"HEALTHY",external_effect:false,authority:false};}
export function learnRecovery({assessment={},verified=false}={}){return {learned:assessment.measured===true&&verified===true,authority:false};}
export function assertResilienceConstitution(){return {authority:false,auto_failover_consequential_effects:false,hidden_learning:false,recovery_is_bounded:true};}
