export const CONTRACT="acorn.self-model-metacognition.v1";
export function buildSelfModel({capabilities=[],intelligences=[],resources=[],uncertainties=[],errors=[]}={}){return {contract:CONTRACT,capabilities,intelligences,resources,uncertainties,errors,authority:false,live:false};}
export function assessSelf({capabilities=[],requirements=[]}={}){const have=new Set(capabilities);const missing=requirements.filter(x=>!have.has(x));return {capable:missing.length===0,missing,authority:false};}
export function recordLimitation({kind,detail,evidence=[]}={}){return {kind,detail,evidence,known:true,authority:false};}
export function assertSelfConstitution(x={}){if(x.authority===true||x.auto_authorize===true)throw new Error("SELF_MODEL_CANNOT_AUTHORIZE");return true;}
