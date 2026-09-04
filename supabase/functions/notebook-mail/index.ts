const json=(statusCode,data)=>({statusCode,headers:{'Content-Type':'application/json','Cache-Control':'no-store'},body:JSON.stringify(data)});
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export async function sendNewsletter(event,env){
  if(event.httpMethod!=='POST')return json(405,{error:'Use POST.'});
  let {SUPABASE_URL:url,SUPABASE_ANON_KEY:key,RESEND_API_KEY:mailKey,RESEND_FROM_EMAIL:from}=env;
  if(!url||!key)return json(503,{error:'Supabase function environment is unavailable.'});
  const authorization=event.headers.authorization||event.headers.Authorization||'';
  if(!authorization.startsWith('Bearer '))return json(401,{error:'Sign in first.'});
  const headers={apikey:key,Authorization:authorization,'Content-Type':'application/json'};
  async function db(path,options={}){const r=await fetch(url+'/rest/v1/'+path,{...options,headers:{...headers,...options.headers}});if(!r.ok)throw Error('Database request failed. Check migration and admin permissions.');return r.status===204?null:await r.json();}
  try{
    const auth=await fetch(url+'/auth/v1/user',{headers});if(!auth.ok)return json(401,{error:'Session expired.'});
    if(!await db('rpc/is_portfolio_admin',{method:'POST',body:'{}'}))return json(403,{error:'Admin access required.'});
    if(!mailKey||!from){
      const settings=await db('settings?select=key,value&key=in.(resend_api_key,resend_from_email)');
      mailKey=mailKey||settings.find(x=>x.key==='resend_api_key')?.value;
      from=from||settings.find(x=>x.key==='resend_from_email')?.value;
    }
    if(!mailKey||!from)return json(503,{error:'Add RESEND_API_KEY and RESEND_FROM_EMAIL in Supabase Edge Function secrets.'});
    const body=JSON.parse(event.body||'{}'),postId=Number(body.postId),offset=Number(body.offset||0);
    if(!Number.isSafeInteger(postId)||postId<1||!Number.isSafeInteger(offset)||offset<0)return json(400,{error:'Invalid request.'});
    const posts=await db('posts?select=id,title,slug,excerpt&id=eq.'+postId);if(!posts.length)return json(404,{error:'Post not found.'});
    const post=posts[0],subs=await db('subscribers?select=id,email,unsubscribe_token&unsubscribed=eq.false&order=id.asc&limit=10&offset='+offset);
    let sent=0;
    for(const sub of subs){
      const delivered=await db(`newsletter_deliveries?select=subscriber_id&post_id=eq.${postId}&subscriber_id=eq.${sub.id}`);if(delivered.length)continue;
      const article='https://akshatkothari.page/blog/post.html?slug='+encodeURIComponent(post.slug);
      const unsubscribe='https://akshatkothari.page/unsubscribe.html?token='+encodeURIComponent(sub.unsubscribe_token);
      const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+mailKey,'Content-Type':'application/json','Idempotency-Key':`portfolio-post-${postId}-reader-${sub.id}`},body:JSON.stringify({from,to:[sub.email],subject:post.title,html:`<div style="max-width:580px;margin:auto;font-family:Arial,sans-serif;line-height:1.7;color:#242424"><p>From Akshat’s notebook</p><h1>${esc(post.title)}</h1><p>${esc(post.excerpt)}</p><p><a href="${esc(article)}">Read the full post</a></p><hr><p>You subscribed to updates from Akshat Kothari. <a href="${esc(unsubscribe)}">Unsubscribe</a></p></div>`})});
      if(!response.ok)return json(502,{error:'Email provider could not send this batch. Retry to resume; recorded deliveries are skipped.',sent});
      await db('newsletter_deliveries',{method:'POST',headers:{Prefer:'return=representation,resolution=ignore-duplicates'},body:JSON.stringify({post_id:postId,subscriber_id:sub.id})});sent++;
      await new Promise(resolve=>setTimeout(resolve,600));
    }
    return json(200,{sent,nextOffset:subs.length===10?offset+10:null,message:`${sent} emails sent in this batch. Previously delivered emails were skipped.`});
  }catch{return json(500,{error:'Sending could not complete. Check server configuration and database migration before retrying.'});}
}

const allowedOrigins=new Set(['https://akshatkothari.page','https://www.akshatkothari.page']);
Deno.serve(async request=>{
  const origin=request.headers.get('origin');
  const cors={'Access-Control-Allow-Origin':allowedOrigins.has(origin)?origin:'https://akshatkothari.page','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Vary':'Origin'};
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  if(origin&&!allowedOrigins.has(origin))return new Response('Origin not allowed',{status:403});
  const url=new URL(request.url),event={httpMethod:request.method,headers:Object.fromEntries(request.headers),queryStringParameters:Object.fromEntries(url.searchParams),body:request.method==='POST'?await request.text():''};
  const result=await sendNewsletter(event,Deno.env.toObject());
  return new Response(result.body,{status:result.statusCode,headers:{...cors,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...result.headers}});
});
