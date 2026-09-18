import { createStripeAdapter } from "./acorn-stripe-adapter.mjs";
import { runtimeSurface, buildMonetizationPlan } from "./acorn-monetization-operating-system.mjs";
const adapter=createStripeAdapter({env:process.env});
console.log(JSON.stringify({contract:"acorn.monetization-smoke.v1",stripe:adapter.truth(),runtime:runtimeSurface(),plan_integrations:buildMonetizationPlan().integrations,live:false,executed:false,paid:false,verified:false},null,2));