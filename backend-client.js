/* Star Singers 2026 public registration bridge.
   Set API_URL to the deployed Apps Script Web App URL ending in /exec. */
const STAR_SINGERS_API_URL = 'https://script.google.com/macros/s/AKfycbxPwRrD35fv7UWOJO6EN6eqIxT5czuaIBjbU8qR9xfdFYuod6bB-RrNj6r0hDuma6Qk6Q/exec';
(function(){
 const form=document.getElementById('participantRegistration');
 if(!form)return;
 const modal=document.getElementById('paymentModal');
 const message=document.getElementById('registrationMessage');
 let busy=false,seq=0;
 function status(text,isError){message.textContent=text;message.classList.toggle('is-uploading',!isError&&/preparing|uploading/i.test(text));message.style.color=isError?'#ffb7b7':'';}
 function compressImage(file,label){
  return new Promise((resolve,reject)=>{
   const makeBlob=(image)=>{
    try{
     const width=image.width||image.naturalWidth,height=image.height||image.naturalHeight;
     if(!width||!height)throw new Error('Could not read '+label+'. Please choose another image.');
     const scale=Math.min(1,1600/Math.max(width,height));
     const canvas=document.createElement('canvas');
     canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
     const ctx=canvas.getContext('2d',{alpha:false});
     if(!ctx)throw new Error('Image compression is not supported in this browser.');
     ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
     ctx.drawImage(image,0,0,canvas.width,canvas.height);
     canvas.toBlob(blob=>{
      if(!blob){reject(new Error('Could not compress '+label+'. Please try another image.'));return;}
      resolve(new File([blob],file.name.replace(/\\.[^.]+$/,'')+'.jpg',{type:'image/jpeg',lastModified:Date.now()}));
     },'image/jpeg',.78);
    }catch(err){reject(err);}
   };
   if(window.createImageBitmap){
    createImageBitmap(file).then(bitmap=>{makeBlob(bitmap);bitmap.close();}).catch(()=>loadFallback());
   }else loadFallback();
   function loadFallback(){
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{makeBlob(img);URL.revokeObjectURL(url);};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not open '+label+'. Use JPG, PNG or WebP.'));};
    img.src=url;
   }
  });
 }
 async function fileData(file,maxBytes,label,compress){
  if(!file)throw new Error(label+' is required.');
  let uploadFile=file;
  if(compress&&file.type.startsWith('image/')){
   status('Preparing '+label+' and reducing its file size…',false);
   uploadFile=await compressImage(file,label);
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
  const phone=form.querySelector('[name="phone"]').value.trim();
  if(!/^\+[1-9]\d{6,14}$/.test(phone.replace(/[\s()-]/g,''))){status('Enter mobile number with country code, e.g. +91XXXXXXXXXX.',true);return;}
  const photo=form.querySelector('[name="participantPhoto"]').files[0];
  const originalPhoto=form.querySelector('#participantPhotoOriginal')?.files[0]||photo;
  const proof=form.querySelector('[name="paymentProof"]').files[0];
  const utr=form.querySelector('[name="utr"]').value.trim();
  busy=true;const submit=form.querySelector('[type="submit"]');if(submit){submit.disabled=true;submit.textContent='Submitting securely…';}
  status('Preparing your files. Please keep this page open…',false);
  try{
   const [photoData,originalPhotoData,proofData]=await Promise.all([fileData(photo,3*1024*1024,'Cropped participant photo',true),fileData(originalPhoto,3*1024*1024,'Original participant photo',true),fileData(proof,3*1024*1024,'Payment proof',true)]);
   status('Files prepared. Uploading securely to the registration server… Please do not close or refresh this page.',false);
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
    // Lock the completed form and replace it with a clear confirmation notice.
    Array.from(form.children).forEach(node=>{if(node!==message)node.hidden=true;});
    message.style.whiteSpace='pre-line';
    message.style.display='block';
    message.style.padding='22px';
    message.style.border='1px solid #d9bd78';
    message.style.borderRadius='16px';
    message.textContent='REGISTRATION SUBMITTED SUCCESSFULLY ✓\nReference Number: '+result.trackingRef+'\n\nനിങ്ങളുടെ അപേക്ഷ വിജയകരമായി ലഭിച്ചു. വീണ്ടും Registration Form പൂരിപ്പിക്കേണ്ടതില്ല.\n\nPayment verification and document checking are pending. Organisers will review your submission and publish the next instructions through the official website / notice section. Please keep your Reference Number safe.\n\nഒരേ Participant Name + WhatsApp Number ഉപയോഗിച്ച് വീണ്ടും അപേക്ഷിക്കരുത്. പരിശോധന പൂർത്തിയാകുന്നതുവരെ കാത്തിരിക്കുക.\n\nYour official Registration ID / Entry Card will be issued only after payment verification and organiser approval.';
   });
  }catch(err){busy=false;if(submit){submit.disabled=false;submit.textContent='Submit Registration & Payment Proof';}status(err.message||'Upload failed. Please try again.',true);}
 },true);
})();
