/* Public notices loader for Star Singers 2026. */
(function(){
 const API='https://script.google.com/macros/s/AKfycbxPwRrD35fv7UWOJO6EN6eqIxT5czuaIBjbU8qR9xfdFYuod6bB-RrNj6r0hDuma6Qk6Q/exec';
 window.STAR_SINGERS_NOTICES=[];
 if(!API||API.includes('PASTE_'))return;
 let frame=null,timeout=null,attempt=0,received=false;
 function accept(e){
  if(!frame||e.source!==frame.contentWindow||!['https://script.google.com','https://script.googleusercontent.com'].includes(e.origin))return;
  const d=e.data;
  if(!d||d.type!=='SS26_PUBLIC_NOTICES'||!Array.isArray(d.notices))return;
  received=true;clearTimeout(timeout);
  window.STAR_SINGERS_NOTICES=d.notices;
  window.dispatchEvent(new CustomEvent('ss26:notices-loaded',{detail:{count:d.notices.length}}));
  try{frame.contentWindow.postMessage({type:'SS26_PUBLIC_NOTICES_ACK'},e.origin);}catch(_){}
  window.removeEventListener('message',accept);
  setTimeout(()=>frame&&frame.remove(),1000);
 }
 function load(){
  if(received)return;
  clearTimeout(timeout);
  if(frame)frame.remove();
  frame=document.createElement('iframe');
  frame.title='Official notices data';frame.hidden=true;
  window.addEventListener('message',accept);
  frame.src=API+'?action=notices&v='+Date.now()+'-'+(++attempt);
  document.body.appendChild(frame);
  timeout=setTimeout(()=>{
   if(!received&&attempt<3)load();
   else if(!received){window.removeEventListener('message',accept);window.dispatchEvent(new CustomEvent('ss26:notices-load-failed'));}
  },8000);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
