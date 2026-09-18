#!/usr/bin/env node
/**
 * ACORN VISIONARY QUALITY CONSTITUTION
 * Benchmark major documented builder principles without ranking people.
 */
export const VISIONARY_QUALITY_VERSION = "acorn.visionary-quality.v1";
export const VISIONARY_BENCHMARKS = Object.freeze([
  {id:"steve_jobs",reference:"Apple / Steve Jobs",dimensions:["product_craft","simplicity","human_experience","end_to_end_integration"],principle:"Simple, coherent, useful and deeply crafted products.",acorn_application:["customer_experience","quality_trace","interface_coherence","end_to_end_delivery"]},
  {id:"jeff_bezos",reference:"Amazon / Jeff Bezos",dimensions:["customer_obsession","long_term","invention","operational_excellence","platform_leverage"],principle:"Work backwards from customer value, think long term, invent and measure.",acorn_application:["customer_value","long_horizon","measurement","project_factory","platform_economics"]},
  {id:"elon_musk",reference:"SpaceX / Tesla / Elon Musk",dimensions:["first_principles","physical_execution","vertical_integration","iteration","ambitious_scope"],principle:"Question assumptions, reduce problems to fundamentals and iterate against reality.",acorn_application:["first_principles_audit","real_world_bridge","simulation_vs_execution","failure_learning","physical_capabilities"]},
  {id:"jensen_huang",reference:"NVIDIA / Jensen Huang",dimensions:["full_stack","platform_ecosystem","accelerated_computing","developer_enablement","long_horizon"],principle:"Build platforms whose hardware, software, tools, developers and ecosystem compound.",acorn_application:["capability_fabric","connector_fabric","developer_gateway","compute_fabric","ecosystem_federation"]},
  {id:"bill_gates",reference:"Microsoft / Bill Gates",dimensions:["software_platform","distribution","developer_ecosystem","standards","scalable_utilities"],principle:"Turn software into reusable platforms with distribution, standards and developer leverage.",acorn_application:["open_capability_contracts","developer_gateway","federation","interoperability","reusable_assets"]},
  {id:"satya_nadella",reference:"Microsoft / Satya Nadella",dimensions:["learning","cloud_platform","partnerships","culture","adaptability"],principle:"Learn continuously, use platforms and partnerships, and adapt.",acorn_application:["learning_fabric","provider_neutrality","adaptive_routing","federation","continuous_improvement"]},
  {id:"page_brin",reference:"Google / Larry Page & Sergey Brin",dimensions:["moonshots","information_infrastructure","scale","experimentation","algorithmic_leverage"],principle:"Build broad infrastructure, experiment and scale successful primitives.",acorn_application:["universal_graph","experiment_fabric","capability_discovery","semantic_routing","scale"]},
  {id:"mark_zuckerberg",reference:"Meta / Mark Zuckerberg",dimensions:["network_effects","social_graph","global_scale","developer_platform","identity"],principle:"Create compounding networks through identity, participation and reusable platform primitives.",acorn_application:["federation","identity","network_value","capability_market","ecosystem_effects"]}
]);
export const REQUIRED_QUALITY_DIMENSIONS = Object.freeze([
  "customer_value","human_experience","product_craft","simplicity","first_principles",
  "real_world_execution","platform_leverage","ecosystem","interoperability",
  "developer_enablement","learning","experimentation","operational_excellence",
  "security","resilience","evidence","provenance","long_term_durability",
  "economic_durability","human_authority"
]);
export const ACORN_GAPS_TO_ELIMINATE = Object.freeze([
  {id:"universal_quality_gate",gap:"Quality must be enforced continuously, not merely documented.",implementation:"Evaluate the quality constitution before release and remeasure after material change."},
  {id:"customer_outcome_proof",gap:"Technical correctness does not prove customer value.",implementation:"Separate technical verification from customer outcome validation with dated evidence."},
  {id:"end_to_end_experience",gap:"A powerful backend can still fail through customer friction.",implementation:"Measure clarity, simplicity, accessibility, recovery, explainability and time-to-value."},
  {id:"real_world_reality",gap:"Simulation and code cannot substitute for observed external reality.",implementation:"Require explicit EXECUTED/OBSERVED/MEASURED evidence for real-world completion."},
  {id:"long_term_decay",gap:"Quality can decay after release.",implementation:"Expire evidence, detect drift and remeasure after material changes."},
  {id:"economic_quality",gap:"Technical excellence can still be economically unsustainable.",implementation:"Measure cost, value, margin, repeatability and support burden without inventing financial facts."},
  {id:"ecosystem_quality",gap:"Platform quality depends on interoperability and replaceability.",implementation:"Test provider neutrality, portability, adapters and graceful degradation."},
  {id:"failure_quality",gap:"Exceptional systems are defined partly by how they fail.",implementation:"Test degraded providers, stale evidence, partial execution, retry, substitution and HUMAN_HOLD."},
  {id:"adversarial_quality",gap:"Happy-path tests are insufficient for long-term credibility.",implementation:"Add adversarial, security, authority-boundary, provenance-tampering and truth-claim tests."},
  {id:"quality_trace_everywhere",gap:"The quality mark must actually propagate to every Acorn-engineered artifact.",implementation:"Wire the trace into project, transformation, productization, delivery and maintenance factories."}
]);
export function createQualityAudit({evidence={},material_change=false,generated_at=new Date().toISOString(),valid_until=null}={}) {
  const dimensions=Object.fromEntries(REQUIRED_QUALITY_DIMENSIONS.map(d=>[d,evidence[d]===true]));
  const missing=REQUIRED_QUALITY_DIMENSIONS.filter(d=>!dimensions[d]);
  return Object.freeze({version:VISIONARY_QUALITY_VERSION,generated_at,valid_until,material_change,benchmarks:VISIONARY_BENCHMARKS.map(b=>b.id),dimensions,missing,quality_assured:missing.length===0&&valid_until!==null,rule:"QUALITY_ASSURED_REQUIRES_ALL_DIMENSIONS_AND_EXPIRY",truth:"CODE_PRESENT != TESTED != EXECUTED != MEASURED != VERIFIED != LIVE",authority:"human",auto_merge:false});
}
export function assertQualityAudit(audit={}) {
  if(audit.quality_assured===true&&audit.missing?.length) throw new Error("QUALITY_AUDIT_FALSE_ASSURANCE");
  if(audit.quality_assured===true&&!audit.valid_until) throw new Error("QUALITY_AUDIT_EXPIRY_REQUIRED");
  if(audit.auto_merge===true) throw new Error("QUALITY_AUDIT_CANNOT_GRANT_MERGE");
  if(audit.authority!=="human") throw new Error("QUALITY_AUDIT_AUTHORITY_MISMATCH");
  return true;
}
export function qualityVerdict(audit={}) {
  assertQualityAudit(audit);
  return audit.quality_assured ? "ACORN QUALITY ASSURED · ALL BENCHMARK DIMENSIONS MEASURED · EVIDENCE DATED" : "ACORN QUALITY REVIEW · EVIDENCE INCOMPLETE · NO ASSURANCE CLAIM";
}
