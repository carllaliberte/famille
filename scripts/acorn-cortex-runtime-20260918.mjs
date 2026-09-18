/** ACORN — CORTEX RUNTIME */
export const CONTRACT="acorn.cortex-runtime-20260918.v1";
export function createPlan(input={}){return {contract:CONTRACT,input,state:"PROPOSED",requires_authorization:true,authority:false,breaker_touched:false};}
export function assertConstitution(s={}){if(s.breaker_touched)throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");if(s.authority_transfer)throw new Error("AUTHORITY_TRANSFER_FORBIDDEN");if(s.auto_merge)throw new Error("AUTO_MERGE_FORBIDDEN");return true;}
