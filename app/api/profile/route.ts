import {z} from 'zod';
import {cities,profileSpecialties} from '@/lib/data';
import {database,ownedProfile} from '@/lib/db';
import {authorize,boundedBody,failure,HttpError} from '@/lib/security';
const project=z.object({title:z.string().trim().min(3).max(100),area:z.number().int().min(1).max(10000),duration:z.number().int().min(1).max(1000),budget:z.number().int().min(0).max(1000000000),image:z.string().regex(/^\/api\/images\/[0-9a-f-]{36}$/),description:z.string().trim().max(1200)}).strict();
const schema=z.object({name:z.string().trim().min(3).max(80),city:z.string().refine(v=>cities.includes(v)),specialty:z.string().refine(v=>profileSpecialties.includes(v)),price:z.number().int().min(100).max(1000000),experience:z.number().int().min(0).max(60),team:z.number().int().min(1).max(200),description:z.string().trim().min(30).max(2000),phone:z.string().regex(/^\+7\d{10}$/),projects:z.array(project).max(12)}).strict();
export async function POST(request:Request){try{
  const user=await authorize(request,'profile');
  if(!request.headers.get('content-type')?.startsWith('application/json'))throw new HttpError(415,'Ожидается JSON.');
  let payload;try{payload=JSON.parse(new TextDecoder().decode(await boundedBody(request,28000)));}catch(e){if(e instanceof HttpError)throw e;throw new HttpError(400,'Некорректный запрос.');}
  const parsed=schema.safeParse(payload);
  if(!parsed.success)throw new HttpError(400,'Проверьте поля: название, описание, цену, телефон +7 и параметры проектов.');
  const p=parsed.data,projects=JSON.stringify(p.projects);
  // Check ownership/state and save in ONE SQL write. A cleanup claim cannot
  // slip between a read and publication and delete a newly attached photo.
  const result=await database().prepare(`INSERT INTO profiles (id,owner,name,city,specialty,price,experience,team,description,phone,projects,updated_at)
    SELECT ?,?,?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS (
      SELECT 1 FROM json_each(?) j LEFT JOIN images i ON '/api/images/'||i.id=json_extract(j.value,'$.image')
      WHERE i.id IS NULL OR i.owner<>? OR i.state<>'ready')
    ON CONFLICT(owner) DO UPDATE SET name=excluded.name,city=excluded.city,specialty=excluded.specialty,price=excluded.price,
      experience=excluded.experience,team=excluded.team,description=excluded.description,phone=excluded.phone,
      projects=excluded.projects,updated_at=excluded.updated_at`)
    .bind(crypto.randomUUID(),user.userId,p.name,p.city,p.specialty,p.price,p.experience,p.team,p.description,p.phone,projects,Date.now(),projects,user.userId).run();
  if(result.meta.changes!==1)throw new HttpError(403,'Можно публиковать только свои доступные фотографии. Загрузите фото заново, если срок хранения истёк.');
  const saved=await ownedProfile(user.userId);
  return Response.json({id:saved?.id},{headers:{'Cache-Control':'no-store'}});
}catch(error){return failure(error);}}
