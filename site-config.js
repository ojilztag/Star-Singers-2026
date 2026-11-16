/* Public event settings loader. Displays the live registration state from Apps Script. */
(function(){
 const API='https://script.google.com/macros/s/AKfycbxPwRrD35fv7UWOJO6EN6eqIxT5czuaIBjbU8qR9xfdFYuod6bB-RrNj6r0hDuma6Qk6Q/exec';
 let frame=null,timeout=null,received=false;
 window.SS26_REGISTRATION_FEE=500;
 function statusBanner(){
  let el=document.getElementById('ss26RegistrationStatusBanner');
  const form=document.getElementById('participantRegistration');
  if(!el){
   el=document.createElement('div');el.id='ss26RegistrationStatusBanner';
   el.setAttribute('role','status');el.setAttribute('aria-live','polite');
   el.style.cssText='margin:0 0 16px;padding:14px 16px;border:1px solid #d8c18b;border-radius:12px;background:#fff7df;color:#634719;font-weight:700;line-height:1.5';
   if(form&&form.parentNode)form.parentNode.insertBefore(el,form);
  }
  return el;
 }
 function showStatus(status){
  const el=statusBanner();if(!el)return;
  const messages={'Coming Soon':'REGISTRATION COMING SOON · രജിസ്ട്രേഷൻ ഉടൻ ആരംഭിക്കുന്നതാണ്. ഔദ്യോഗിക അറിയിപ്പുകൾക്കായി കാത്തിരിക്കുക.','Open':'REGISTRATION OPEN · രജിസ്ട്രേഷൻ ഇപ്പോൾ സ്വീകരിക്കുന്നു.','Closed':'REGISTRATION CLOSED · രജിസ്ട്രേഷൻ നിലവിൽ അവസാനിച്ചിരിക്കുന്നു.','Checking':'Checking registration status…','Unavailable':'REGISTRATION STATUS UNAVAILABLE · രജിസ്ട്രേഷൻ നില ഇപ്പോൾ ലഭ്യമല്ല.'};
  el.textContent=messages[status]||messages.Unavailable;
  el.style.background=status==='Open'?'#e8f5ec':status==='Closed'?'#fcebed':'#fff7df';
  el.style.borderColor=status==='Open'?'#9ac7a6':status==='Closed'?'#d9a0a8':'#d8c18b';
  el.style.color=status==='Open'?'#205b32':status==='Closed'?'#8b2635':'#634719';
 }
 function apply(s){
  if(!s||typeof s!=='object')return;
  const set=(id,value)=>{const el=document.getElementById(id);if(el&&String(value||'').trim())el.textContent=String(value).trim();};
  const fee=Number(s.registrationFee);if(Number.isFinite(fee)&&fee>0){window.SS26_REGISTRATION_FEE=fee;['siteRegistrationFeeText','sitePaymentFeeText'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='₹'+fee.toLocaleString('en-IN');});const consent=document.getElementById('siteFeeConsentText');if(consent)consent.textContent='I understand and agree that the registration fee is ₹'+fee.toLocaleString('en-IN')+' for one individual entry. I will upload the payment receipt/screenshot after payment. *';}
  const status=String(s.registrationStatus||'Coming Soon').trim();showStatus(status);const submit=document.querySelector('#participantRegistration button[type="submit"]'),continueButton=document.getElementById('openPayment');const disabled=status!=='Open';if(submit){submit.disabled=disabled;submit.textContent=disabled?(status==='Closed'?'Registration Closed':'Registration Opening Soon'):'Submit Registration';}if(continueButton){continueButton.disabled=disabled;if(disabled)continueButton.textContent=status==='Closed'?'Registration Closed':'Registration Opening Soon';}
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
  showStatus('Checking');
  const submit=document.querySelector('#participantRegistration button[type="submit"]'),continueButton=document.getElementById('openPayment');
  if(submit){submit.disabled=true;submit.textContent='Checking Registration Status…';}
  if(continueButton)continueButton.disabled=true;
  if(!API||API.includes('PASTE_')){showStatus('Unavailable');return;}
  window.addEventListener('message',onMessage);
  frame=document.createElement('iframe');frame.title='Public event information';frame.hidden=true;frame.src=API+'?action=siteconfig&_='+Date.now();document.body.appendChild(frame);
  timeout=setTimeout(()=>{if(!received){cleanup();showStatus('Unavailable');if(submit){submit.disabled=true;submit.textContent='Registration Status Unavailable';}if(continueButton){continueButton.disabled=true;continueButton.textContent='Registration Status Unavailable';}window.dispatchEvent(new Event('ss26:site-config-load-failed'));}},12000);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();