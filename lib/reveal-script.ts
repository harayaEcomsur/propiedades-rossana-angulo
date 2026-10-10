// Script inline del <head> para las animaciones de entrada (ver
// components/ui/Reveal.tsx). Corre antes del primer pintado:
//  1. Marca <html class="reveal-ready"> → el CSS deja en estado inicial
//     (transparente y 12px abajo) los bloques [data-reveal].
//  2. Desde ese mismo instante, un MutationObserver detecta cada bloque a
//     medida que el navegador lo lee y lo entrega a un IntersectionObserver,
//     que le pone data-revealed un poco ANTES de que entre en pantalla
//     (rootMargin +10% abajo) → el CSS lo anima a su lugar. No se espera a
//     DOMContentLoaded: eso exige leer todo el HTML (incluidos los datos de
//     React al final) y en celulares lentos dejaba los bloques visibles al
//     cargar ocultos 1–2 s. También cubre bloques que llegan después
//     (navegación interna).
// Redes de seguridad: si el observador no arranca, se quita reveal-ready; y
// 1 s después de "load" se muestra todo bloque que ya debería verse, por si
// una tarea larga retrasó al observador. Con "reducir movimiento" o sin
// IntersectionObserver no hace nada (contenido visible, sin animación).
export const REVEAL_SCRIPT = `(function(){try{
var d=document.documentElement;
if(!('IntersectionObserver' in window)||!('MutationObserver' in window)||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
d.classList.add('reveal-ready');
function show(el){el.setAttribute('data-revealed','')}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){show(e.target);io.unobserve(e.target)}})},{rootMargin:'0px 0px 10% 0px'});
function watch(root){if(root.matches&&root.matches('[data-reveal]:not([data-revealed])'))io.observe(root);if(root.querySelectorAll)root.querySelectorAll('[data-reveal]:not([data-revealed])').forEach(function(el){io.observe(el)})}
new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.nodeType===1)watch(n)})})}).observe(d,{childList:true,subtree:true});
window.addEventListener('load',function(){setTimeout(function(){var h=window.innerHeight*1.1;document.querySelectorAll('[data-reveal]:not([data-revealed])').forEach(function(el){if(el.getBoundingClientRect().top<h)show(el)})},1000)});
}catch(e){document.documentElement.classList.remove('reveal-ready')}})();`;
