/* Public event information loader. */
(function(){
 const API='https://script.google.com/macros/s/AKfycbxPwRrD35fv7UWOJO6EN6eqIxT5czuaIBjbU8qR9xfdFYuod6bB-RrNj6r0hDuma6Qk6Q/exec';
 let frame=null,timeout=null;
 window.SS26_REGISTRATION_FEE=300;
 window.SS26_REGISTRATION_CLOSING_DATE='2026-12-31';
 function apply(s){
  if(!s||typeof s!=='object')return;
  const set=(id,value)=>{const el=document.getElementById(id);if(el&&String(value||'').trim())el.textContent=String(value).trim();};
  const fee=Number(s.registrationFee);
  if(Number.isFinite(fee)&&fee>0){
   window.SS26_REGISTRATION_FEE=fee;
   ['siteRegistrationFeeText','sitePaymentFeeText'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='₹'+fee.toLocaleString('en-IN');});
   const consent=document.getElementById('siteFeeConsentText');
   if(consent)consent.textContent='I understand and agree that the registration fee is ₹'+fee.toLocaleString('en-IN')+' for one individual entry. I will upload the payment receipt/screenshot after payment. *';
  }
  set('siteDateOpens',s.registrationOpens);set('siteDateCloses',s.registrationCloses);
  window.SS26_REGISTRATION_CLOSING_DATE=String(s.registrationClosingDate||'2026-12-31').trim().match(/^\\d{4}-\\d{2}-\\d{2}$/)?String(s.registrationClosingDate||'2026-12-31').trim():'2026-12-31';
  document.dispatchEvent(new Event('ss26:closing-date-updated'));
  set('siteDateVideo',s.videoDeadline);set('siteDateResults',s.resultsDate);
  set('siteUpdateOpens',s.registrationOpens);set('siteUpdateRules',s.rulesSummary);
  set('siteUpdateParticipation',s.participation);set('siteUpdatePrizes',s.prizeDetails);
  set('siteUpdateSubmission',s.submissionInstructions);set('siteUpdateResults',s.resultsDate);
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
  apply(d.settings);cleanup();
 }
 function load(){
  window.addEventListener('message',onMessage);
  frame=document.createElement('iframe');frame.title='Public event information';frame.hidden=true;
  frame.src=API+'?action=siteconfig&_='+Date.now();document.body.appendChild(frame);
  timeout=setTimeout(cleanup,12000);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();