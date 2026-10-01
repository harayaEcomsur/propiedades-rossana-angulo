// Script inline del <head> para las animaciones de entrada (ver
// components/ui/Reveal.tsx). Corre antes del primer pintado:
//  1. Marca <html class="reveal-ready"> → el CSS deja en estado inicial
//     (transparente y 16px abajo) los bloques [data-reveal].
//  2. Al parsear el HTML, un IntersectionObserver les pone data-revealed al
//     entrar en pantalla → el CSS los anima a su lugar.
//  3. Bloques que llegan después (navegación interna) se observan con un
//     MutationObserver.
// Red de seguridad: si en 2,5 s el observador no arrancó, se quita
// reveal-ready y todo queda visible. Con "reducir movimiento" o sin
// IntersectionObserver no hace nada (contenido visible, sin animación).
export const REVEAL_SCRIPT = `(function(){try{
var d=document.documentElement;
if(!('IntersectionObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
d.classList.add('reveal-ready');
var started=false;
setTimeout(function(){if(!started)d.classList.remove('reveal-ready')},2500);
function run(){
started=true;
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.setAttribute('data-revealed','');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});
function watch(root){if(root.matches&&root.matches('[data-reveal]:not([data-revealed])'))io.observe(root);if(root.querySelectorAll)root.querySelectorAll('[data-reveal]:not([data-revealed])').forEach(function(el){io.observe(el)})}
watch(document);
new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1)watch(n)})})}).observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
}catch(e){document.documentElement.classList.remove('reveal-ready')}})();`;
