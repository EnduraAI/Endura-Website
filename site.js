// Endura site interactions
document.addEventListener('DOMContentLoaded', function () {
  // mark JS active so reveal animations engage (content visible by default otherwise)
  document.documentElement.classList.add('js-ready');

  // mobile nav
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('open'); });
    });
  }

  // scroll reveal
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (r) { io.observe(r); });
    // safety net: ensure nothing stays hidden if observer misfires
    window.addEventListener('load', function () {
      setTimeout(function () {
        reveals.forEach(function (r) { r.classList.add('in'); });
      }, 2500);
    });
  } else {
    reveals.forEach(function (r) { r.classList.add('in'); });
  }

  // dashboard readout is driven by the signature scan in enhance.js
});

/* ===== theme toggle (persisted) ===== */
(function(){
  function setTheme(t){
    if(t==='dark'){ document.documentElement.setAttribute('data-theme','dark'); }
    else { document.documentElement.removeAttribute('data-theme'); }
    try{ localStorage.setItem('endura-theme', t); }catch(e){}
  }
  document.addEventListener('DOMContentLoaded', function(){
    var btn=document.querySelector('.theme-toggle');
    if(!btn) return;
    btn.addEventListener('click', function(){
      var dark=document.documentElement.getAttribute('data-theme')==='dark';
      setTheme(dark ? 'light' : 'dark');
    });
  });
})();
