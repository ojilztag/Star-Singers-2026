/* Star Singers 2026 public registration bridge.
   Set API_URL to the deployed Apps Script Web App URL ending in /exec. */
const STAR_SINGERS_API_URL = 'https://script.google.com/macros/s/AKfycbxPwRrD35fv7UWOJO6EN6eqIxT5czuaIBjbU8qR9xfdFYuod6bB-RrNj6r0hDuma6Qk6Q/exec';
(function(){
 const form=document.getElementById('participantRegistration');
 if(!form)return;
 const modal=document.getElementById('paymentModal');
 const message=document.getElementById('registrationMessage');
 let busy=false,seq=0,uploadStartedAt=0,uploadClock=null;
 const statusPanel=document.getElementById('uploadStatusPanel');
 const statusTitle=document.getElementById('uploadStatusTitle');
 const statusDetail=document.getElementById('uploadStatusDetail');
 const elapsedLabel=document.getElementById('uploadElapsed');
 const statusBar=document.getElementById('uploadStatusBar');
 const submitButton=form.querySelector('[type="submit"]');
 const utrInput=form.querySelector('[name="utr"]');
 if(utrInput)utrInput.addEventListener('input',function(){this.value=this.value.replace(/\D/g,'').slice(0,12);this.setCustomValidity(this.value.length===12?'':'UTR / Transaction ID കൃത്യമായി 12 അക്കങ്ങൾ നൽകുക. / Enter exactly 12 digits.');});
 const submitButtonDefault='Submit Registration & Payment Proof';
  function bilingualError(message){
   const raw=String(message||'').trim();
   const rules=[
    [/same participant name and WhatsApp number has already been submitted/i,'ഈ Participant Name-ഉം WhatsApp Number-ഉം ഉപയോഗിച്ച് Registration മുമ്പ് Submit ചെയ്തിട്ടുണ്ട്. Organiser verification പൂർത്തിയാകുന്നത് വരെ വീണ്ടും Submit ചെയ്യരുത്. / A registration with the same participant name and WhatsApp number has already been submitted. Please wait for organiser verification; do not submit again.'],
    [/exactly 12 digits/i,'UTR / Transaction ID കൃത്യമായി 12 അക്കങ്ങൾ ആയിരിക്കണം. Payment receipt-ൽ നിന്നുള്ള 12 digits നൽകുക. / UTR must contain exactly 12 digits.'],
    [/valid mobile number|country code/i,'ശരിയായ Country Code സഹിതമുള്ള Mobile / WhatsApp Number നൽകുക. / Please enter a valid mobile number with country code.'],
    [/required/i,'ആവശ്യമായ എല്ലാ വിവരങ്ങളും പൂരിപ്പിക്കുക. / Please complete all required fields.'],
    [/too large|maximum allowed size/i,'തിരഞ്ഞെടുത്ത File size അനുവദനീയമായ പരിധി കവിയുന്നു. 3 MB-ൽ താഴെയുള്ള file തിരഞ്ഞെടുക്കുക. / File exceeds the 3 MB limit. Please choose a smaller file.'],
    [/not initialized|admin not initialized/i,'Admin setup പൂർത്തിയായിട്ടില്ല. Organiser-നെ ബന്ധപ്പെടുക. / Admin is not initialized. Contact the organiser.'],
    [/permission|access denied|not authorised|unauthorized/i,'പ്രവേശനാനുമതി ലഭിച്ചില്ല. വീണ്ടും ശ്രമിക്കുക അല്ലെങ്കിൽ Organiser-നെ ബന്ധപ്പെടുക. / Permission denied. Please try again or contact the organiser.'],
    [/timed out|within 120 seconds|server did not confirm/i,'Server-ൽ നിന്ന് confirmation ലഭിച്ചില്ല. വീണ്ടും Submit ചെയ്യുന്നതിന് മുമ്പ് Admin Panel-ൽ നിങ്ങളുടെ പേര്, WhatsApp Number പരിശോധിക്കുക. / Server confirmation was not received. Check the Admin Panel before submitting again.']
   ];
   const match=rules.find(([pattern])=>pattern.test(raw));
   return match?match[1]:(raw?('ഒരു പ്രശ്നം സംഭവിച്ചു: '+raw+' / An error occurred: '+raw):'ഒരു പിശക് സംഭവിച്ചു. വീണ്ടും ശ്രമിക്കുക. / Something went wrong. Please try again.');
  }
 function setSubmitState(state){if(!submitButton)return;submitButton.classList.toggle('is-submitting',!!state);submitButton.disabled=!!state;submitButton.setAttribute('aria-busy',state?'true':'false');submitButton.textContent=state==='preparing'?'Preparing your files…':state==='uploading'?'Uploading securely…':submitButtonDefault;}
 function elapsedText(){const seconds=Math.max(0,Math.floor((Date.now()-uploadStartedAt)/1000));return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}
 function status(text,isError){
  message.textContent=text;message.classList.toggle('is-uploading',!isError&&/preparing|uploading/i.test(text));message.style.color=isError?'#ffb7b7':'';
  if(statusPanel){statusPanel.hidden=false;statusPanel.classList.toggle('is-error',!!isError);if(statusTitle)statusTitle.textContent=isError?'Upload needs attention':/step 2|sending|uploading/i.test(text)?'Uploading securely…':/files are ready|prepared/i.test(text)?'Files prepared':/step 1|preparing/i.test(text)?'Preparing your files…':'Registration status';if(statusDetail)statusDetail.textContent=text;if(statusBar){statusBar.style.width=isError?'100%':/step 2|sending|uploading/i.test(text)?'72%':/step 1|preparing/i.test(text)?'22%':/files are ready|prepared/i.test(text)?'65%':'8%';statusBar.classList.toggle('is-error',!!isError);}if(elapsedLabel)elapsedLabel.textContent=uploadStartedAt?elapsedText():'00:00';}
  if(isError&&uploadClock){clearInterval(uploadClock);uploadClock=null;}
 }
 function startUploadClock(){uploadStartedAt=Date.now();if(uploadClock)clearInterval(uploadClock);if(statusPanel)statusPanel.hidden=false;uploadClock=setInterval(()=>{if(elapsedLabel)elapsedLabel.textContent=elapsedText();},1000);}
 function stopUploadClock(){if(uploadClock){clearInterval(uploadClock);uploadClock=null;}}
 function compressImage(file,label,maxBytes){
  return new Promise((resolve,reject)=>{
   const makeBlob=async(image)=>{
    try{
     const width=image.width||image.naturalWidth,height=image.height||image.naturalHeight;
     if(!width||!height)throw new Error('Could not read '+label+'. Please choose another image.');
     let scale=Math.min(1,2400/Math.max(width,height));
     for(let dimensionPass=0;dimensionPass<5;dimensionPass++){
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
      const ctx=canvas.getContext('2d',{alpha:false});
      if(!ctx)throw new Error('Image compression is not supported in this browser.');
      ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
      ctx.drawImage(image,0,0,canvas.width,canvas.height);
      for(const quality of [.92,.89,.86,.83]){
       const blob=await new Promise(done=>canvas.toBlob(done,'image/jpeg',quality));
       if(!blob)throw new Error('Could not compress '+label+'. Please try another image.');
       if(blob.size<=maxBytes*.97){
        const cleanName=file.name.replace(/\.[^.]+$/,'');
        resolve(new File([blob],cleanName+'.jpg',{type:'image/jpeg',lastModified:Date.now()}));
        return;
       }
      }
      scale*=.86;
      if(Math.max(width,height)*scale<1200)break;
     }
     throw new Error('This image is still too large after high-quality compression. Please choose a smaller image.');
    }catch(err){reject(err);}
   };
   if(window.createImageBitmap){
    createImageBitmap(file).then(bitmap=>{makeBlob(bitmap).finally(()=>bitmap.close());}).catch(()=>loadFallback());
   }else loadFallback();
   function loadFallback(){
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{makeBlob(img).finally(()=>URL.revokeObjectURL(url));};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not open '+label+'. Use JPG, PNG or WebP.'));};
    img.src=url;
   }
  });
 }
 async function fileData(file,maxBytes,label,compress){
  if(!file)throw new Error(label+' is required.');
  let uploadFile=file;
  if(compress&&file.type.startsWith('image/')&&file.size>maxBytes){
   status('Preparing '+label+' and carefully reducing the large image…',false);
   uploadFile=await compressImage(file,label,maxBytes);
  }
  if(uploadFile.size>maxBytes)throw new Error(label+' is too large ('+(uploadFile.size/1024/1024).toFixed(2)+' MB). Maximum allowed size is 3 MB. Please choose a smaller file.');
  return await new Promise((resolve,reject)=>{
   const reader=new FileReader();
   reader.onerror=()=>reject(new Error('Could not read '+label+'. Please choose the file again.'));
   reader.onload=()=>resolve({name:uploadFile.name,mimeType:uploadFile.type||'application/octet-stream',data:String(reader.result).split(',')[1]||''});
   reader.readAsDataURL(uploadFile);
  });
 }
 function post(payload,done){
  const frameName='ss26-upload-'+(++seq),frame=document.createElement('iframe');
  frame.name=frameName;frame.hidden=true;document.body.appendChild(frame);
  const f=document.createElement('form');f.method='POST';f.action=STAR_SINGERS_API_URL;f.target=frameName;f.hidden=true;
  const input=document.createElement('input');input.type='hidden';input.name='payload';input.value=JSON.stringify(payload);f.appendChild(input);document.body.appendChild(f);
  let finished=false;
  const cleanup=()=>{if(finished)return;finished=true;clearTimeout(timer);window.removeEventListener('message',onMessage);f.remove();frame.remove();};
  const timer=setTimeout(()=>{cleanup();done({success:false,error:'The server did not confirm the registration within 120 seconds. Please check the Admin Panel using the participant name and WhatsApp number before trying again, to avoid a duplicate.'});},120000);
  function onMessage(event){
   const d=event.data;if(!d||d.type!=='SS26_REGISTRATION_RESULT'||d.token!==payload.clientToken)return;
   cleanup();done(d);
  }
  window.addEventListener('message',onMessage);f.submit();
 }
 form.addEventListener('submit',async function(e){
  e.preventDefault();e.stopImmediatePropagation();
  if(busy)return;
  if(STAR_SINGERS_API_URL.includes('PASTE_')){status('Backend URL configure ചെയ്തിട്ടില്ല. Registration submit ചെയ്തിട്ടില്ല. / Backend URL is not configured.',true);return;}
  if(!form.reportValidity())return;
  const phoneBridge=window.ss26PhoneBridge;
  if(!phoneBridge||!phoneBridge.validate()){status('Country Code select ചെയ്ത് ശരിയായ Mobile Number നൽകുക. / Please select your country code and enter a valid mobile number.',true);if(phoneBridge)phoneBridge.focusCountryCode();return;}
  const phone=phoneBridge.getPhone();
  const photo=form.querySelector('[name="participantPhoto"]').files[0];
  const originalPhoto=form.querySelector('#participantPhotoOriginal')?.files[0]||photo;
  const proof=form.querySelector('[name="paymentProof"]').files[0];
  const utr=form.querySelector('[name="utr"]').value.trim();
  if(!/^\d{12}$/.test(utr)){status('UTR / Transaction ID കൃത്യമായി 12 അക്കങ്ങൾ ആയിരിക്കണം. / Enter exactly 12 digits.',true);form.querySelector('[name="utr"]').focus();return;}
  busy=true;const submit=submitButton;setSubmitState('preparing');
  startUploadClock();
  status('Step 1 of 2 · നിങ്ങളുടെ Photo-കളും Payment Receipt-ഉം തയ്യാറാക്കുന്നു. വലിയ images മാത്രം compress ചെയ്യും. / Preparing your photos and payment receipt.',false);
  try{
   const [photoData,originalPhotoData,proofData]=await Promise.all([fileData(photo,3*1024*1024,'Cropped participant photo',true),fileData(originalPhoto,3*1024*1024,'Original participant photo',true),fileData(proof,3*1024*1024,'Payment proof',true)]);
   status('Step 2 of 2 · Files തയ്യാറായി. Registration സുരക്ഷിതമായി അയയ്ക്കുന്നു. Confirmation ലഭിക്കുന്നതുവരെ ഈ page തുറന്നുവെക്കുക. / Sending securely; keep this page open.',false);setSubmitState('uploading');
   const payload={
    action:'register',clientToken:'SS26-'+Date.now()+'-'+Math.random().toString(16).slice(2),
    participantName:form.elements.participantName.value,parishName:form.elements.parishName.value,
    diocese:form.elements.diocese.value,country:form.elements.country.value,state:form.elements.state.value,
    district:form.elements.district.value,phone:phone,utr:utr,fee:Number(window.SS26_REGISTRATION_FEE||300),feeConsent:String(form.elements.feeConsent.checked),
    photo:photoData,originalPhoto:originalPhotoData,paymentProof:proofData
   };
   post(payload,result=>{
    busy=false;stopUploadClock();setSubmitState(false);
    if(!result.success){status(bilingualError(result.error||'Registration could not be submitted.'),true);return;}
    if(statusPanel)statusPanel.hidden=true;
    const submittedName=String(form.elements.participantName.value||'Participant').trim();
    form.reset();if(modal){modal.hidden=true;document.body.style.overflow='';}
    form.hidden=true;
    const successModal=document.getElementById('registrationSuccessModal');
    document.getElementById('registrationSuccessName').textContent=submittedName;
    document.getElementById('registrationSuccessRef').textContent=result.trackingRef||'Received';
    successModal.hidden=false;document.body.style.overflow='hidden';
    document.getElementById('registrationSuccessHome').onclick=()=>{
     successModal.hidden=true;document.body.style.overflow='';
     const registrationSection=document.getElementById('registration');
     if(registrationSection)registrationSection.hidden=true;
     window.location.hash='home';window.scrollTo({top:0,behavior:'smooth'});
    };
    document.getElementById('registrationSuccessHome').focus();
   });
  }catch(err){busy=false;stopUploadClock();setSubmitState(false);status(bilingualError(err.message||'Upload failed. Please try again.'),true);}
 },true);
})();
