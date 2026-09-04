const form=document.getElementById('unsubscribeForm'),status=document.getElementById('unsubscribeStatus');
const token=new URLSearchParams(location.search).get('token');
if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token||'')){form.hidden=true;status.textContent='This unsubscribe link is invalid.';}
form.addEventListener('submit',async event=>{
 event.preventDefault();const button=form.querySelector('button');button.disabled=true;
 try{const sb=getSupabase();if(!sb)throw Error();const {error}=await sb.rpc('portfolio_unsubscribe',{p_token:token});if(error)throw error;form.hidden=true;status.textContent='You’re unsubscribed. Thanks for spending time in my notebook.';}
 catch{status.textContent='Could not unsubscribe. Please try again shortly.';button.disabled=false;}
});
