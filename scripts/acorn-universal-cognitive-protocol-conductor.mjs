import {protocolEnvelope,negotiateProtocol,routeByProtocol,buildProtocolSnapshot,assertProtocolConstitution} from "./acorn-universal-cognitive-protocol.mjs";
export const CONTRACT="acorn.universal-cognitive-protocol-conductor.v1";
export function runUniversalCognitiveProtocol({messages=[],local={},remote={},adapters=[],required_capability=null}={}){
 const envelopes=messages.map(m=>m.protocol?m:protocolEnvelope(m));
 const negotiation=negotiateProtocol({local,remote});
 const routed=envelopes.map(message=>routeByProtocol({message,adapters,required_capability}));
 const snapshot=buildProtocolSnapshot({messages:envelopes,adapters,negotiations:[negotiation]});
 const constitution=assertProtocolConstitution(snapshot);
 return {contract:CONTRACT,negotiation,envelopes,routed,snapshot,constitution,next_action:routed.some(x=>x.state==="NO_COMPATIBLE_ADAPTER")?"DISCOVER_OR_ADAPT":"CONTINUE",authority:false,auto_authorize:false,auto_execute:false,live:false};
}
