import {getChatGPTUser} from '@/app/chatgpt-auth';
import {crmAccess,crmData} from '@/lib/crm-server';
import {database} from '@/lib/db';
import {Header} from '@/app/marketplace';
import CrmLanding from './pricing';
import CrmWorkspace from './workspace';
export const dynamic='force-dynamic';
export const metadata={title:'CRM для строительных и ремонтных бригад',robots:{index:false,follow:false}};
export default async function CrmPage(){
 const user=await getChatGPTUser();
 try{
  const access=user?await crmAccess(user.userId):null;
  if(user&&access)return <><Header/><CrmWorkspace initial={await crmData(user.userId)} access={access}/></>;
  const interest=user?await database().prepare('SELECT plan FROM crm_interests WHERE owner=?').bind(user.userId).first<{plan:string}>():null;
  return <><Header/><CrmLanding signedIn={!!user} selectedPlan={interest?.plan}/></>;
 }catch{return <><Header/><main className="shell empty" id="main-content"><h1>CRM временно недоступна</h1><p>Попробуйте позже. Клиентские данные не будут заменены демонстрационными.</p><a className="button dark" href="/crm/demo">Посмотреть демоверсию</a></main></>;}
}
