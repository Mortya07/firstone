import {notFound} from 'next/navigation';
import {getProfile} from '@/lib/db';
import {SITE_ORIGIN} from '@/lib/security';
import {Header} from '@/app/marketplace';
import ProfileView from './profile-view';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{id:string}>}){const {id}=await params;const p=await getProfile(id);if(!p)return {title:'Бригада не найдена'};return {title:`${p.name} — ${p.specialty}, ${p.city}`,description:`${p.name}: ${p.specialty.toLowerCase()} в городе ${p.city}. Опыт ${p.experience} лет, стоимость работ от ${p.price} ₸ за м². Посмотрите портфолио.`,alternates:{canonical:`${SITE_ORIGIN}/brigady/${p.id}`},robots:{index:!p.demo,follow:true}};}
export default async function ProfilePage({params}:{params:Promise<{id:string}>}){const {id}=await params;let profile;try{profile=await getProfile(id);}catch{return <><Header/><main className="shell empty"><h1>Профиль временно недоступен</h1><p>Не удалось загрузить данные. Попробуйте позже.</p><a href="/">Вернуться в каталог</a></main></>;}if(!profile)notFound();const schema=profile.demo?null:{'@context':'https://schema.org','@type':'HomeAndConstructionBusiness',name:profile.name,description:profile.description,telephone:profile.phone||undefined,areaServed:profile.city,url:`${SITE_ORIGIN}/brigady/${profile.id}`};return <><Header/>{schema&&<script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,'\\u003c')}}/>}<ProfileView profile={profile}/></>;}
