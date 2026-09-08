/** Presentation-only motion. Never imports or mutates the ledger or application state. */
export function resolveMotion(preference='auto',systemReduced=false) {
 if(preference==='off')return 'off';
 if(systemReduced||preference==='reduced')return 'reduced';
 return 'full';
}
export function counterFrame(from,to,progress) {
 const a=Number.isFinite(from)?Math.max(0,from):0;
 const b=Number.isFinite(to)?Math.max(0,to):0;
 const t=Math.max(0,Math.min(1,Number(progress)||0));
 return t===1?b:a+(b-a)*(1-Math.pow(1-t,3));
}
export function createMotionController(getPreference) {
 const doc=document;const media=window.matchMedia?.('(prefers-reduced-motion: reduce)');
 let policy='off';const active=new Set();const counters=new Set();const values=new Map();let observer=null;
 function stop() {
   for(const a of active){try{a.cancel();}catch{}}active.clear();
   for(const c of counters){cancelAnimationFrame(c.frame);c.finish();}counters.clear();
   doc.querySelectorAll('.touch-ripple,.confetti-layer').forEach(el=>el.remove());
 }
 function sync(){policy=resolveMotion(getPreference(),!!media?.matches);doc.documentElement.dataset.motion=policy;if(policy!=='full')stop();return policy;}
 function play(el,frames,options={}) {
   if(policy!=='full'||doc.hidden||!el?.animate)return null;
   const a=el.animate(frames,{duration:260,easing:'cubic-bezier(.2,.8,.2,1)',...options});active.add(a);
   a.finished.then(()=>active.delete(a)).catch(()=>active.delete(a));return a;
 }
 function enter(el,index=0){play(el,[{opacity:.15,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:360,delay:Math.min(index,4)*38});}
 function numbers(root){
   root.querySelectorAll('[data-count-to]').forEach(el=>{
     const key=el.dataset.countKey;const to=Number(el.dataset.countTo);if(!Number.isFinite(to))return;
     const from=values.has(key)?values.get(key):0;values.set(key,to);
     if(from===to||policy!=='full'||doc.hidden)return;
     const finish=()=>{el.textContent=to.toLocaleString('es-AR',{maximumFractionDigits:2});};
     const run={frame:0,finish};counters.add(run);let start;
     function tick(ts){
       if(!el.isConnected||policy!=='full'){finish();counters.delete(run);return;}
       if(start===undefined)start=ts;const t=Math.min(1,(ts-start)/600);
       el.textContent=counterFrame(from,to,t).toLocaleString('es-AR',{maximumFractionDigits:2});
       if(t<1)run.frame=requestAnimationFrame(tick);else{finish();counters.delete(run);}
     }
     run.frame=requestAnimationFrame(tick);
   });
 }
 function updateCarousel(track){
   if(!track)return;const id=track.id;const max=track.scrollWidth-track.clientWidth;
   doc.querySelectorAll('[data-action="carousel-prev"],[data-action="carousel-next"]').forEach(btn=>{if(btn.dataset.id!==id)return;btn.disabled=btn.dataset.action==='carousel-prev'?track.scrollLeft<=2:track.scrollLeft>=max-2;});
 }
 function refresh(root,{transition=false}={}) {
   sync();for(const c of counters){cancelAnimationFrame(c.frame);c.finish();}counters.clear();
   for(const a of active){if(!a.effect?.target?.isConnected){a.cancel();active.delete(a);}}
   observer?.disconnect();observer=null;
   if(transition&&policy==='full'){
     let i=0;root.querySelectorAll('[data-enter],.page-title,.flow-track,.action-panel').forEach(el=>{
       const r=el.getBoundingClientRect();if(r.top<window.innerHeight&&r.bottom>0){enter(el,i++);}
       else if('IntersectionObserver' in window){
         if(!observer)observer=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){enter(e.target);observer.unobserve(e.target);}},{threshold:.12});
         observer.observe(el);
       }
     });
   }
   numbers(root);
   requestAnimationFrame(()=>root.querySelectorAll('[data-carousel]').forEach(updateCarousel));
 }
 function ripple(event) {
   if(policy!=='full'||event.button!==0||doc.hidden)return;
   const button=event.target.closest('.btn,.icon-btn,.offer-save,.category-pill,.category-chip,.nav-item,.bottom-nav a,.choice-card');
   if(!button||button.disabled)return;
   const r=doc.createElement('span');r.className='touch-ripple';r.setAttribute('aria-hidden','true');
   r.style.left=event.clientX+'px';r.style.top=event.clientY+'px';doc.body.append(r);
   const a=play(r,[{opacity:.25,transform:'translate(-50%,-50%) scale(.1)'},{opacity:0,transform:'translate(-50%,-50%) scale(1)'}],{duration:480});
   if(a)a.finished.then(()=>r.remove()).catch(()=>r.remove());else r.remove();
 }
 function celebrate(){
   if(policy!=='full'||doc.hidden)return;
   doc.querySelectorAll('.confetti-layer').forEach(el=>el.remove());const layer=doc.createElement('div');layer.className='confetti-layer';layer.setAttribute('aria-hidden','true');doc.body.append(layer);
   const jobs=[];
   for(let i=0;i<24;i++){
     const p=doc.createElement('i');p.className='confetti-piece piece-'+i%4;p.style.left=(35+(i*17%30))+'%';p.style.top='50%';layer.append(p);
     const x=(i%2===0?-1:1)*(30+i*6);const y=60+(i*19%160);
     const a=play(p,[{opacity:0,transform:'translate(0,0) rotate(0deg)'},{opacity:1,offset:.12},{opacity:0,transform:`translate(${x}px,${y}px) rotate(${(i%2?1:-1)*250}deg)`}],{duration:1000+(i%4)*130,delay:(i%3)*45,easing:'cubic-bezier(.16,.65,.5,1)'});
     if(a)jobs.push(a.finished.catch(()=>{}));
   }
   Promise.all(jobs).then(()=>layer.remove());
 }
 function feedback(type,selector){
   const el=typeof selector==='string'?doc.querySelector(selector):selector;
   if(type==='favorite'||type==='compare')play(el,[{transform:'scale(1)'},{transform:'scale(1.19)',offset:.45},{transform:'scale(1)'}],{duration:380});
   if(type==='message')play(el,[{opacity:.1,transform:'translateY(8px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:250});
   if(type==='error')play(el,[{transform:'translateX(0)'},{transform:'translateX(-3px)'},{transform:'translateX(3px)'},{transform:'translateX(0)'}],{duration:200});
   if(type==='success'){play(el,[{boxShadow:'0 0 0 0 rgba(0,165,150,.28)'},{boxShadow:'0 0 0 15px rgba(0,165,150,0)'}],{duration:750});celebrate();}
 }
 function dialog(el){play(el,[{opacity:.1,transform:'translateY(14px) scale(.992)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:230});}
 function scroll(id,dir){const track=doc.getElementById(id);if(!track)return;track.scrollBy({left:dir*(track.clientWidth*.87),behavior:policy==='full'?'smooth':'instant'});}
 const onScroll=e=>{if(e.target?.matches?.('[data-carousel]'))updateCarousel(e.target);};
 const onKey=e=>{if(e.target?.matches?.('[data-carousel]')&&['ArrowRight','ArrowLeft'].includes(e.key)){e.preventDefault();scroll(e.target.id,e.key==='ArrowRight'?1:-1);}};
 const onVisibility=()=>{if(doc.hidden)stop();};
 doc.addEventListener('pointerdown',ripple,{passive:true});doc.addEventListener('scroll',onScroll,true);doc.addEventListener('keydown',onKey);doc.addEventListener('visibilitychange',onVisibility);media?.addEventListener?.('change',sync);
 sync();
 return {refresh,feedback,dialog,scroll,sync,stop,policy:()=>policy,destroy(){stop();observer?.disconnect();doc.removeEventListener('pointerdown',ripple);doc.removeEventListener('scroll',onScroll,true);doc.removeEventListener('keydown',onKey);doc.removeEventListener('visibilitychange',onVisibility);media?.removeEventListener?.('change',sync);}};
}
