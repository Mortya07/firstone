import {getChatGPTUser} from '@/app/chatgpt-auth';
import {database} from './db';
export const SITE_ORIGIN='https://brigadir-kz.alizhansamat087.chatgpt.site';
export class HttpError extends Error{constructor(public status:number,message:string){super(message);}}
export async function authorize(request:Request,operation:string){
const origin=request.headers.get('origin');const allowed=origin===SITE_ORIGIN||(import.meta.env.DEV&&(origin==='http://127.0.0.1:5173'||origin==='http://localhost:5173'));
if(!allowed||request.headers.get('sec-fetch-site')==='cross-site')throw new HttpError(403,'Запрос отклонён. Откройте сайт и повторите действие.');
const user=await getChatGPTUser();if(!user)throw new HttpError(401,'Войдите, чтобы продолжить.');
const key=`${operation}:${user.userId}:${Math.floor(Date.now()/3600000)}`;
const row=await database().prepare('INSERT INTO rate_limits (id,count) VALUES (?,1) ON CONFLICT(id) DO UPDATE SET count = count + 1 RETURNING count').bind(key).first<{count:number}>();
if((row?.count??999)>60)throw new HttpError(429,'Слишком много запросов. Попробуйте позже.');return user;
}
export async function boundedBody(request:Request,limit:number){if(Number(request.headers.get('content-length')||0)>limit)throw new HttpError(413,'Файл или запрос слишком большой.');const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Пустой запрос.');let size=0;const chunks:Uint8Array[]=[];while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>limit){await reader.cancel();throw new HttpError(413,'Файл или запрос слишком большой.');}chunks.push(part.value);}const result=new Uint8Array(size);let offset=0;for(const part of chunks){result.set(part,offset);offset+=part.length;}return result;}
export function failure(error:unknown){if(error instanceof HttpError)return Response.json({error:error.message},{status:error.status,headers:{'Cache-Control':'no-store'}});console.error('Brigadir request failed',error instanceof Error?error.message:'unknown');return Response.json({error:'Не удалось сохранить данные. Ваш ввод сохранён в форме. Попробуйте ещё раз.'},{status:503,headers:{'Cache-Control':'no-store'}});}
