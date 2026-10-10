import {SITE_ORIGIN} from '@/lib/security';
export default function robots(){return {rules:{userAgent:'*',allow:'/',disallow:['/cabinet','/api/','/signin-with-chatgpt','/signout-with-chatgpt','/brigady/demo-']},sitemap:`${SITE_ORIGIN}/sitemap.xml`};}
