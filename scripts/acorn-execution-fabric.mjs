/**
 * ACORN — REAL-WORLD EXECUTION FABRIC
 * Turns an authorized enterprise plan into a measured, resumable task graph.
 * Capability never grants authority; execution is bounded by explicit policy.
 */
const ISO=()=>new Date().toISOString();
const uid=p=>`${p}_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;

export const TASK_STATES=Object.freeze(["PLANNED","READY","RUNNING","BLOCKED","SUCCEEDED","FAILED","CANCELLED"]);
export const EXECUTION_POLICIES=Object.freeze({
  HUMAN_AUTHORIZATION_REQUIRED:true,
  AUTO_CONTRACT:false, AUTO_SPEND:false, AUTO_TRANSFER:false, AUTO_CUSTODY:false,
  AUTO_SIGN:false, AUTO_PUBLISH:false, AUTO_OUTREACH:false, AUTO_MERGE:false
});

export function createTask({id=uid("task"),projectId,kind,title,requiredCapabilities=[],dependsOn=[],effect="NONE",input={},retryLimit=2}={}){
  if(!projectId||!kind||!title) throw new Error("PROJECT_KIND_TITLE_REQUIRED");
  return {id,project_id:projectId,kind,title,required_capabilities:[...new Set(requiredCapabilities)],
    depends_on:[...new Set(dependsOn)],effect,state:"PLANNED",attempts:0,retry_limit:retryLimit,
    input,output:null,error:null,created_at:ISO(),updated_at:ISO()};
}
export function taskGraph(tasks=[]){
  const ids=new Set(tasks.map(t=>t.id));
  for(const t of tasks) for(const d of t.depends_on) if(!ids.has(d)) throw new Error(`UNKNOWN_TASK_DEPENDENCY:${d}`);
  const state=new Map(tasks.map(t=>[t.id,t]));
  const keep=new Set(["SUCCEEDED","FAILED","CANCELLED","BLOCKED","RUNNING"]);
  return tasks.map(t=>{
    if(keep.has(t.state)) return t;
    return {...t,state: t.depends_on.every(d=>state.get(d)?.state==="SUCCEEDED") ? "READY" : "PLANNED"};
  });
}
export function nextRunnableTasks(tasks=[]){
  return taskGraph(tasks).filter(t=>t.state==="READY");
}
export function startTask(task,{authorized=false}={}){
  if(!authorized) return {...task,state:"BLOCKED",error:"HUMAN_AUTHORIZATION_REQUIRED",updated_at:ISO()};
  const independent=task.state==="PLANNED" && (task.depends_on||[]).length===0;
  if(task.state!=="READY" && !independent) return task;
  return {...task,state:"RUNNING",attempts:task.attempts+1,error:null,updated_at:ISO()};
}
export function completeTask(task,{success,output=null,error=null,evidenceIds=[]}={}){
  if(task.state!=="RUNNING") return {...task,error:"TASK_NOT_RUNNING",updated_at:ISO()};
  return {...task,state:success?"SUCCEEDED":"FAILED",output,evidence_ids:evidenceIds,error:success?null:(error||"TASK_FAILED"),updated_at:ISO()};
}
export function buildExecutionPlan({projectId,tasks=[],authorized=false}={}){
  const normalized=taskGraph(tasks);
  return {id:uid("exec"),project_id:projectId,state:authorized?"READY":"AWAITING_AUTHORIZATION",
    authorized,policy:EXECUTION_POLICIES,tasks:normalized,created_at:ISO(),updated_at:ISO()};
}
export function recordExecutionEvent({executionId,taskId,type,payload={}}){
  return {id:uid("evt"),execution_id:executionId,task_id:taskId,type,payload,measured_at:ISO()};
}
export function executionSnapshot(execution){
  const tasks=execution.tasks||[];
  return {execution_id:execution.id,project_id:execution.project_id,state:execution.state,
    tasks:{total:tasks.length,ready:tasks.filter(t=>t.state==="READY").length,running:tasks.filter(t=>t.state==="RUNNING").length,
      succeeded:tasks.filter(t=>t.state==="SUCCEEDED").length,failed:tasks.filter(t=>t.state==="FAILED").length,
      blocked:tasks.filter(t=>t.state==="BLOCKED").length},
    completion:tasks.length?tasks.filter(t=>t.state==="SUCCEEDED").length/tasks.length:0,
    measured_at:ISO()};
}
export function guardExecutionEffect(effect){
  const key=String(effect||"");
  if(Object.prototype.hasOwnProperty.call(EXECUTION_POLICIES,key) && EXECUTION_POLICIES[key]===false){
    throw new Error(`FORBIDDEN_AUTOMATIC_EFFECT:${key}`);
  }
  return {allowed:false,effect,reason:"HUMAN_AUTHORIZATION_REQUIRED"};
}
export function runSyntheticExecution({projectId,authorized=false}={}){
  const a=createTask({projectId,kind:"ANALYZE",title:"Analyze customer problem",requiredCapabilities:["analysis"]});
  const b=createTask({projectId,kind:"DESIGN",title:"Design solution",requiredCapabilities:["design"],dependsOn:[a.id]});
  const c=createTask({projectId,kind:"VERIFY",title:"Verify deliverables",requiredCapabilities:["verification"],dependsOn:[b.id]});
  let tasks=taskGraph([a,b,c]);
  const events=[];
  for(let i=0;i<tasks.length;i++){
    const idx=tasks.findIndex(t=>t.state==="READY");
    if(idx<0) break;
    tasks[idx]=startTask(tasks[idx],{authorized});
    events.push(recordExecutionEvent({executionId:"synthetic",taskId:tasks[idx].id,type:"TASK_STARTED",payload:{authorized}}));
    if(tasks[idx].state==="RUNNING"){
      tasks[idx]=completeTask(tasks[idx],{success:authorized,output:authorized?{synthetic:true}:null,error:authorized?null:"AUTHORIZATION_REQUIRED",evidenceIds:authorized?["synthetic-test"]:[]});
      events.push(recordExecutionEvent({executionId:"synthetic",taskId:tasks[idx].id,type:"TASK_COMPLETED",payload:{success:authorized}}));
    }
    if(!authorized) break;
    tasks=taskGraph(tasks);
  }
  const execution=buildExecutionPlan({projectId,tasks,authorized});
  execution.id="synthetic";
  return {...execution,events,snapshot:executionSnapshot(execution)};
}
