import {env} from 'cloudflare:workers';
import {demoProfiles,type Profile} from './data';
export function database():D1Database {if(!env.DB)throw new Error('Database unavailable');return env.DB;}
export function bucket():R2Bucket {if(!env.BUCKET)throw new Error('Storage unavailable');return env.BUCKET;}
export function parseProfile(row:Record<string,unknown>):Profile{return {id:String(row.id),name:String(row.name),city:String(row.city),specialty:String(row.specialty),price:Number(row.price),experience:Number(row.experience),team:Number(row.team),description:String(row.description),phone:String(row.phone),projects:JSON.parse(String(row.projects))};}
export async function getProfiles(){const result=await database().prepare('SELECT id,name,city,specialty,price,experience,team,description,phone,projects FROM profiles ORDER BY updated_at DESC LIMIT 200').all();return [...result.results.map(parseProfile),...demoProfiles];}
export async function getProfile(id:string){const demo=demoProfiles.find(p=>p.id===id);if(demo)return demo;const row=await database().prepare('SELECT id,name,city,specialty,price,experience,team,description,phone,projects FROM profiles WHERE id = ?').bind(id).first();return row?parseProfile(row):null;}
export async function ownedProfile(owner:string){const row=await database().prepare('SELECT id,name,city,specialty,price,experience,team,description,phone,projects FROM profiles WHERE owner = ?').bind(owner).first();return row?parseProfile(row):null;}
