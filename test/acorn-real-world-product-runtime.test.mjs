import test from "node:test";import assert from "node:assert/strict";
import {defineProductRuntime,buildDeliveryPlan} from "../scripts/acorn-real-world-product-runtime.mjs";
import {measureCustomerValue} from "../scripts/acorn-customer-value-loop.mjs";
import {runCommercialDelivery} from "../scripts/acorn-commercial-delivery-conductor.mjs";
test("product runtime refuses unverified reality",()=>assert.equal(defineProductRuntime({capabilities:[{verified:false}],connectors:[{state:"LIVE_VERIFIED"}]}).state,"INSUFFICIENT_REALITY_EVIDENCE"));
test("delivery plan keeps human gate",()=>assert.equal(buildDeliveryPlan({}).human_authorization_required,true));
test("customer value requires measured verified outcomes",()=>assert.equal(measureCustomerValue({outcomes:[{dimension:"CUSTOMER_VALUE",verified:false,measured:true}]}).state,"NOT_MEASURED"));
test("commercial conductor composes bounded delivery",()=>{const x=runCommercialDelivery({});assert.equal(x.human_gate,true);assert.equal(x.auto_execute,false)});
