import crypto from "node:crypto";
const ISO=()=>new Date().toISOString();
const id=()=>`job_${crypto.randomUUID()}`;
export const JOB_STATES=Object.freeze(["QUEUED","RUNNING","SUCCEEDED","FAILED","BLOCKED","CANCELLED"]);
export function createJob({tenantId,kind,payload={},maxAttempts=3}={}){if(!tenantId||!kind)throw new Error("TENANT_AND_KIND_REQUIRED");return{id:id(),tenant_id:tenantId,kind,payload,attempts:0,max_attempts:Math.max(1,maxAttempts),state:"QUEUED",authority:false,created_at:ISO(),updated_at:ISO()}}
export function claimJob(job,{workerId}={}){if(job.state!=="QUEUED")throw new Error("JOB_NOT_QUEUED");if(!workerId)throw new Error("WORKER_ID_REQUIRED");return{...job,state:"RUNNING",worker_id:workerId,attempts:job.attempts+1,updated_at:ISO()}}
export function succeedJob(job,{result={},evidence=[]}={}){if(job.state!=="RUNNING")throw new Error("JOB_NOT_RUNNING");return{...job,state:"SUCCEEDED",result,evidence,updated_at:ISO(),finished_at:ISO()}}
export function failJob(job,{error,retry=true}={}){if(job.state!=="RUNNING")throw new Error("JOB_NOT_RUNNING");const again=retry&&job.attempts<job.max_attempts;return{...job,state:again?"QUEUED":"FAILED",error:String(error||"UNKNOWN_ERROR"),retry_scheduled:again,updated_at:ISO(),finished_at:again?null:ISO()}}
export function blockJob(job,{reason}={}){if(!reason)throw new Error("REASON_REQUIRED");return{...job,state:"BLOCKED",blocked_reason:reason,updated_at:ISO()}}
export function cancelJob(job,{reason="HUMAN_CANCEL"}={}){return{...job,state:"CANCELLED",cancel_reason:reason,updated_at:ISO(),finished_at:ISO()}}
export function queueSnapshot(jobs=[]){return{queued:jobs.filter(j=>j.state==="QUEUED").length,running:jobs.filter(j=>j.state==="RUNNING").length,succeeded:jobs.filter(j=>j.state==="SUCCEEDED").length,failed:jobs.filter(j=>j.state==="FAILED").length,blocked:jobs.filter(j=>j.state==="BLOCKED").length,cancelled:jobs.filter(j=>j.state==="CANCELLED").length,authority:false,measured_at:ISO()}}
