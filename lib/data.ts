export type Project={title:string;area:number;duration:number;budget:number;image:string;description:string};
export type Profile={id:string;name:string;city:string;specialty:string;price:number;experience:number;team:number;description:string;phone:string;whatsapp?:string;projects:Project[];demo?:boolean;rating?:number;reviewCount?:number};
export {cities} from './cities';
export const repairSpecialties=['Ремонт под ключ','Косметический ремонт','Капитальный ремонт','Ремонт офисов','Санузлы и плитка'];
export const constructionSpecialties=['Строительство домов','Фундаменты','Кладка стен','Кровельные работы','Фасады и утепление','Каркасное строительство'];
// Keep existing repair positions intact: demo profiles refer to their indices.
export const specialties=[...repairSpecialties,...constructionSpecialties];
export type WorkScope='all'|'repair'|'construction';
export const brigadeSpecialties=['Ремонтная бригада','Строительная бригада'];
export const profileSpecialties=[...brigadeSpecialties,...specialties];
export function specialtyScope(specialty:string):WorkScope{
  if(specialty===brigadeSpecialties[0]||repairSpecialties.includes(specialty))return 'repair';
  if(specialty===brigadeSpecialties[1]||constructionSpecialties.includes(specialty))return 'construction';
  return 'all';
}
export function matchesSpecialty(actual:string,selected:string){
  if(selected==='Любой ремонт')return true;
  if(brigadeSpecialties.includes(selected))return specialtyScope(actual)===specialtyScope(selected);
  return actual===selected;
}
const entries=[['Qala Renovation','Астана',0,35000,8,7,4.9,28,'Светлая квартира для семьи','living',86,75],['Forma Interior','Астана',2,42000,11,9,4.8,41,'Кухня с островом','kitchen',72,90],['Дело мастера','Алматы',4,28000,6,4,4.9,19,'Ванная с отдельной душевой','bathroom',12,24],['Артель','Астана',1,18000,5,5,4.7,16,'Обновление гостиной','living',64,35],['Bau Studio','Алматы',3,32000,9,8,4.8,32,'Кухня в небольшой студии','kitchen',110,60],['Тёплый дом','Шымкент',0,25000,7,6,4.6,12,'Санузел в частном доме','bathroom',9,21]];
export const demoProfiles:Profile[]=entries.map((e,i)=>({id:`demo-${i+1}`,name:String(e[0]),city:String(e[1]),specialty:specialties[Number(e[2])],price:Number(e[3]),experience:Number(e[4]),team:Number(e[5]),rating:Number(e[6]),reviewCount:Number(e[7]),description:'Комплексный ремонт по согласованной смете. Подбираем материалы, планируем этапы и обсуждаем с заказчиком каждую деталь. Это демонстрационный профиль для знакомства с сервисом.',phone:'',demo:true,projects:[{title:String(e[8]),image:`/images/${e[9]}.jpg`,area:Number(e[10]),duration:Number(e[11]),budget:Number(e[10])*Number(e[3]),description:'Пример интерьера для демонстрации портфолио. Фотография не является работой указанной бригады.'}]}));
export const money=(n:number)=>new Intl.NumberFormat('ru-KZ').format(n);
