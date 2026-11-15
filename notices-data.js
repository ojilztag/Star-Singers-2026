/* Public notices are loaded from the Star Singers Apps Script deployment. */
window.STAR_SINGERS_NOTICES = [];
(function(){
 const API='PASTE_STAR_SINGERS_APPS_SCRIPT_EXEC_URL_HERE';
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
