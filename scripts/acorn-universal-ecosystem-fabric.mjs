export const CONTRACT="acorn.universal-ecosystem-fabric.v1";
export function registerParticipant({kind,id,capabilities=[],evidence=[]}={}){return {contract:CONTRACT,kind,id,capabilities,evidence,qualified:false,authority:false};}
export function qualifyParticipant(p,{verified=false}={}){return {...p,qualified:verified===true&&p.evidence?.length>0,authority:false};}
export function routeParticipant({participants=[],capability}={}){return participants.filter(p=>p.qualified&&p.capabilities.includes(capability)).map(p=>({...p,route:true}));}
export function assertEcosystemConstitution(x={}){if(x.authority===true||x.auto_authorize===true)throw new Error("ECOSYSTEM_CANNOT_AUTHORIZE");return true;}
