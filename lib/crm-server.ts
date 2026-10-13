import {z} from 'zod';
import {database} from './db';
import {getChatGPTUser} from '@/app/chatgpt-auth';
import {HttpError,boundedBody} from './security';
import {plans,stages,type CrmAccess,type CrmData,type CrmClient,type CrmDeal,type CrmTask} from './crm-types';
import {specialties} from './data';

export async function crmAccess(owner:string):Promise<CrmAccess|null>{
  const row=await database().prepare("SELECT plan,active_until FROM crm_subscriptions WHERE owner=? AND status='active' AND active_until>?").bind(owner,Date.now()).first<{plan:string;active_until:number}>();
  const plan=plans.find(p=>p.id===row?.plan);return row&&plan?{plan:plan.id,activeUntil:row.active_until}:null;
}
export async function requireCrm(){
  const user=await getChatGPTUser();if(!user)throw new HttpError(401,'Войдите в аккаунт бригады.');
  const access=await crmAccess(user.userId);if(!access)throw new HttpError(402,'Для рабочих данных CRM нужна активная платная подписка. Пока доступна бесплатная демонстрация.');
  return {user,access};
}
export async function crmData(owner:string):Promise<CrmData>{
  // Query only the caller's owner. Hard bounds align with the largest draft plan.
  const rows=await database().batch([
    database().prepare('SELECT id,name,phone,notes,updated_at AS updatedAt FROM crm_clients WHERE owner=? ORDER BY updated_at DESC LIMIT 1000').bind(owner),
    database().prepare('SELECT id,client_id AS clientId,title,work_type AS workType,stage,budget,address,notes,updated_at AS updatedAt FROM crm_deals WHERE owner=? ORDER BY updated_at DESC LIMIT 1500').bind(owner),
    database().prepare('SELECT id,deal_id AS dealId,title,assignee,due_date AS dueDate,done,updated_at AS updatedAt FROM crm_tasks WHERE owner=? ORDER BY updated_at DESC LIMIT 3000').bind(owner),
  ]);
  return {clients:rows[0].results as CrmClient[],deals:rows[1].results as CrmDeal[],tasks:(rows[2].results as Record<string,unknown>[]).map(r=>({...r,done:Boolean(r.done)})) as CrmTask[]};
}
const client=z.object({name:z.string().trim().min(2).max(80),phone:z.string().regex(/^(\+7\d{10})?$/),notes:z.string().trim().max(1500)}).strict();
const deal=z.object({clientId:z.string().uuid(),title:z.string().trim().min(3).max(120),workType:z.string().refine(v=>specialties.includes(v)),stage:z.enum(stages),budget:z.number().int().min(0).max(1000000000),address:z.string().trim().max(180),notes:z.string().trim().max(2000)}).strict();
const date=z.string().refine(s=>s===''||(/^20\d{2}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s),'Некорректная дата');
const task=z.object({dealId:z.union([z.string().uuid(),z.literal('')]),title:z.string().trim().min(3).max(150),assignee:z.string().trim().max(80),dueDate:date,done:z.boolean()}).strict();
const requestSchema=z.discriminatedUnion('entity',[
  z.object({entity:z.literal('client'),id:z.string().uuid().optional(),data:client}).strict(),
  z.object({entity:z.literal('deal'),id:z.string().uuid().optional(),data:deal}).strict(),
  z.object({entity:z.literal('task'),id:z.string().uuid().optional(),data:task}).strict(),
]);
export async function readCrmBody(request:Request){
  if(!request.headers.get('content-type')?.startsWith('application/json'))throw new HttpError(415,'Ожидается JSON.');
  try{return JSON.parse(new TextDecoder().decode(await boundedBody(request,16000)));}catch(e){if(e instanceof HttpError)throw e;throw new HttpError(400,'Некорректный запрос.');}
}
export async function saveCrmRecord(owner:string,access:CrmAccess,input:unknown){
  const parsed=requestSchema.safeParse(input);if(!parsed.success)throw new HttpError(400,'Проверьте название, телефон +7, даты и параметры записи.');
  const record=parsed.data,id=record.id??crypto.randomUUID(),now=Date.now(),db=database(),limit=plans.find(p=>p.id===access.plan)!;
  // These tables/column lists come solely from server-owned cases, never input.
  let table:string,columns:string,values:unknown[],updates:string,quota:number,relation='',relationValues:unknown[]=[];
  if(record.entity==='client'){table='crm_clients';columns='name,phone,notes';values=[record.data.name,record.data.phone,record.data.notes];updates='name=?,phone=?,notes=?';quota=limit.clients;}
  else if(record.entity==='deal'){
    table='crm_deals';columns='client_id,title,work_type,stage,budget,address,notes';values=[record.data.clientId,record.data.title,record.data.workType,record.data.stage,record.data.budget,record.data.address,record.data.notes];updates='client_id=?,title=?,work_type=?,stage=?,budget=?,address=?,notes=?';quota=limit.deals;
    relation=' AND EXISTS (SELECT 1 FROM crm_clients WHERE id=? AND owner=?)';relationValues=[record.data.clientId,owner];
  }else{
    table='crm_tasks';columns='deal_id,title,assignee,due_date,done';values=[record.data.dealId,record.data.title,record.data.assignee,record.data.dueDate,Number(record.data.done)];updates='deal_id=?,title=?,assignee=?,due_date=?,done=?';quota=limit.tasks;
    if(record.data.dealId){relation=' AND EXISTS (SELECT 1 FROM crm_deals WHERE id=? AND owner=?)';relationValues=[record.data.dealId,owner];}
  }
  // Owner checks, related record ownership and capacity are in the SAME write.
  // No user endpoint can issue or modify crm_subscriptions.
  const entitlement=" AND EXISTS (SELECT 1 FROM crm_subscriptions WHERE owner=? AND status='active' AND active_until>? AND plan=?)";
  const result=record.id
    ?await db.prepare(`UPDATE ${table} SET ${updates},updated_at=? WHERE id=? AND owner=?${relation}${entitlement}`).bind(...values,now,id,owner,...relationValues,owner,now,access.plan).run()
    :await db.prepare(`INSERT INTO ${table} (id,owner,${columns},created_at,updated_at) SELECT ${Array(values.length+4).fill('?').join(',')} WHERE (SELECT COUNT(*) FROM ${table} WHERE owner=?)<?${relation}${entitlement}`).bind(id,owner,...values,now,now,owner,quota,...relationValues,owner,now,access.plan).run();
  if(result.meta.changes!==1)throw new HttpError(record.id?404:409,record.id?'Запись не найдена или недоступна.':'Запись не создана: проверьте доступ, связанного клиента/сделку и лимит тарифа.');
  return {id};
}
