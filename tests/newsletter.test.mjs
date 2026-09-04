import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

test('newsletter validates access, escapes content, and skips recorded deliveries', async()=>{
  const source=await readFile(new URL('../supabase/functions/notebook-mail/index.ts',import.meta.url),'utf8');
  const originalFetch=globalThis.fetch,originalDeno=globalThis.Deno;
  globalThis.Deno={serve(){},env:{toObject(){return {};}}};
  try {
    const {sendNewsletter}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
    const event={httpMethod:'POST',headers:{authorization:'Bearer test-session'},body:JSON.stringify({postId:1})};
    const env={SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'test-anon',RESEND_API_KEY:'test-resend',RESEND_FROM_EMAIL:'sender@example.com'};
    assert.equal((await sendNewsletter({...event,httpMethod:'GET'},env)).statusCode,405);
    assert.equal((await sendNewsletter(event,{})).statusCode,503);
    assert.equal((await sendNewsletter({...event,headers:{}},env)).statusCode,401);
    let allowed=false,sent=0,recorded=false;
    globalThis.fetch=async(url,options={})=>{
      if(url.endsWith('/auth/v1/user'))return Response.json({id:'admin'});
      if(url.endsWith('/rpc/is_portfolio_admin'))return Response.json(allowed);
      if(url.includes('/posts?'))return Response.json([{id:1,title:'A weekly recap',slug:'weekly-recap',excerpt:'<img src=x onerror=alert(1)>'}]);
      if(url.includes('/subscribers?'))return Response.json([{id:7,email:'reader@example.com',unsubscribe_token:'00000000-0000-0000-0000-000000000007'}]);
      if(url.includes('newsletter_deliveries')){if(options.method==='POST'){recorded=true;return Response.json([]);}return Response.json(recorded?[{subscriber_id:7}]:[]);}
      if(url==='https://api.resend.com/emails'){
        const payload=JSON.parse(options.body);assert.equal(payload.to.length,1);assert(!payload.html.includes('<img'));assert(payload.html.includes('unsubscribe.html?token='));assert(options.headers['Idempotency-Key']);sent++;return Response.json({id:'email-1'});
      }
      throw Error('Unexpected external call: '+url);
    };
    assert.equal((await sendNewsletter(event,env)).statusCode,403);
    allowed=true;assert.equal((await sendNewsletter(event,env)).statusCode,200);assert.equal(sent,1);
    assert.equal((await sendNewsletter(event,env)).statusCode,200);assert.equal(sent,1);
  } finally {globalThis.fetch=originalFetch;globalThis.Deno=originalDeno;}
});
