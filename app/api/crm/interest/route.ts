import {z} from 'zod';
import {authorize,failure,HttpError} from '@/lib/security';
import {readCrmBody} from '@/lib/crm-server';
import {database} from '@/lib/db';
import {plans} from '@/lib/crm-types';
const schema=z.object({plan:z.string().refine(v=>plans.some(p=>p.id===v))}).strict();
export async function POST(request:Request){try{
  const user=await authorize(request,'crm-interest');const parsed=schema.safeParse(await readCrmBody(request));
  if(!parsed.success)throw new HttpError(400,'Выберите один из тарифов.');
  await database().prepare('INSERT INTO crm_interests(owner,plan,updated_at) VALUES(?,?,?) ON CONFLICT(owner) DO UPDATE SET plan=excluded.plan,updated_at=excluded.updated_at').bind(user.userId,parsed.data.plan,Date.now()).run();
  return Response.json({saved:true,plan:parsed.data.plan},{headers:{'Cache-Control':'private,no-store'}});
}catch(e){return failure(e);}}
