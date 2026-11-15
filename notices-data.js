/* Public notices are loaded from the Star Singers Apps Script deployment. */
window.STAR_SINGERS_NOTICES = [];
(function(){
 const API='https://script.google.com/macros/s/AKfycbxPwRrD35fv7UWOJO6EN6eqIxT5czuaIBjbU8qR9xfdFYuod6bB-RrNj6r0hDuma6Qk6Q/exec';
 if(API.includes('PASTE_'))return;
 const frame=document.createElement('iframe');frame.hidden=true;frame.src=API+'?action=notices&v='+Date.now();document.body.appendChild(frame);
 const timer=setTimeout(()=>frame.remove(),15000);
 window.addEventListener('message',function onNotices(e){
  if(e.source!==frame.contentWindow||!['https://script.google.com','https://script.googleusercontent.com'].includes(e.origin))return;
  if(!e.data||e.data.type!=='SS26_PUBLIC_NOTICES')return;
  clearTimeout(timer);frame.remove();window.removeEventListener('message',onNotices);
  window.STAR_SINGERS_NOTICES=Array.isArray(e.data.notices)?e.data.notices:[];
  window.dispatchEvent(new CustomEvent('ss26:notices-loaded'));
 });
})();
