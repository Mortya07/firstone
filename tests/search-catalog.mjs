import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {runInNewContext} from 'node:vm';

const require=createRequire(import.meta.url),ts=require('typescript'),cache=new Map();
function source(name){
 if(cache.has(name))return cache.get(name);
 const module={exports:{}};
 const code=ts.transpileModule(readFileSync(new URL(`../lib/${name}.ts`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 runInNewContext(code,{exports:module.exports,module,require:(path)=>{if(path==='./cities')return source('cities');throw new Error('Unexpected module');},Intl});
 cache.set(name,module.exports);return module.exports;
}
const data=source('data'),{cities,cityDirectory,cityAliases,citySearchScore}=source('cities');
assert.equal(cities.length,90);assert.equal(new Set(cities).size,90);assert.equal(new Set(cityDirectory.map(c=>c.code)).size,90);
for(const name of ['Астана','Алматы','Шымкент','Атырау','Караганда','Алатау','Косшы','Конаев','Шар','Форт-Шевченко','Байконыр','Петропавловск'])assert(cities.includes(name),name);
assert(!cities.includes('а.Алтай'));assert(!cities.includes('Город не существует'));
assert(cityAliases.Байконыр.includes('Байконур'));
assert.equal(citySearchScore('Астана','Тараз',['Город республиканского значения']),0);
assert.equal(citySearchScore('Тараз','Тараз',['Жамбылская область']),1);
assert(citySearchScore('Кокшетау','Көкшетау',['Көкшетау'])>0);
assert(citySearchScore('Байконыр','Байконур',cityAliases.Байконыр)>0);
for(const city of cityDirectory)assert(city.name&&city.kazakh&&city.region&&/^\d{9}$/.test(city.code));
assert(data.profileSpecialties.includes('Строительная бригада'));assert(data.profileSpecialties.includes('Ремонтная бригада'));
assert(!data.specialties.includes('Строительная бригада'),'CRM work types remain concrete');
for(const specialty of data.repairSpecialties){assert.equal(data.specialtyScope(specialty),'repair');assert(data.matchesSpecialty(specialty,'Ремонтная бригада'));assert(!data.matchesSpecialty(specialty,'Строительная бригада'));}
for(const specialty of data.constructionSpecialties){assert.equal(data.specialtyScope(specialty),'construction');assert(data.matchesSpecialty(specialty,'Строительная бригада'));assert(!data.matchesSpecialty(specialty,'Ремонтная бригада'));}
assert.equal(data.specialtyScope('Ремонтная бригада'),'repair');assert.equal(data.specialtyScope('Строительная бригада'),'construction');
assert(!data.matchesSpecialty('Строительная бригада','Фундаменты'),'A general profile must not promise an unspecified concrete service');
assert(data.matchesSpecialty('Фундаменты','Любой ремонт'));assert(data.matchesSpecialty('Фундаменты','Фундаменты'));assert(!data.matchesSpecialty('Кровельные работы','Фундаменты'));
assert.equal(data.demoProfiles[0].specialty,'Ремонт под ключ');assert.equal(data.demoProfiles[2].specialty,'Санузлы и плитка');
console.log('City directory (90), aliases, broad specialties, legacy profiles and scope matching: passed.');

if(process.argv[2]){
 const base=new URL(process.argv[2]);if(base.hostname!=='127.0.0.1')throw new Error('Integration tests are loopback-only');
 const run=`catalog-test-${Date.now()}`;
 async function save(city,specialty,index){return fetch(new URL('/api/profile',base),{method:'POST',headers:{'content-type':'application/json',origin:'https://brigadir-kz.alizhansamat087.chatgpt.site','sec-fetch-site':'same-origin','oai-authenticated-user-id':`${run}-${index}`,'oai-authenticated-user-email':'fixture@example.invalid'},body:JSON.stringify({name:`Локальная проверка ${index}`,city,specialty,price:25000,experience:3,team:4,description:'Исключительно локальная проверка сохранения города и специализации.',phone:'+77000000000',projects:[]})});}
 for(const [index,city] of cities.entries()){const response=await save(city,index%2?'Строительная бригада':'Ремонтная бригада',index);assert.equal(response.status,200,`${city}: ${await response.text()}`);}
 for(const [city,specialty] of [['Город не существует','Ремонтная бригада'],['Астана','Несуществующая специализация']]){const response=await save(city,specialty,'invalid');assert.equal(response.status,400);}
 const page=await fetch(base).then(r=>r.text());for(const city of cities)assert(page.includes(city),`Saved city missing: ${city}`);
 console.log('Local API: all 90 cities and both broad specialties accepted; unknown values rejected; saved profiles readable.');
}
