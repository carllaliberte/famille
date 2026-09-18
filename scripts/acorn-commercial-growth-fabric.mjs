/** ACORN — COMMERCIAL GROWTH FABRIC
 * Discovery → Offer → Distribution → Marketplace → Company candidate.
 * Human publication/contracting remains mandatory.
 */
const ISO=()=>new Date().toISOString();
const uid=p=>`${p}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
export function discoverOpportunity({problem,market="unknown",payer="unknown",existingSolutions=[],capabilities=[],gaps=[],evidence=[]}={}){
 if(!problem) throw new Error("PROBLEM_REQUIRED");
 return {id:uid("opp"),problem,market,payer,existing_solutions:existingSolutions,capabilities,gaps,evidence,
   state:evidence.length?"EVIDENCE_BACKED":"DISCOVERY",measured_at:ISO()};
}
export function qualifyOpportunity(o,{solvable=false,payable=false,repeatable=false,strategicFit=false}={}){
 return {...o,qualification:{solvable,payable,repeatable,strategic_fit:strategicFit,
   score_components:{solvability:solvable?1:0,payability:payable?1:0,repeatability:repeatable?1:0,fit:strategicFit?1:0}},
   state:solvable&&payable?"QUALIFIED":"UNQUALIFIED",measured_at:ISO()};
}
export function createOfferCandidate({opportunity,solution,deliverables=[],priceBasis=null,currency="CAD",rights=[],support=[],proof=[]}={}){
 if(!opportunity?.id||!solution) throw new Error("OPPORTUNITY_AND_SOLUTION_REQUIRED");
 return {id:uid("offer"),opportunity_id:opportunity.id,solution,deliverables,price_basis:priceBasis,currency,
   usage_rights:rights,support,proof,state:"OFFER_CANDIDATE",human_publish_required:true,created_at:ISO()};
}
export function createDistributionPlan({offer,channels=[],partners=[],whiteLabel=false,api=false,subscription=false}={}){
 return {id:uid("distribution"),offer_id:offer?.id||null,channels,partners,white_label:whiteLabel,api,subscription,
   state:"PLAN_ONLY",human_publish_required:true,created_at:ISO()};
}
export function marketplaceMatch({problem,providers=[],requirements=[],evidence=[]}={}){
 const matches=providers.map(p=>({provider_id:p.id,capabilities:p.capabilities||[],coverage:requirements.filter(r=>(p.capabilities||[]).includes(r)).length,
   evidence_count:(p.evidence||[]).length})).sort((a,b)=>b.coverage-a.coverage);
 return {id:uid("match"),problem,requirements,matches,evidence_required:true,contract_required:true,created_at:ISO()};
}
export function companyCandidate({validatedProblem,assets=[],offer,distribution,unitEconomics=null}={}){
 return {id:uid("company"),problem:validatedProblem,assets,offer,distribution,unit_economics:unitEconomics,
   state:"CANDIDATE",human_decision_required:true,auto_incorporation:false,created_at:ISO()};
}
export function growthSnapshot({opportunities=[],offers=[],distribution=[],companies=[]}={}){
 return {opportunities:opportunities.length,offers:offers.length,distribution_plans:distribution.length,company_candidates:companies.length,
   human_publication_required:true,measured_at:ISO()};
}
