import handler from "vinext/server/fetch-handler";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

export default {
  fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    return runWithConnectorBinding(binding, async () => {
      const original=await handler.fetch(request, env, ctx);
      const response=new Response(original.body,original);
      response.headers.set('X-Content-Type-Options','nosniff');
      response.headers.set('Referrer-Policy','strict-origin-when-cross-origin');
      response.headers.set('Permissions-Policy','camera=(), microphone=(), geolocation=()');
      response.headers.set('Strict-Transport-Security','max-age=31536000');
      const nonce=btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))));
      response.headers.set('Content-Security-Policy',`default-src 'self'; script-src 'self' 'nonce-${nonce}'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com https://*.openai.com https://*.chatgpt.site`);
      if(['/cabinet','/api/profile','/crm','/api/crm'].some(path=>new URL(request.url).pathname.startsWith(path)))response.headers.set('Cache-Control','private,no-store');
      if(response.headers.get('Content-Type')?.includes('text/html'))return new HTMLRewriter().on('script',{element(element){element.setAttribute('nonce',nonce);}}).transform(response);
      return response;
    });
  },
};
