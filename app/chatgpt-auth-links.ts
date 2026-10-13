// Browser-safe sign-in link helper. Server-only identity remains in chatgpt-auth.
export function chatGPTSignInPath(returnTo:string){
 const url=new URL(returnTo,'https://app.local');
 const safe=returnTo.startsWith('/')&&!returnTo.startsWith('//')&&url.origin==='https://app.local'?url.pathname+url.search+url.hash:'/';
 return '/signin-with-chatgpt?return_to='+encodeURIComponent(safe);
}
