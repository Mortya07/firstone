import Marketplace from './marketplace';
import {getProfiles} from '@/lib/db';
import {demoProfiles} from '@/lib/data';
export const dynamic='force-dynamic';
export default async function Home(){try{return <Marketplace initialProfiles={await getProfiles()}/>;}catch{return <><div className="storage-warning" role="status">Новые профили временно недоступны. Ниже показаны демонстрационные примеры.</div><Marketplace initialProfiles={demoProfiles}/></>;}}
