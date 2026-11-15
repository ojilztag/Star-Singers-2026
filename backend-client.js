/* Star Singers 2026 public registration bridge.
   Set API_URL to the deployed Apps Script Web App URL ending in /exec. */
const STAR_SINGERS_API_URL = 'https://script.google.com/macros/s/AKfycbxPwRrD35fv7UWOJO6EN6eqIxT5czuaIBjbU8qR9xfdFYuod6bB-RrNj6r0hDuma6Qk6Q/exec';
(function(){
 const form=document.getElementById('participantRegistration');
 if(!form)return;
 const modal=document.getElementById('paymentModal');
 const message=document.getElementById('registrationMessage');
 let busy=false,seq=0;
 function status(text,isError){message.textContent=text;message.style.color=isError?'#ffb7b7':'';}
 function fileData(file,maxBytes,label){
  return new Promise((resolve,reject)=>{
   if(!file)return reject(new Error(label+' is required.'));
   if(file.size>maxBytes)return reject(new Error(label+' is too large. Please keep it below 3 MB.'));
   const reader=new FileReader();
   reader.onerror=()=>reject(new Error('Could not read '+label+'.'));
   reader.onload=()=>resolve({name:file.name,mimeType:file.type||'application/octet-stream',data:String(reader.result).split(',')[1]||''});
   reader.readAsDataURL(file);
  });
 }
 function post(payload,done){
  const frameName='ss26-upload-'+(++seq),frame=document.createElement('iframe');
  frame.name=frameName;frame.hidden=true;document.body.appendChild(frame);
  const f=document.createElement('form');f.method='POST';f.action=STAR_SINGERS_API_URL;f.target=frameName;f.hidden=true;
  const input=document.createElement('input');input.type='hidden';input.name='payload';input.value=JSON.stringify(payload);f.appendChild(input);document.body.appendChild(f);
  let finished=false;
  const cleanup=()=>{if(finished)return;finished=true;clearTimeout(timer);window.removeEventListener('message',onMessage);f.remove();frame.remove();};
  const timer=setTimeout(()=>{cleanup();done({success:false,error:'No reply was received from the Apps Script Web App after 90 seconds. Check the Admin Panel before retrying to avoid duplicate registrations.'});},90000);
  function onMessage(event){
   const d=event.data;if(!d||d.type!=='SS26_REGISTRATION_RESULT'||d.token!==payload.clientToken)return;
   cleanup();done(d);
  }
  window.addEventListener('message',onMessage);f.submit();
 }
 form.addEventListener('submit',async function(e){
  e.preventDefault();e.stopImmediatePropagation();
  if(busy)return;
  if(STAR_SINGERS_API_URL.includes('PASTE_')){status('Backend URL has not been configured. Registration is not submitted.',true);return;}
  if(!form.reportValidity())return;
  const phone=form.querySelector('[name="phone"]').value.trim();
  if(!/^\+[1-9]\d{6,14}$/.test(phone.replace(/[\s()-]/g,''))){status('Enter mobile number with country code, e.g. +91XXXXXXXXXX.',true);return;}
  const photo=form.querySelector('[name="participantPhoto"]').files[0];
  const originalPhoto=form.querySelector('#participantPhotoOriginal')?.files[0]||photo;
  const proof=form.querySelector('[name="paymentProof"]').files[0];
  const utr=form.querySelector('[name="utr"]').value.trim();
  busy=true;const submit=form.querySelector('[type="submit"]');if(submit){submit.disabled=true;submit.textContent='Submitting securely…';}
  status('Uploading participant photo and payment receipt to private Google Drive folders…',false);
  try{
   const [photoData,originalPhotoData,proofData]=await Promise.all([fileData(photo,3*1024*1024,'Cropped participant photo'),fileData(originalPhoto,3*1024*1024,'Original participant photo'),fileData(proof,3*1024*1024,'Payment proof')]);
   const payload={
    action:'register',clientToken:'SS26-'+Date.now()+'-'+Math.random().toString(16).slice(2),
    participantName:form.elements.participantName.value,parishName:form.elements.parishName.value,
    diocese:form.elements.diocese.value,country:form.elements.country.value,state:form.elements.state.value,
    district:form.elements.district.value,phone:phone,utr:utr,fee:500,feeConsent:String(form.elements.feeConsent.checked),
    photo:photoData,originalPhoto:originalPhotoData,paymentProof:proofData
   };
   post(payload,result=>{
    busy=false;if(submit){submit.disabled=false;submit.textContent='Submit Registration & Payment Proof';}
    if(!result.success){status(result.error||'Registration could not be submitted.',true);return;}
    form.reset();if(modal){modal.hidden=true;document.body.style.overflow='';}
    status('Registration request received. Reference: '+result.trackingRef+'. Payment verification is pending. The official Registration ID will be issued only after organiser approval.',false);
   });
  }catch(err){busy=false;if(submit){submit.disabled=false;submit.textContent='Submit Registration & Payment Proof';}status(err.message||'Upload failed. Please try again.',true);}
 },true);
})();
