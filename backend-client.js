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
 function elapsedText(){const seconds=Math.max(0,Math.floor((Date.now()-uploadStartedAt)/1000));return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}
 function status(text,isError){
  message.textContent=text;message.classList.toggle('is-uploading',!isError&&/preparing|uploading/i.test(text));message.style.color=isError?'#ffb7b7':'';
  if(statusPanel){statusPanel.hidden=false;statusPanel.classList.toggle('is-error',!!isError);if(statusTitle)statusTitle.textContent=isError?'Upload needs attention':/step 2|sending|uploading/i.test(text)?'Uploading securely…':/files are ready|prepared/i.test(text)?'Files prepared':/step 1|preparing/i.test(text)?'Preparing your files…':'Registration status';if(statusDetail)statusDetail.textContent=text;if(elapsedLabel)elapsedLabel.textContent=uploadStartedAt?elapsedText():'00:00';}
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
  if(STAR_SINGERS_API_URL.includes('PASTE_')){status('Backend URL has not been configured. Registration is not submitted.',true);return;}
  if(!form.reportValidity())return;
  if(!validateInternationalPhone()){status('Please select your country code and enter a valid mobile number.',true);dialCodeInput.focus();return;}
  const phone=phoneInput.value;
  const photo=form.querySelector('[name="participantPhoto"]').files[0];
  const originalPhoto=form.querySelector('#participantPhotoOriginal')?.files[0]||photo;
  const proof=form.querySelector('[name="paymentProof"]').files[0];
  const utr=form.querySelector('[name="utr"]').value.trim();
  busy=true;const submit=form.querySelector('[type="submit"]');if(submit){submit.disabled=true;submit.textContent='Submitting securely…';}
  startUploadClock();
  status('Step 1 of 2 · Preparing your photos and payment receipt. Small images keep their original quality; only oversized images are compressed.',false);
  try{
   const [photoData,originalPhotoData,proofData]=await Promise.all([fileData(photo,3*1024*1024,'Cropped participant photo',true),fileData(originalPhoto,3*1024*1024,'Original participant photo',true),fileData(proof,3*1024*1024,'Payment proof',true)]);
   status('Step 2 of 2 · Files are ready. Sending your registration and documents securely. Please keep this page open until confirmation.',false);
   const payload={
    action:'register',clientToken:'SS26-'+Date.now()+'-'+Math.random().toString(16).slice(2),
    participantName:form.elements.participantName.value,parishName:form.elements.parishName.value,
    diocese:form.elements.diocese.value,country:form.elements.country.value,state:form.elements.state.value,
    district:form.elements.district.value,phone:phone,utr:utr,fee:500,feeConsent:String(form.elements.feeConsent.checked),
    photo:photoData,originalPhoto:originalPhotoData,paymentProof:proofData
   };
   post(payload,result=>{
    busy=false;stopUploadClock();if(submit){submit.disabled=false;submit.textContent='Submit Registration & Payment Proof';}
    if(!result.success){status(result.error||'Registration could not be submitted.',true);return;}
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
  }catch(err){busy=false;stopUploadClock();if(submit){submit.disabled=false;submit.textContent='Submit Registration & Payment Proof';}status(err.message||'Upload failed. Please try again.',true);}
 },true);
})();
