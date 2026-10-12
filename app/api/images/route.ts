import {bucket,database} from '@/lib/db';
import {authorize,boundedBody,failure,HttpError} from '@/lib/security';
import {MAX_IMAGE_BYTES,normalizePhoto} from '@/lib/image-validation';
import {discardReservation,maintainStorage,reserveImage} from '@/lib/image-storage';

export async function POST(request:Request){
  let reservedId:string|undefined;
  try{
    const user=await authorize(request,'upload');
    const bytes=await boundedBody(request,MAX_IMAGE_BYTES);
    await maintainStorage();
    const id=crypto.randomUUID();
    await reserveImage(id,user.userId);reservedId=id;
    const clean=normalizePhoto(bytes,request.headers.get('content-type'));
    await bucket().put(id,clean,{httpMetadata:{contentType:'image/jpeg'}});
    const result=await database().prepare("UPDATE images SET bytes=?,state='ready' WHERE id=? AND owner=? AND state='pending'")
      .bind(clean.length,id,user.userId).run();
    if(result.meta.changes!==1)throw new HttpError(503,'Не удалось сохранить фото. Попробуйте снова.');
    reservedId=undefined;
    return Response.json({image:`/api/images/${id}`},{headers:{'Cache-Control':'no-store'}});
  }catch(error){
    if(reservedId)await discardReservation(reservedId).catch(()=>console.error('Photo rollback will retry'));
    return failure(error);
  }
}
