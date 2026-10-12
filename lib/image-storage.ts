import {bucket,database} from './db';
import {HttpError} from './security';
import {MAX_IMAGE_BYTES} from './image-validation';

export const OWNER_IMAGE_LIMIT=24;
export const OWNER_BYTE_LIMIT=100*1024*1024;
export const SITE_IMAGE_LIMIT=2000;
export const SITE_BYTE_LIMIT=1024*1024*1024;
const DAY=86400000;
const referenced=`EXISTS (SELECT 1 FROM profiles p, json_each(p.projects) j WHERE json_extract(j.value,'$.image') = '/api/images/' || images.id)`;

export async function reserveImage(id:string,owner:string){
  // This conditional INSERT is one serialized D1 write, not a racy read + insert.
  // Pending reservations count against both quotas; legacy sizes count as 5 MB.
  const result=await database().prepare(`INSERT INTO images (id,owner,mime,created_at,bytes,state)
    SELECT ?,?,'image/jpeg',?,?,'pending' WHERE
    (SELECT COUNT(*) FROM images WHERE owner=?) < ? AND
    (SELECT COALESCE(SUM(CASE WHEN bytes=0 THEN ? ELSE bytes END),0) FROM images WHERE owner=?) + ? <= ? AND
    (SELECT COUNT(*) FROM images) < ? AND
    (SELECT COALESCE(SUM(CASE WHEN bytes=0 THEN ? ELSE bytes END),0) FROM images) + ? <= ?`)
    .bind(id,owner,Date.now(),MAX_IMAGE_BYTES,owner,OWNER_IMAGE_LIMIT,MAX_IMAGE_BYTES,owner,MAX_IMAGE_BYTES,OWNER_BYTE_LIMIT,SITE_IMAGE_LIMIT,MAX_IMAGE_BYTES,MAX_IMAGE_BYTES,SITE_BYTE_LIMIT).run();
  if(result.meta.changes!==1)throw new HttpError(429,'Достигнут лимит фотографий или хранилища. Неиспользуемые фото удаляются через 7 дней.');
}

export async function discardReservation(id:string){
  // Keep a tombstone if R2 fails, so a later bounded sweep retries the deletion.
  await database().prepare("UPDATE images SET state='deleting' WHERE id=? AND state='pending'").bind(id).run();
  await bucket().delete(id);
  await database().prepare("DELETE FROM images WHERE id=? AND state='deleting'").bind(id).run();
}

export async function maintainStorage(){
  const db=database(),now=Date.now();
  // Atomic claim makes cleanup and concurrent profile attachment mutually safe.
  // Seven-day grace applies only to unreferenced ready photos; published photos
  // are never selected. Crashed uploads expire after one day. Bounded per request.
  const claimed=await db.prepare(`UPDATE images SET state='deleting' WHERE id IN
    (SELECT id FROM images WHERE state='deleting' OR
      (state='pending' AND created_at<?) OR
      (state='ready' AND created_at<? AND NOT ${referenced})
      ORDER BY created_at LIMIT 20) RETURNING id`).bind(now-DAY,now-7*DAY).all<{id:string}>();
  for(const {id} of claimed.results){try{await bucket().delete(id);await db.prepare("DELETE FROM images WHERE id=? AND state='deleting'").bind(id).run();}catch{console.error('Photo cleanup will retry');}}
}
