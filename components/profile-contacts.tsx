import {Phone,MessageCircle} from 'lucide-react';
import {callHref,whatsappHref} from '@/lib/contact';
import type {Profile} from '@/lib/data';

export default function ProfileContacts({profile}:{profile:Profile}){
 if(profile.demo)return <div className="demo-contact">Контакты скрыты: это пример профиля.</div>;
 const call=callHref(profile.phone),whatsapp=whatsappHref(profile.whatsapp??'');
 if(!call&&!whatsapp)return <div className="demo-contact">Бригада пока не указала контакты.</div>;
 return <><div className="profile-contact-methods">{whatsapp&&<div className="contact-method"><a className="button whatsapp-contact" href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={18} aria-hidden="true"/>Написать в WhatsApp</a><span className="contact-number"><small>WhatsApp</small>{profile.whatsapp}</span></div>}{call&&<div className="contact-method"><a className="button orange" href={call}><Phone size={17} aria-hidden="true"/>Позвонить бригаде</a><span className="contact-number"><small>Для звонков</small>{profile.phone}</span></div>}</div>{whatsapp&&<p className="contact-open-note">Откроется WhatsApp. Сообщение отправляете вы — сайт ничего не отправляет автоматически.</p>}</>;
}
