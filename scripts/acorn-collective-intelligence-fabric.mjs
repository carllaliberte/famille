export const CONTRACT="acorn.collective-intelligence-fabric.v1";
export function formCoalition({members=[],capability}={}){return {contract:CONTRACT,members:members.filter(m=>m.capabilities?.includes(capability)),capability,authority:false};}
export function aggregateOpinions({opinions=[]}={}){const n=opinions.length;return {count:n,unique:new Set(opinions.map(o=>o.value)).size,consensus:n>0&&new Set(opinions.map(o=>o.value)).size===1};}
export function requireDissent({opinions=[]}={}){return {dissent: new Set(opinions.map(o=>o.value)).size>1,opinions};}
