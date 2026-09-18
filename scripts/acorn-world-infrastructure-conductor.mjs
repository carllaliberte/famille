import {buildWorldPortfolio,createWorldNode,recoveryDecision,assertWorldConstitution} from "./acorn-universal-world-infrastructure-os.mjs";
export function conductWorldInfrastructure(input={}){return buildWorldPortfolio(input);}
export function observeWorldInfrastructure(nodes=[]){return{count:nodes.length,nodes:nodes.map(createWorldNode),unknown:nodes.filter(n=>n?.state==="UNKNOWN").map(n=>n.id||null)};}
export function recoverWorldInfrastructure(node={}){return recoveryDecision(node);}
export function assertConductor(){return assertWorldConstitution();}
