import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';
const require=createRequire(import.meta.url),ts=require('typescript'),module={exports:{}};
runInNewContext(ts.transpileModule(readFileSync(new URL('../lib/contact.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:module.exports,module});
const {normalizeContactPhone,callHref,whatsappHref}=module.exports;
const valid=['+77001234567','+7 (700) 123-45-67','8 (700) 123-45-67','77001234567','7001234567','  +7 700 123 45 67  '];
for(const phone of valid){assert.equal(normalizeContactPhone(phone),'+77001234567');assert.equal(callHref(phone),'tel:+77001234567');assert.equal(whatsappHref(phone),'https://wa.me/77001234567');}
for(const phone of ['+7','123','+17001234567','+87001234567','+7+7001234567','javascript:alert(1)','https://evil.invalid','+77001234567?text=bad','+77001234567ext12','<script>','7'.repeat(41)]){assert.equal(normalizeContactPhone(phone),null);assert.equal(callHref(phone),null);assert.equal(whatsappHref(phone),null);}
assert.equal(normalizeContactPhone('  '),'');assert.equal(callHref(''),null);assert.equal(whatsappHref(''),null);
console.log('Contact normalization, safe tel/WhatsApp URLs and invalid inputs: passed.');

if(process.argv[2]){
 const base=new URL(process.argv[2]);if(base.hostname!=='127.0.0.1')throw new Error('Contact write tests are loopback-only');
 const run='contact-test-'+Date.now(),origin='https://brigadir-kz.alizhansamat087.chatgpt.site',checks=[];
 const payload={name:'Локальный тест контактов',city:'Астана',specialty:'Строительная бригада',price:25000,experience:4,team:5,description:'Исключительно локальный тест двух независимых контактных номеров.',phone:'+77001234567',projects:[]};
 async function save(owner,body,status=200,headers={}){const response=await fetch(new URL('/api/profile',base),{method:'POST',headers:{origin,'sec-fetch-site':'same-origin','content-type':'application/json','oai-authenticated-user-id':owner,'oai-authenticated-user-email':'contact@example.invalid',...headers},body:JSON.stringify(body)});const text=await response.text();assert.equal(response.status,status,text);return JSON.parse(text);}
 async function html(id){const response=await fetch(new URL('/brigady/'+id,base));assert.equal(response.status,200);return response.text();}
 const dualOwner=run+'-dual',dual=await save(dualOwner,{...payload,phone:'8 (700) 123-45-67',whatsapp:'+7 (701) 765-43-21'});let page=await html(dual.id);assert(page.includes('tel:+77001234567'));assert(page.includes('https://wa.me/77017654321'));checks.push('two independent normalized numbers and correct public links');
 const editor=await fetch(new URL('/cabinet',base),{headers:{'oai-authenticated-user-id':dualOwner,'oai-authenticated-user-email':'contact@example.invalid'}}).then(r=>r.text());assert(editor.includes('+77001234567')&&editor.includes('+77017654321'));checks.push('both saved numbers restored in editor');
 await save(dualOwner,{...payload,phone:'+77002223344'});page=await html(dual.id);assert(page.includes('tel:+77002223344'));assert(page.includes('https://wa.me/77017654321'));checks.push('legacy request without WhatsApp preserves existing WhatsApp');
 await save(dualOwner,{...payload,whatsapp:''});page=await html(dual.id);assert(!page.includes('href="https://wa.me/'));checks.push('explicit empty WhatsApp removes chat button');
 const same=await save(run+'-same',{...payload,whatsapp:payload.phone});page=await html(same.id);assert(page.includes('tel:+77001234567')&&page.includes('https://wa.me/77001234567'));checks.push('one number used for both channels');
 const chat=await save(run+'-chat',{...payload,phone:'',whatsapp:'+77017654321'});page=await html(chat.id);assert(!page.includes('href="tel:'));assert(page.includes('https://wa.me/77017654321'));checks.push('WhatsApp-only profile');
 const calls=await save(run+'-calls',payload);page=await html(calls.id);assert(page.includes('tel:+77001234567')&&!page.includes('href="https://wa.me/'));checks.push('calls-only legacy payload');
 for(const [label,body] of [['empty contacts',{phone:'',whatsapp:''}],['invalid WhatsApp',{whatsapp:'javascript:alert(1)'}],['invalid call number',{phone:'<script>alert(1)</script>',whatsapp:'+77017654321'}],['untrusted URL',{whatsapp:'https://evil.invalid'}],['overlong WhatsApp',{whatsapp:'7'.repeat(41)}],['unknown field',{whatsapp:'+77017654321',owner:'someone-else'}]]){await save(run+'-invalid',{...payload,...body},400);checks.push(label+' rejected');}
 await save(run+'-csrf',{...payload,whatsapp:'+77017654321'},403,{origin:'https://evil.invalid'});checks.push('foreign origin rejected');
 await save(run+'-owner-b',{...payload,name:'Другой локальный владелец',whatsapp:'+77005556677'});page=await html(same.id);assert(page.includes('https://wa.me/77001234567'));assert(!page.includes('https://wa.me/77005556677'));checks.push('other account cannot overwrite first account contacts');
 const demo=await html('demo-6');assert(!demo.includes('href="tel:')&&!demo.includes('href="https://wa.me/'));checks.push('demo has no actionable real contacts');
 const legacy=await html('contact-legacy-fixture');assert(legacy.includes('tel:+77000000000')&&!legacy.includes('href="https://wa.me/'));checks.push('pre-migration profile retains phone without assuming WhatsApp');
 console.log(JSON.stringify({passed:checks.length,checks,dual:dual.id,same:same.id,chat:chat.id,calls:calls.id},null,2));
}
