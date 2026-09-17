#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

export function probeGpuRuntime({ allowExec = false } = {}) {
  if (!allowExec) return { present: false, frameworks: [], source: 'not_observed', state: 'UNKNOWN' };
  try {
    const script = "import importlib.util; print('|'.join(m for m in ('torch','cupy') if importlib.util.find_spec(m)))";
    const out = execFileSync('python3', ['-c', script], { encoding: 'utf8', timeout: 2500, stdio: ['ignore','pipe','ignore'] }).trim();
    const frameworks = out ? out.split('|').filter(Boolean) : [];
    return { present: frameworks.length > 0, frameworks, source: 'python-runtime', state: frameworks.length ? 'DISCOVERED' : 'UNKNOWN' };
  } catch { return { present: false, frameworks: [], source: 'python-runtime-absent', state: 'UNKNOWN' }; }
}

export function executeGpuWork({ task = {}, runtimeProbe = {}, allowExec = false } = {}) {
  if (!allowExec) return { status: 'HOLD_HUMAN', reason: 'GPU_EXECUTION_NOT_ENABLED', observed: false, measured: false, proposed: true, live: false };
  const framework = runtimeProbe.frameworks?.includes('torch') ? 'torch' : runtimeProbe.frameworks?.includes('cupy') ? 'cupy' : null;
  if (!framework) return { status: 'HOLD_HUMAN', reason: 'GPU_RUNTIME_NOT_PRESENT', observed: false, measured: false, proposed: true, live: false };
  const size = Math.max(2, Math.min(Number(task.size) || 32, 256));
  const script = framework === 'torch'
    ? "import torch,time,os; n=int(os.environ['ACORN_GPU_N']); a=torch.ones((n,n),device='cuda'); b=torch.ones((n,n),device='cuda'); t=time.perf_counter(); c=a@b; torch.cuda.synchronize(); print('torch',n,time.perf_counter()-t,float(c[0,0].item()))"
    : "import cupy as cp,time,os; n=int(os.environ['ACORN_GPU_N']); a=cp.ones((n,n)); b=cp.ones((n,n)); t=time.perf_counter(); c=a@b; cp.cuda.Stream.null.synchronize(); print('cupy',n,time.perf_counter()-t,float(c[0,0].get()))";
  try {
    const started = Date.now();
    const out = execFileSync('python3', ['-c', script], { encoding: 'utf8', timeout: Math.max(2000, Number(task.timeout_ms) || 15000), stdio: ['ignore','pipe','pipe'], env: { ...process.env, ACORN_GPU_N: String(size) } }).trim();
    const parts = out.split(/\s+/);
    return { status: 'EXECUTED', observed: true, measured: true, proposed: false, duration_ms: Date.now()-started, framework, size, result: { framework, size, elapsed_seconds: Number(parts[2]) || null, sample: Number(parts[3]) || null, workload: 'bounded_matrix_multiply' }, cost: { estimated_cost: 0, actual_cost: 0, currency: 'USD', billing_unit: 'local_gpu_workload' }, live: false };
  } catch (error) {
    return { status: 'FAILED', reason: 'GPU_WORKLOAD_FAILED', error: String(error?.message || error).slice(0,240), observed: false, measured: false, proposed: false, live: false };
  }
}