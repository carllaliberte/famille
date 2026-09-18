import {recover,mapWork} from "./acorn-total-open-work-convergence.mjs";
export function reconstructOpenWork(prs=[]){return recover(prs).map(x=>({...x,mode:"CURRENT_MAIN_RECONSTRUCTION",direct_merge:false}));}
export function classifyOpenWork(pr){return mapWork(pr);}
