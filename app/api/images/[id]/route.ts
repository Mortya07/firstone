import {bucket,database} from '@/lib/db';
import {getChatGPTUser} from '@/app/chatgpt-auth';

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id))return new Response('Not found',{status:404});
  try{
    const row=await database().prepare(`SELECT owner,EXISTS (SELECT 1 FROM profiles p,json_each(p.projects) j
      WHERE json_extract(j.value,'$.image')='/api/images/'||images.id) AS published
      FROM images WHERE id=? AND state='ready'`).bind(id).first<{owner:string;published:number}>();
    if(!row||(!row.published&&(await getChatGPTUser())?.userId!==row.owner))return new Response('Not found',{status:404,headers:{'Cache-Control':'private,no-store'}});
    const object=await bucket().get(id);
    if(!object)return new Response('Not found',{status:404});
    // Recheck access on every request: a previously published photo can be removed.
    return new Response(object.body,{headers:{'Content-Type':object.httpMetadata?.contentType||'image/jpeg','X-Content-Type-Options':'nosniff','Content-Disposition':'inline','Cache-Control':'private,no-store'}});
  }catch{return new Response('Unavailable',{status:503,headers:{'Cache-Control':'no-store'}});}
}
