import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {PhotonImage} from '@cf-wasm/photon/node';

// Run ONLY against a local production-build Worker and an isolated local D1/R2.
const base=process.argv[2]??'http://127.0.0.1:5174';
if(new URL(base).hostname!=='127.0.0.1')throw new Error('Security writes must stay on loopback.');
const persist=process.env.AUDIT_PERSIST??'.wrangler/security-audit-20261012';
const origin='https://brigadir-kz.alizhansamat087.chatgpt.site';
const run='storage-audit-'+Date.now();
const results=[];
const headers=owner=>({Origin:origin,'oai-authenticated-user-id':owner,'oai-authenticated-user-email':owner+'@local.test',Connection:'close'});
async function request(label,path,options,expected){await new Promise(r=>setTimeout(r,60));const r=await fetch(base+path,{...options,headers:{Connection:'close',...options.headers}});assert.equal(r.status,expected,label+': '+await r.clone().text());results.push(label);return r;}
const image=new PhotonImage(new Uint8Array(8*8*4).fill(255),8,8);
const jpeg=image.get_bytes_jpeg(85),png=image.get_bytes(),webp=image.get_bytes_webp();image.free();
const upload=(owner,bytes=jpeg,mime='image/jpeg')=>({method:'POST',headers:{...headers(owner),'Content-Type':mime},body:bytes});
const owner=run+'-owner';
const profile={name:'Storage security test',city:'Астана',specialty:'Ремонт под ключ',price:25000,experience:3,team:5,description:'Изолированная проверка безопасности хранения фотографий.',phone:'+77001234567',projects:[]};
const project=url=>({title:'Local project',area:40,duration:20,budget:500000,image:url,description:'Audit'});
const save=(projects,who=owner)=>({method:'POST',headers:{...headers(who),'Content-Type':'application/json'},body:JSON.stringify({...profile,projects})});
function sql(command){const r=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','execute','DB','--local','--config','dist/server/wrangler.json','--persist-to',persist,'--command',command,'--json'],{encoding:'utf8'});assert.equal(r.status,0,r.stderr+r.stdout);return JSON.parse(r.stdout)[0].results;}
const id=url=>url.split('/').pop();

const jpg=await (await request('valid JPEG','/api/images',upload(owner),200)).json();
await request('draft anonymous denied',jpg.image,{},404);
await request('draft other owner denied',jpg.image,{headers:headers(run+'-other')},404);
await request('draft owner can preview',jpg.image,{headers:headers(owner)},200);
const pub=await (await request('publish image','/api/profile',save([project(jpg.image)]),200)).json();
await request('published image visible',jpg.image,{},200);
for(const [mime,bytes] of [['image/png',png],['image/webp',webp]]){
 const out=await (await request('valid '+mime,'/api/images',upload(owner,bytes,mime),200)).json();
 const r=await request('normalized '+mime,out.image,{headers:headers(owner)},200);assert.equal(r.headers.get('content-type'),'image/jpeg');
}
await request('foreign attachment blocked','/api/profile',save([project(jpg.image)],run+'-other'),403);
await request('magic-only JPEG blocked','/api/images',upload(owner,new Uint8Array([255,216,255,60,115,99,114,105,112,116,62])),415);
await request('appended payload blocked','/api/images',upload(owner,Buffer.concat([jpeg,Buffer.from('<script>alert(1)</script>')])),415);
await request('MIME mismatch blocked','/api/images',upload(owner,png),415);
const damagedPng=Buffer.concat([png.subarray(0,33),png.subarray(png.length-12)]);
await request('full decoder rejects missing pixels','/api/images',upload(owner,damagedPng,'image/png'),415);
await request('decoder still usable after bad input','/api/images',upload(owner),200);
const bomb=Uint8Array.from(png);new DataView(bomb.buffer).setUint32(16,100000);
await request('pixel bomb rejected before decode','/api/images',upload(owner,bomb,'image/png'),413);
// A valid JPEG with a comment is re-encoded, not copied.
const marker=Buffer.from('AUDIT_PRIVATE_METADATA');
const comment=Buffer.concat([Buffer.from([255,254,0,marker.length+2]),marker]);
const metadataJpeg=Buffer.concat([jpeg.subarray(0,2),comment,jpeg.subarray(2)]);
const stripped=await (await request('metadata image accepted','/api/images',upload(owner,metadataJpeg),200)).json();
assert.ok(!Buffer.from(await (await fetch(base+stripped.image,{headers:headers(owner)})).arrayBuffer()).includes(marker));results.push('metadata stripped');

const old=await (await request('unused fixture','/api/images',upload(owner),200)).json();
sql(`UPDATE images SET created_at=${Date.now()-8*86400000} WHERE id IN ('${id(old.image)}','${id(jpg.image)}')`);
await request('cleanup trigger','/api/images',upload(owner),200);
await request('old unused removed',old.image,{headers:headers(owner)},404);
await request('old published retained',jpg.image,{},200);
await request('expired attachment rejected','/api/profile',save([project(old.image)]),403);
assert.ok((await (await fetch(base+'/brigady/'+pub.id)).text()).includes(jpg.image));results.push('failed save preserves published profile');
// Clear the draft access immediately when its only publication is removed.
await request('unpublish image','/api/profile',save([]),200);
await request('unpublished anonymous denied',jpg.image,{},404);

const quotaOwner=run+'-quota';
try{
 sql(`WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<23) INSERT INTO images(id,owner,mime,created_at,bytes,state) SELECT '${run}-q-'||x,'${quotaOwner}','image/jpeg',${Date.now()},1,'pending' FROM n`);
 const statuses=await Promise.all([1,2,3].map(async()=>{const r=await fetch(base+'/api/images',upload(quotaOwner));await r.text();return r.status;}));assert.deepEqual(statuses.sort(),[200,429,429]);results.push('parallel count quota enforced');
 sql(`UPDATE images SET bytes=104857600 WHERE id='${run}-q-1'`);
 await request('owner byte quota','/api/images',upload(quotaOwner),429);
 sql(`DELETE FROM images WHERE id LIKE '${run}-q-%' AND owner='${quotaOwner}'`);
 sql(`INSERT INTO images(id,owner,mime,created_at,bytes,state) VALUES('${run}-site-bytes','${run}-fixture','image/jpeg',${Date.now()},1073741824,'pending')`);
 await request('site byte quota','/api/images',upload(run+'-fresh'),429);
 sql(`DELETE FROM images WHERE id='${run}-site-bytes' AND owner='${run}-fixture'`);
 sql(`WITH RECURSIVE n(x) AS (SELECT 1 UNION ALL SELECT x+1 FROM n WHERE x<2000) INSERT INTO images(id,owner,mime,created_at,bytes,state) SELECT '${run}-site-count-'||x,'${run}-fixture','image/jpeg',${Date.now()},1,'pending' FROM n`);
 await request('site count quota','/api/images',upload(run+'-fresh'),429);
}finally{sql(`DELETE FROM images WHERE owner='${run}-fixture' OR (owner='${quotaOwner}' AND id LIKE '${run}-q-%')`);}
const hour=Math.floor(Date.now()/3600000),legacy='upload:'+run+':colon:'+hour;
sql(`INSERT INTO rate_limits(id,count,expires_at) VALUES('${run}-expired',1,1),('${legacy}',7,0)`);
await request('prune counter trigger','/api/profile',save([]),200);
assert.equal(sql(`SELECT count FROM rate_limits WHERE id='${run}-expired'`).length,0);
assert.equal(sql(`SELECT count FROM rate_limits WHERE id='${legacy}'`)[0].count,7);results.push('TTL prunes stale but preserves active legacy counter');
console.log(JSON.stringify({passed:results.length,results},null,2));
