// Store one canonical +7 number; accept common local formatting, not links or text.
export function normalizeContactPhone(value:string):string|null{
  const input=value.trim();
  if(!input)return '';
  if(input.length>40||!/^[+\d\s()-]+$/.test(input))return null;
  const compact=input.replace(/[\s()-]/g,'');
  if(/^\+7\d{10}$/.test(compact))return compact;
  if(/^[78]\d{10}$/.test(compact))return '+7'+compact.slice(1);
  if(/^\d{10}$/.test(compact))return '+7'+compact;
  return null;
}
export function callHref(value:string){
  const phone=normalizeContactPhone(value);return phone?`tel:${phone}`:null;
}
export function whatsappHref(value:string){
  const phone=normalizeContactPhone(value);return phone?`https://wa.me/${phone.slice(1)}`:null;
}
