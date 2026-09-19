export const CONTRACT="acorn.capability-evolution-fabric.v1";
export function proposeRevision({capability,change,evidence=[]}={}){return {contract:CONTRACT,capability,change,evidence,state:"PROPOSED",authority:false};}
export function qualifyRevision(r,{measured=false,verified=false}={}){return {...r,state:measured&&verified?"QUALIFIED":"PROPOSED",authority:false};}
export function versionCapability({capability,revision}={}){return {...capability,revision,state:"VERSIONED",authority:false};}
export function deprecateCapability(c){return {...c,state:"DEPRECATED",authority:false};}
