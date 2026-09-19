/** ACORN — CORTEX ADAPTIVE CAPABILITY COMPOSITION */
import { routeByCapability, selectRoute } from "./acorn-cortex-intelligence-adapter.mjs";

export const CONTRACT="acorn.cortex-capability-composition.v1";
const A=v=>Array.isArray(v)?v:[];
const now=()=>new Date().toISOString();

export function composeCapabilityTeam({
  goal,
  required_capabilities=[],
  intelligences=[],
  constraints={},
  min_evidence=0
}={}) {
  if(!goal) throw new Error("GOAL_REQUIRED");
  const routes=A(required_capabilities).map(capability =>
    selectRoute(routeByCapability({capability,intelligences,constraints,required_evidence:min_evidence}))
  );
  const gaps=routes.filter(r=>r.state==="NO_MATCH").map(r=>r.capability);
  const assignments=routes
    .filter(r=>r.selected)
    .map(r=>({capability:r.capability,intelligence:r.selected.identity,provider:r.selected.provider,evidence_count:r.selected.evidence_count}));
  return {
    contract:CONTRACT, goal,
    required_capabilities:A(required_capabilities),
    routes,
    assignments,
    gaps,
    complete:gaps.length===0,
    state:gaps.length===0?"COMPOSABLE":"CAPABILITY_GAP",
    requires_authorization:true,
    authority:false,
    breaker_touched:false,
    external_effect:false,
    created_at:now()
  };
}

export function selectTeam(composition,{strategy="COVERAGE"}={}) {
  if(!composition) throw new Error("COMPOSITION_REQUIRED");
  const assignments=A(composition.assignments);
  const unique=new Map();
  for(const a of assignments) {
    if(!unique.has(a.capability)) unique.set(a.capability,a);
  }
  return {
    ...composition,
    assignments:[...unique.values()],
    selection_strategy:strategy,
    state:composition.complete?"TEAM_SELECTED":"CAPABILITY_GAP",
    requires_authorization:true,
    authority:false,
    breaker_touched:false
  };
}

export function buildCognitivePlan({team,steps=[]}={}) {
  if(!team) throw new Error("TEAM_REQUIRED");
  return {
    contract:"acorn.cortex-cognitive-plan.v1",
    goal:team.goal,
    assignments:team.assignments,
    steps:A(steps),
    state:"PROPOSED",
    requires_authorization:true,
    authority:false,
    auto_execute:false,
    external_effect:false,
    breaker_touched:false,
    created_at:now()
  };
}

export function assertCapabilityCompositionConstitution(snapshot={}) {
  if(snapshot.authority) throw new Error("CAPABILITY_COMPOSITION_CANNOT_GRANT_AUTHORITY");
  if(snapshot.breaker_touched) throw new Error("BREAKER_MUST_REMAIN_UNTOUCHED");
  if(snapshot.auto_authorize) throw new Error("AUTO_AUTHORIZATION_FORBIDDEN");
  if(snapshot.auto_execute) throw new Error("AUTO_EXECUTION_FORBIDDEN");
  if(snapshot.external_effect) throw new Error("COMPOSITION_MUST_NOT_PERFORM_EXTERNAL_EFFECT");
  return true;
}
