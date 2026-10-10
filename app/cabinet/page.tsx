import {requireChatGPTUser,chatGPTSignOutPath} from '@/app/chatgpt-auth';
import {ownedProfile} from '@/lib/db';
import {Header} from '@/app/marketplace';
import Editor from './editor';
export const dynamic='force-dynamic';
export const metadata={title:'Профиль вашей бригады',robots:{index:false,follow:false}};
export default async function Cabinet(){const user=await requireChatGPTUser('/cabinet');let profile=null,unavailable=false;try{profile=await ownedProfile(user.userId);}catch{unavailable=true;}return <><Header/><main className="shell cabinet"><div className="breadcrumb"><a href="/">Каталог</a><span>/</span>Личный кабинет</div><div className="cabinet-heading"><div><p className="eyebrow">ДЛЯ БРИГАД И КОМПАНИЙ</p><h1>Расскажите о своей работе.</h1><p>Заполните профиль и добавьте законченные проекты.</p></div><a href={chatGPTSignOutPath('/')} target="_top">Выйти</a></div>{unavailable?<div className="storage-warning">Сейчас не удалось загрузить профиль. Обновите страницу позже: изменения не будут перезаписаны.</div>:<Editor initial={profile}/>}</main></>;}
