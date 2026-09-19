export const CONTRACT="acorn.value-economic-fabric.v1";
export function measureValue({revenue=0,cost=0,customer_value=0,evidence=[]}={}){return {revenue,cost,margin:revenue-cost,customer_value,evidence,measured:true,verified:false};}
export function compareOffers({offers=[]}={}){return offers.map(o=>({...o,net_value:(o.revenue??0)-(o.cost??0)})).sort((a,b)=>b.net_value-a.net_value);}
export function learnValue({measurement={},verified=false}={}){return {learned:measurement.measured===true&&verified===true,authority:false,spend:false,contract:false};}
export function assertValueConstitution(){return {authority:false,auto_spend:false,auto_contract:false,private_key_custody:false,pricing_must_be_measured:true};}
