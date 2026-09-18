/** Provider-neutral bridge profiles. These are integration contracts, not proof of live credentials or agreements. */
export const AI_BRIDGE_PROFILES=Object.freeze([
 {provider:"OPENAI",modes:["OPENAI_COMPATIBLE","SDK","MCP"],commercial:"ENTERPRISE_AI_BRIDGE"},
 {provider:"ANTHROPIC",modes:["OPENAI_COMPATIBLE","SDK","MCP"],commercial:"ENTERPRISE_AI_BRIDGE"},
 {provider:"GOOGLE",modes:["OPENAI_COMPATIBLE","SDK","MCP"],commercial:"ENTERPRISE_AI_BRIDGE"},
 {provider:"XAI",modes:["OPENAI_COMPATIBLE","SDK","MCP"],commercial:"ENTERPRISE_AI_BRIDGE"},
 {provider:"DEEPSEEK",modes:["OPENAI_COMPATIBLE","SDK"],commercial:"ENTERPRISE_AI_BRIDGE"},
 {provider:"MISTRAL",modes:["OPENAI_COMPATIBLE","SDK"],commercial:"ENTERPRISE_AI_BRIDGE"},
 {provider:"COHERE",modes:["SDK","HTTP"],commercial:"ENTERPRISE_AI_BRIDGE"},
 {provider:"LOCAL_OR_SELF_HOSTED",modes:["LOCAL","NATIVE","HTTP"],commercial:"SELF_HOSTED_BRIDGE"}
]);
export const COMMERCIAL_TERMS=Object.freeze([
 "CAPABILITY_SCOPE","PRICE_AND_USAGE","CREDITS_AND_COMMITMENTS","SLA","LATENCY_AND_LIMITS",
 "DATA_PROCESSING","RETENTION","TRAINING_USE","SECURITY","PRIVACY","IP_OWNERSHIP",
 "CONFIDENTIALITY","AUDIT","SUBPROCESSORS","INCIDENT_RESPONSE","MODEL_CHANGE_NOTICE",
 "DEPRECATION","PORTABILITY","INTEROPERABILITY","EXIT","LIABILITY","INSURANCE",
 "REVENUE_SHARE","REFERRAL","CO_DEVELOPMENT","TURNKEY_DELIVERY","SUPPORT","RENEWAL",
 "TERMINATION","GOVERNING_LAW","HUMAN_SIGNATURE","NO_AUTHORITY_TRANSFER","NO_LOCK_IN"
]);
export function buildCommercialBridgePlan({provider,capabilities=[],currency="USD",term_months=12,revenue_share=null}={}) {
 if(!provider) throw new Error("PROVIDER_REQUIRED");
 return {contract:"acorn.enterprise-ai-bridge.v1",status:"NEGOTIATION_TEMPLATE",executed:false,provider,capabilities,currency,term_months,revenue_share,terms:[...COMMERCIAL_TERMS],payment_authority:"HUMAN_OR_SERVER_GATED",signature:"HUMAN_REQUIRED",api_required:false,authority_transfer:false,breaker_touched:false};
}
export function validateCommercialBridgePlan(plan={}) {
 if(plan.executed===true&&plan.signature!=="HUMAN_EXECUTED") throw new Error("EXECUTED_REQUIRES_HUMAN_SIGNATURE");
 if(plan.authority_transfer===true) throw new Error("AUTHORITY_TRANSFER_FORBIDDEN");
 if(plan.breaker_touched===true) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 return true;
}