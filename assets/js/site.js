(function(){
"use strict";
let e=document.documentElement,t=document.body;

// One controller owns every mobile-navigation open and close path.
const header=document.querySelector('.site-nav');
const menuButton=document.querySelector('.menu-btn');
const navigation=document.querySelector('.nav-links');
const mobileViewport=matchMedia('(max-width:860px)');
let menuSession=null;
const lockProperties=['position','top','left','right','width','overflow'];
const saveProperty=(element,name)=>[element.style.getPropertyValue(name),element.style.getPropertyPriority(name)];
const restoreProperty=(element,name,saved)=>saved[0]?element.style.setProperty(name,saved[0],saved[1]):element.style.removeProperty(name);
function menuFocusTargets(){
  if(!header)return [];
  return [...header.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])')]
    .filter(element=>!element.closest('[hidden],[inert]')&&element.getClientRects().length>0&&getComputedStyle(element).visibility!=='hidden');
}
function closeNavigation(restoreFocus=false){
  if(!menuSession)return;
  const session=menuSession;
  menuSession=null;
  t.classList.remove('nav-open');
  menuButton?.setAttribute('aria-expanded','false');
  menuButton?.setAttribute('aria-label','Open navigation');
  for(const [element,wasInert] of session.background)element.inert=wasInert;
  for(const name of lockProperties)restoreProperty(t,name,session.bodyStyle[name]);
  restoreProperty(e,'overflow',session.rootOverflow);
  // Scroll restoration must be immediate even when the page normally scrolls smoothly.
  const oldBehaviour=saveProperty(e,'scroll-behavior');
  e.style.setProperty('scroll-behavior','auto');
  window.scrollTo({left:session.scrollX,top:session.scrollY,behavior:'instant'});
  restoreProperty(e,'scroll-behavior',oldBehaviour);
  if(restoreFocus&&menuButton?.getClientRects().length)menuButton.focus({preventScroll:true});
}
function openNavigation(){
  if(menuSession||!mobileViewport.matches||!menuButton||!navigation)return;
  menuSession={
    scrollX:window.scrollX,
    scrollY:window.scrollY,
    bodyStyle:Object.fromEntries(lockProperties.map(name=>[name,saveProperty(t,name)])),
    rootOverflow:saveProperty(e,'overflow'),
    background:[...document.querySelectorAll('main,footer')].map(element=>[element,element.inert])
  };
  for(const [element] of menuSession.background)element.inert=true;
  t.style.position='fixed';
  t.style.top=`-${menuSession.scrollY}px`;
  t.style.left='0';t.style.right='0';t.style.width='100%';t.style.overflow='hidden';
  e.style.overflow='hidden';
  t.classList.add('nav-open');
  t.classList.remove('header-away');
  menuButton.setAttribute('aria-expanded','true');
  menuButton.setAttribute('aria-label','Close navigation');
  const firstLink=[...navigation.querySelectorAll('a[href]')].find(element=>element.getClientRects().length>0);
  (firstLink||menuButton).focus({preventScroll:true});
}
menuButton?.addEventListener('click',()=>menuSession?closeNavigation(true):openNavigation());
navigation?.addEventListener('click',event=>{
  if(event.target instanceof Element&&event.target.closest('a[href]'))closeNavigation(false);
});
// The full-height mobile header is the panel; any interaction outside it dismisses it.
document.addEventListener('click',event=>{
  if(menuSession&&event.target instanceof Node&&!header?.contains(event.target))closeNavigation(true);
});
document.addEventListener('keydown',event=>{
  if(!menuSession)return;
  if(event.key==='Escape'){event.preventDefault();closeNavigation(true);return;}
  if(event.key!=='Tab')return;
  const targets=menuFocusTargets();
  if(!targets.length){event.preventDefault();menuButton?.focus();return;}
  const first=targets[0],last=targets[targets.length-1];
  const active=document.activeElement;
  if(!targets.includes(active)||(event.shiftKey&&active===first)||(!event.shiftKey&&active===last)){
    event.preventDefault();(event.shiftKey?last:first).focus({preventScroll:true});
  }
});
document.addEventListener('focusin',event=>{
  if(menuSession&&event.target instanceof Node&&!header?.contains(event.target)){
    (menuFocusTargets()[0]||menuButton)?.focus({preventScroll:true});
  }
});
mobileViewport.addEventListener('change',event=>{if(!event.matches)closeNavigation(false);});
addEventListener('pagehide',()=>closeNavigation(false));

function syncBrandLockups(){
  const dark=e.dataset.theme==='dark';
  document.querySelectorAll('img.brand-lockup').forEach(image=>{
    const candidates=(dark||image.dataset.brandSurface==='dark')?image.dataset.darkSrcset:image.dataset.lightSrcset;
    if(!candidates)return;
    if(image.getAttribute('srcset')!==candidates)image.setAttribute('srcset',candidates);
    const source=candidates.split(',')[0].trim().split(/\s+/)[0];
    if(source&&image.getAttribute('src')!==source)image.setAttribute('src',source);
  });
}
function a(){
  const color=getComputedStyle(e).getPropertyValue('--bg').trim();
  if(color)document.querySelectorAll('meta[name="theme-color"]').forEach(meta=>{meta.content=color;});
  syncBrandLockups();
}

// Stop the homepage chapter strip at the end of its final section.
const chapterStrips=[...document.querySelectorAll('.v4-chapters')].map(strip=>{
  const links=[...strip.querySelectorAll('a[href^="#"]')];
  const last=links[links.length-1];
  const section=last&&document.getElementById(last.getAttribute('href').slice(1));
  return section?{strip,section}:null;
}).filter(Boolean);
if(chapterStrips.length){
  let frame=0;
  const updateChapters=()=>{
    frame=0;
    if(menuSession)return;
    const headerBottom=header?Math.max(0,header.getBoundingClientRect().bottom):0;
    chapterStrips.forEach(({strip,section})=>{
      strip.classList.toggle('chapters-finished',section.getBoundingClientRect().bottom<=headerBottom);
    });
  };
  const queueChapters=()=>{if(!frame)frame=requestAnimationFrame(updateChapters);};
  addEventListener('scroll',queueChapters,{passive:true});
  addEventListener('resize',queueChapters,{passive:true});
  document.addEventListener('toggle',queueChapters,true);
  document.addEventListener('load',queueChapters,true);
  if('ResizeObserver' in window){
    const sizes=new ResizeObserver(queueChapters);
    chapterStrips.forEach(({section})=>sizes.observe(section));
    if(header)sizes.observe(header);
  }
  document.fonts?.ready.then(queueChapters);
  queueChapters();
}
function o(t,n){e.dataset.theme=t,a();try{localStorage.setItem(`endura-theme`,t)}catch{}document.querySelectorAll(`.theme-btn`).forEach(e=>{e.setAttribute(`aria-pressed`,String(t===`dark`)),e.setAttribute(`aria-label`,t===`dark`?`Switch to light theme`:`Switch to dark theme`),e.title=t===`dark`?`Switch to light theme`:`Switch to dark theme`})}let s=e.dataset.theme===`dark`?`dark`:`light`;document.querySelectorAll(`.theme-btn`).forEach(t=>{t.setAttribute(`aria-pressed`,String(e.dataset.theme===`dark`)),t.setAttribute(`aria-label`,e.dataset.theme===`dark`?`Switch to light theme`:`Switch to dark theme`),t.addEventListener(`click`,()=>{s=s===`dark`?`light`:`dark`,o(s,t)})}),a();let c=document.getElementById(`contactForm`);if(c){let e=c.querySelector(`.form-status`),t=c.querySelector(`[type="submit"]`),n=!1,r=null,i=0;addEventListener(`pagehide`,()=>{i++,r?.abort(),r=null}),addEventListener(`pageshow`,a=>{a.persisted&&(i++,r?.abort(),r=null,n=!1,c.removeAttribute(`aria-busy`),t&&(t.disabled=!1),e&&(e.textContent=``))}),c.addEventListener(`submit`,async a=>{if(n){a.preventDefault();return}let o=[...c.elements].find(e=>e.willValidate&&!e.checkValidity());if(o){a.preventDefault(),o.focus(),e&&(e.textContent=`Please complete the highlighted required fields.`);return}if(n=!0,c.setAttribute(`aria-busy`,`true`),!window.fetch){e&&(e.textContent=`Submitting securely…`),t&&(t.disabled=!0);return}a.preventDefault(),e&&(e.textContent=`Submitting securely…`),t&&(t.disabled=!0);let s=!1,l=++i,u=new AbortController;r=u;let d=setTimeout(()=>u.abort(),2e4);try{let e=await fetch(c.action,{signal:u.signal,method:`POST`,body:new FormData(c),headers:{Accept:`application/json`}});if(l!==i)return;if(!e.ok){let t=`The form could not be submitted. Please email jed@enduradecom.com.`;try{let n=await e.json();n?.errors?.length&&(t=n.errors.map(e=>e.message).join(` `))}catch{}throw Error(t)}let t=c.dataset.successUrl||c.querySelector(`[name="_next"]`)?.value||`thanks.html`;window.enduraTrack?.(`contact_submit`),s=!0,window.location.assign(t)}catch(n){if(l!==i)return;s=!1,e&&(e.textContent=(n?.name===`AbortError`?`The request timed out. Your message is still here. Try again or email jed@enduradecom.com.`:n?.message)||`The form could not be submitted. Please email jed@enduradecom.com.`),t&&(t.disabled=!1)}finally{clearTimeout(d),l===i&&(r=null),!s&&l===i&&(n=!1,c.removeAttribute(`aria-busy`),t&&(t.disabled=!1))}})}})();
// Cap photography at the supplied resolution on high-density displays as well.
(() => {
  const syncDensity = () => document.documentElement.style.setProperty('--image-density', String(Math.max(1, window.devicePixelRatio || 1)));
  syncDensity();
  window.addEventListener('resize', syncDensity, {passive:true});
})();
// Compact section strips retain full labels and expose their scrollable extent.
(() => {
  document.querySelectorAll('.scroll-strip').forEach(strip=>{
    const content=strip.querySelector('.strip-content');
    const buttons=[...strip.querySelectorAll('[data-strip-scroll]')];
    if(!content||!buttons.length)return;
    const update=()=>buttons.forEach(button=>{
      button.disabled=Number(button.dataset.stripScroll)<0?content.scrollLeft<=1:content.scrollLeft+content.clientWidth>=content.scrollWidth-1;
    });
    buttons.forEach(button=>button.addEventListener('click',()=>{
      content.scrollBy({left:Number(button.dataset.stripScroll)*Math.max(160,content.clientWidth*.8),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    }));
    content.addEventListener('scroll',update,{passive:true});
    if('ResizeObserver' in window)new ResizeObserver(update).observe(content);
    document.fonts?.ready.then(update);update();
  });
})();
