/* Public event settings loader. Falls back to the authored page content if the backend is unavailable. */
(function(){
 const API='https://script.google.com/macros/s/AKfycbxPwRrD35fv7UWOJO6EN6eqIxT5czuaIBjbU8qR9xfdFYuod6bB-RrNj6r0hDuma6Qk6Q/exec';
 let frame=null,timeout=null,received=false;
 window.SS26_REGISTRATION_FEE=500;
 function apply(s){
  if(!s||typeof s!=='object')return;
  const set=(id,value)=>{const el=document.getElementById(id);if(el&&String(value||'').trim())el.textContent=String(value).trim();};
  const fee=Number(s.registrationFee);if(Number.isFinite(fee)&&fee>0){window.SS26_REGISTRATION_FEE=fee;['siteRegistrationFeeText','sitePaymentFeeText'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='₹'+fee.toLocaleString('en-IN');});const consent=document.getElementById('siteFeeConsentText');if(consent)consent.textContent='I understand and agree that the registration fee is ₹'+fee.toLocaleString('en-IN')+' for one individual entry. I will upload the payment receipt/screenshot after payment. *';}
  const status=String(s.registrationStatus||'').trim();if(status){const submit=document.querySelector('#participantRegistration button[type="submit"]');if(submit&&status==='Closed'){submit.disabled=true;submit.textContent='Registration Closed';}else if(submit&&status==='Coming Soon'){submit.disabled=true;submit.textContent='Registration Opening Soon';}}
  set('siteDateOpens',s.registrationOpens);
  set('siteDateCloses',s.registrationCloses);
  set('siteDateVideo',s.videoDeadline);
  set('siteDateResults',s.resultsDate);
  set('siteUpdateOpens',s.registrationOpens);
  set('siteUpdateRules',s.rulesSummary);
  set('siteUpdateParticipation',s.participation);
  set('siteUpdatePrizes',s.prizeDetails);
  set('siteUpdateSubmission',s.submissionInstructions);
  set('siteUpdateResults',s.resultsDate);
  const contact=document.getElementById('siteContactText');
  if(contact&&(s.contactEmail||s.contactWhatsApp)){
   const parts=['Event enquiries · ഔദ്യോഗിക അന്വേഷണങ്ങൾ:'];
   if(s.contactEmail)parts.push('Email: '+s.contactEmail);
   if(s.contactWhatsApp)parts.push('WhatsApp: '+s.contactWhatsApp);
   contact.textContent=parts.join(' · ');
  }
  window.STAR_SINGERS_SITE_CONFIG=s;
  window.dispatchEvent(new CustomEvent('ss26:site-config-loaded',{detail:s}));
 }
 function cleanup(){if(timeout)clearTimeout(timeout);window.removeEventListener('message',onMessage);if(frame){frame.remove();frame=null;}}
 function onMessage(e){
  if(!frame||e.source!==frame.contentWindow||!['https://script.google.com','https://script.googleusercontent.com'].includes(e.origin))return;
  const d=e.data;if(!d||d.type!=='SS26_PUBLIC_SITE_CONFIG'||!d.settings)return;
  received=true;apply(d.settings);cleanup();
 }
 function load(){
  if(!API||API.includes('PASTE_'))return;
  window.addEventListener('message',onMessage);
  frame=document.createElement('iframe');frame.title='Public event information';frame.hidden=true;frame.src=API+'?action=siteconfig&_='+Date.now();document.body.appendChild(frame);
  timeout=setTimeout(()=>{if(!received){cleanup();window.dispatchEvent(new Event('ss26:site-config-load-failed'));}},12000);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();