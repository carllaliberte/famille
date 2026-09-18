import test from "node:test";
import assert from "node:assert/strict";
import { customerServiceCycle } from "../scripts/acorn-customer-service.mjs";

test("live runtime preserves human and evidence gates",()=>{
  const r=customerServiceCycle({
    customer:{customer_id:"live-test"},
    request:"Test live customer request",
    capabilities:["general"],
    solution:"Acorn qualification",
    deliverables:["plan"],
    evidence_plan:["test"],
    usage_rights:["CUSTOMER_USE_PENDING_HUMAN_AUTHORIZATION"],
    tasks:["qualify"],
    human_authorized:false
  });
  assert.equal(r.stage,"HOLD_HUMAN_AUTHORIZATION");
  assert.equal(r.live,false);
  assert.equal(r.policy.invented_live,false);
  assert.equal(r.policy.auto_payment_capture,false);
});
