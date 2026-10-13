import {authorize,failure} from '@/lib/security';
import {requireCrm,crmData,readCrmBody,saveCrmRecord} from '@/lib/crm-server';
export async function GET(){try{const {user,access}=await requireCrm();return Response.json({data:await crmData(user.userId),access},{headers:{'Cache-Control':'private,no-store'}});}catch(e){return failure(e);}}
export async function POST(request:Request){try{await authorize(request,'crm-write');const {user,access}=await requireCrm();return Response.json(await saveCrmRecord(user.userId,access,await readCrmBody(request)),{headers:{'Cache-Control':'private,no-store'}});}catch(e){return failure(e);}}
