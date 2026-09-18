import test from "node:test";
import assert from "node:assert/strict";
import {
  realityCard,
  canExecuteExternal,
  buildRealitySnapshot,
  customerNextAction,
  assertTruthContract,
  turnkeyConstitution,
} from "../scripts/acorn-real-world-turnkey.mjs";

test("one universal reality card keeps capability and authority separate", () => {
  const card = realityCard({
    id: "github",
    provider: "github",
    capability: "read_repository",
    state: "CONNECTED",
    connected: true,
    readable: true,
    measured: true,
  });
  assert.equal(card.connected, true);
  assert.equal(card.authority, false);
  assert.equal(card.live, false);
  assert.equal(card.proof.executed, false);
});

test("external consequential execution stays blocked until both human and execution authorization exist", () => {
  const connector = realityCard({
    id: "stripe",
    provider: "stripe",
    capability: "payment",
    state: "LIVE",
    connected: true,
    executable: true,
    measured: true,
  });
  assert.equal(canExecuteExternal({connector, operation:"MONEY"}).reason, "HUMAN_AUTHORIZATION_REQUIRED");
  assert.equal(canExecuteExternal({
    connector,
    operation:"MONEY",
    human_authorized:true,
    execution_authorized:true,
    paid:true,
    payment_observed:true,
  }).allowed, true);
});

test("payment observed never implies delivery or customer value", () => {
  const snapshot = buildRealitySnapshot({
    customer:{id:"c1",tenant_id:"t1"},
    project:{id:"p1",stage:"PAYMENT_OBSERVED"},
    connectors:[{id:"stripe",provider:"stripe",kind:"payment",state:"CONNECTED",connected:true}],
    commercial:{payment_observed:true,payment_required:true,delivered:false,value_verified:false},
  });
  assert.equal(snapshot.commercial.payment_observed, true);
  assert.equal(snapshot.commercial.delivered, false);
  assert.equal(snapshot.commercial.value_verified, false);
  assert.equal(customerNextAction(snapshot), "VERIFY_DELIVERY");
});

test("no connector means the customer journey explicitly asks for the missing real-world connection", () => {
  const snapshot = buildRealitySnapshot({
    customer:{id:"c1",tenant_id:"t1"},
    project:{id:"p1"},
    connectors:[],
    commercial:{payment_required:false},
  });
  assert.equal(customerNextAction(snapshot), "CONNECT_REQUIRED_EXTERNAL_CAPABILITY");
});

test("truth contract rejects invented live and unauthorized external effects", () => {
  assert.throws(() => assertTruthContract({live:true,verified:false,evidence:[]}), /LIVE_REQUIRES_VERIFIED/);
  assert.throws(() => assertTruthContract({
    live:false,verified:false,evidence:[],
    execution:{external_effect:true,human_authorized:false}
  }), /EXTERNAL_EFFECT_REQUIRES_HUMAN_AUTHORIZATION/);
});

test("constitution is one composition layer, not another brain", () => {
  const c = turnkeyConstitution();
  assert.equal(c.one_orchestrator, true);
  assert.equal(c.capability_is_not_authority, true);
  assert.equal(c.no_auto_merge, true);
  assert.equal(c.no_auto_spend, true);
});
