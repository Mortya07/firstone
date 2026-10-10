import {SITE_ORIGIN} from '@/lib/security';
import {getProfiles} from '@/lib/db';
export const dynamic='force-dynamic';
export default async function sitemap(){const root={url:SITE_ORIGIN,changeFrequency:'weekly' as const,priority:1};try{const profiles=await getProfiles();return [root,...profiles.filter(p=>!p.demo).map(p=>({url:`${SITE_ORIGIN}/brigady/${p.id}`,changeFrequency:'weekly' as const,priority:.8}))];}catch{return [root];}}
