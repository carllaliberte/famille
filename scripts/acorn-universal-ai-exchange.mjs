/** ACORN — UNIVERSAL AI EXCHANGE FABRIC
 * Capability-first federation across native, MCP, A2A, HTTP/API, SDK and local substrates.
 * Protocols are adapters; capability, evidence, economics and authority are the stable primitives.
 */
export const CONTRACT="acorn.universal-ai-exchange.v1";
export const ROUTES=Object.freeze(["NATIVE","MCP","A2A","OPENAI_COMPATIBLE","HTTP","SDK","LOCAL","WEB","HUMAN"]);
export const STATES=Object.freeze(["DISCOVERED","QUALIFIED","MEASURED","AVAILABLE","DEGRADED","BLOCKED","EXPIRED"]);
const A=v=>Array.isArray(v)?v:[]; const N=v=>Number.isFinite(Number(v))?Number(v):null;
const now=()=>new Date().toISOString();
export function capabilityOffer({provider,capability,route="NATIVE",price=0,currency="USD",latency_ms=null,reliability=null,terms=[],expires_at=null}={}) {
 if(!provider||!capability) throw new Error("PROVIDER_AND_CAPABILITY_REQUIRED");
 if(!ROUTES.includes(route)) throw new Error("ROUTE_UNSUPPORTED");
 return {id:`offer:${provider}:${capability}:${route}`,provider,capability,route,price:N(price)??0,currency,latency_ms:N(latency_ms),reliability:N(reliability),terms:A(terms),expires_at,state:"DISCOVERED",authority:false,breaker_touched:false};
}
export function qualifyOffer(offer,{now_iso=now(),required_reliability=0,min_evidence=true}={}) {
 const expired=offer.expires_at&&new Date(offer.expires_at).getTime()<=new Date(now_iso).getTime();
 const reliable=offer.reliability===null||offer.reliability>=required_reliability;
 return {...offer,state:expired?"EXPIRED":(!reliable||(!offer.terms?.length&&min_evidence)?"DEGRADED":"QUALIFIED"),qualified_at:now_iso};
}
export function rankOffers(offers,{budget=null,preferRoutes=["NATIVE","MCP","A2A","LOCAL","OPENAI_COMPATIBLE","HTTP","SDK","WEB"],reliability_weight=0.45,cost_weight=0.3,latency_weight=0.15,route_weight=0.1}={}) {
 const active=A(offers).filter(o=>o.state==="QUALIFIED"||o.state==="AVAILABLE");
 const maxCost=Math.max(1,...active.map(o=>o.price||0)); const maxLat=Math.max(1,...active.map(o=>o.latency_ms||0));
 return active.filter(o=>budget===null||o.price<=budget).map(o=>({offer:o,score:(o.reliability??0.5)*reliability_weight+(1-(o.price||0)/maxCost)*cost_weight+(1-(o.latency_ms||0)/maxLat)*latency_weight+(1-Math.max(0,preferRoutes.indexOf(o.route))/Math.max(1,preferRoutes.length))*route_weight})).sort((a,b)=>b.score-a.score);
}
export function buildFailoverPlan(ranked,{max_routes=3}={}) {
 return A(ranked).slice(0,max_routes).map((x,i)=>({rank:i+1,offer_id:x.offer.id,provider:x.offer.provider,route:x.offer.route,score:x.score,authority:false,breaker_touched:false}));
}
export function buildCommercialOrder({customer,offer,quantity=1,success_metric,authorization="HUMAN_REQUIRED"}={}) {
 if(!customer||!offer) throw new Error("CUSTOMER_AND_OFFER_REQUIRED");
 return {contract:"acorn.capability-order.v1",state:"PROPOSED",customer,offer_id:offer.id,quantity,success_metric,price:(offer.price||0)*quantity,currency:offer.currency,authorization,executed:false,payment_observed:false,value_measured:false,authority:false,breaker_touched:false};
}
export function recordMeasurement({offer_id,latency_ms,reliability,success,value=null,observed_at=now()}={}) {
 return {contract:"acorn.capability-measurement.v1",offer_id,latency_ms:N(latency_ms),reliability:N(reliability),success:Boolean(success),value,observed_at,state:"OBSERVED",authority:false,breaker_touched:false};
}
export function evolveOffer(offer,measurement) {
 return {...offer,latency_ms:measurement.latency_ms??offer.latency_ms,reliability:measurement.reliability??offer.reliability,state:measurement.success?"AVAILABLE":"DEGRADED",last_measurement:measurement.observed_at};
}
export function assertExchangeConstitution(snapshot={}) {
 if(snapshot.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
 if(snapshot.api_prerequisite) throw new Error("API_MUST_NOT_BE_COGNITIVE_PREREQUISITE");
 if(snapshot.authority_transfer) throw new Error("AUTHORITY_TRANSFER_FORBIDDEN");
 if(snapshot.payment_observed&&snapshot.executed===false&&snapshot.payment_as_execution===true) throw new Error("PAYMENT_IS_NOT_EXECUTION");
 return true;
}