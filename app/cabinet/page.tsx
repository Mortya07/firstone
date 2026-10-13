import {requireChatGPTUser,chatGPTSignOutPath} from '@/app/chatgpt-auth';
import {ownedProfile} from '@/lib/db';
import {Header} from '@/app/marketplace';
import Editor from './editor';
export const dynamic='force-dynamic';
export const metadata={title:'Профиль вашей бригады',robots:{index:false,follow:false}};
export default async function Cabinet(){
  const user=await requireChatGPTUser('/cabinet');
  let profile=null,unavailable=false;
  try{profile=await ownedProfile(user.userId);}catch{unavailable=true;}
  return <><Header/><main className="shell cabinet" id="main-content" tabIndex={-1}>
    <div className="breadcrumb"><a href="/#catalog">Каталог бригад</a><span>/</span>Кабинет бригады</div>
    <div className="cabinet-heading"><div><p className="eyebrow">ДЛЯ БРИГАД И РЕМОНТНЫХ КОМПАНИЙ</p><h1>Профиль вашей бригады</h1><p>Заполните данные, добавьте работы и нажмите «Опубликовать профиль» или «Сохранить изменения».</p><a className="cabinet-client-link" href="/#catalog">Ищете исполнителя? Перейти к бригадам →</a></div><a href={chatGPTSignOutPath('/')} target="_top">Выйти</a></div>
    <ol className="cabinet-steps" aria-label="Как разместить бригаду"><li><span>1</span>Данные бригады</li><li><span>2</span>Выполненные работы</li><li><span>3</span>Публикация в каталоге</li></ol>
    <section className="crm-upsell"><div><h2>CRM для ремонтных и строительных бригад</h2><p>Клиенты, сделки и задачи отдельно от публичного профиля. Платная подписка — тарифы скоро.</p></div><a className="button dark" href="/crm">Посмотреть CRM →</a></section>
    {unavailable?<div className="storage-warning">Сейчас не удалось загрузить профиль. Обновите страницу позже: изменения не будут перезаписаны.</div>:<Editor initial={profile}/>}
  </main></>;
}
