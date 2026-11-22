/**
 * STAR SINGERS 2026 — COMPLETE GOOGLE APPS SCRIPT BACKEND
 * Run installStarSingers2026() ONCE in a new, empty Apps Script project.
 * It creates the database, private Drive folders and initial secure Admin login.
 */
const CFG = {
  PREFIX: 'JKJ-CC26-M-',
  SESSION_TTL: 21600,
  HASH_ROUNDS: 3000,
  MIN_PASSWORD: 12,
  MAX_FILE_BYTES: 3 * 1024 * 1024,
  REG_SHEET: 'Registrations',
  AUDIT_SHEET: 'AuditLog'
};
const REG_HEADERS = [
  'Tracking Ref','Participant ID','Submitted At','Participant Name','Own Parish',
  'Own Diocese','Residence Country','State / Province','District / Region',
  'WhatsApp Number','Entry Type','Registration Fee','UTR / Transaction ID',
  'Participant Photo Drive ID','Participant Photo Drive URL','Original Photo Drive ID','Original Photo Drive URL',
  'Payment Proof Drive ID','Payment Proof Drive URL','Payment Status',
  'Registration Status','Admin Note','Reviewed At','Reviewed By','Gender','Date of Birth','Age at 31-Dec-2026','Age Category'
];
const AUDIT_HEADERS = ['Timestamp','Admin','Action','Record ID','Details'];
const SETTINGS_HEADERS = ['Setting','Value','Description'];
const FINANCE_HEADERS = ['Submitted At','Tracking Ref','Participant Name','UTR / Transaction ID','Expected Fee','Payment Status'];

function setupStarSingersBackend() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('SS26_SPREADSHEET_ID') && props.getProperty('SS26_ROOT_FOLDER_ID')) {
    throw new Error('Backend setup already exists. Existing spreadsheet and Drive folders were not changed.');
  }
  const ss = SpreadsheetApp.create('STAR SINGERS 2026 — Registration Database');
  const reg = ss.getSheets()[0]; reg.setName(CFG.REG_SHEET);
  reg.getRange(1,1,1,REG_HEADERS.length).setValues([REG_HEADERS]).setFontWeight('bold');
  reg.setFrozenRows(1);
  reg.setColumnWidths(1,REG_HEADERS.length,150);
  const audit = ss.insertSheet(CFG.AUDIT_SHEET);
  audit.getRange(1,1,1,AUDIT_HEADERS.length).setValues([AUDIT_HEADERS]).setFontWeight('bold');
  audit.setFrozenRows(1);
  const settings=ss.insertSheet('Settings');
  settings.getRange(1,1,1,SETTINGS_HEADERS.length).setValues([SETTINGS_HEADERS]).setFontWeight('bold');
  settings.getRange(2,1,6,3).setValues([
    ['Event Name','NAKSHATHRA GAYAKAR – STAR SINGERS 2026','Official competition title'],
    ['Registration Fee',300,'INR per individual entry'],
    ['Entry Type','Individual / Single Entry','Group entries are not accepted'],
    ['Participant ID Prefix',CFG.PREFIX,'Sequence starts at 001 after approval'],
    ['Payment Verification','Manual','Admin must verify bank/UPI credit'],
    ['Photo Storage','Private Google Drive','Original and cropped images are admin-only files']
  ]);
  settings.setFrozenRows(1);
  const finance=ss.insertSheet('Payment Reconciliation');
  finance.getRange(1,1,1,FINANCE_HEADERS.length).setValues([FINANCE_HEADERS]).setFontWeight('bold');
  finance.getRange('A2').setFormula('=QUERY(Registrations!A:U,"select C,A,D,M,L,T where A is not null",1)');
  finance.setFrozenRows(1);
  const dash=ss.insertSheet('Dashboard',0);
  dash.getRange('A1:B1').merge().setValue('STAR SINGERS 2026 — LIVE SUMMARY').setFontWeight('bold').setFontSize(16);
  dash.getRange('A3:B10').setValues([
    ['Metric','Live Value'],['Total Registrations',''],['Payment Verification Pending',''],['Registration Review Pending',''],['Approved',''],['Rejected',''],['Verified Collection (INR)',''],['Pending Amount (INR)','']
  ]).setFontWeight('bold');
  dash.getRange('B4:B9').setFormulas([
    ['=COUNTA(Registrations!A2:A)'],['=COUNTIF(Registrations!T2:T,"Pending Verification")'],['=COUNTIFS(Registrations!U2:U,"Pending Review",Registrations!T2:T,"Verified")'],['=COUNTIF(Registrations!U2:U,"Approved")'],['=COUNTIF(Registrations!U2:U,"Rejected")'],['=SUMIFS(Registrations!L2:L,Registrations!T2:T,"Verified",Registrations!U2:U,"Approved")']
  ]);
  dash.getRange('B10').setFormula('=SUMIF(Registrations!T2:T,"Pending Verification",Registrations!L2:L)');
  dash.setColumnWidths(1,2,240);dash.setFrozenRows(3);
  const root = DriveApp.createFolder('STAR SINGERS 2026 — PRIVATE FILES');
  const photos = root.createFolder('Cropped Participant Photos');
  const originals = root.createFolder('Original Participant Photos — Admin Only');
  const proofs = root.createFolder('Payment Proofs — Admin Only');
  props.setProperties({
    SS26_SPREADSHEET_ID:ss.getId(),
    SS26_ROOT_FOLDER_ID:root.getId(),
    SS26_PHOTOS_FOLDER_ID:photos.getId(),
    SS26_ORIGINALS_FOLDER_ID:originals.getId(),
    SS26_PROOFS_FOLDER_ID:proofs.getId()
  });
  Logger.log('SETUP COMPLETE. Spreadsheet: '+ss.getUrl());
  Logger.log('Private Drive folder: '+root.getUrl());
  Logger.log('Database and private storage created. Run installStarSingers2026() for the one-time complete setup.');
  return {spreadsheetUrl:ss.getUrl(),driveFolderUrl:root.getUrl()};
}


/**
 * ONE-TIME INSTALLER.
 * Run this function once in a brand-new Apps Script project.
 * It creates the database, private Drive folders and a secure initial Admin login.
 * The initial password is shown once in the execution log. Copy it and keep it private.
 */
function installStarSingers2026() {
  const props=PropertiesService.getScriptProperties();
  if(props.getProperty('SS26_SPREADSHEET_ID') || props.getProperty('SS26_ROOT_FOLDER_ID')) {
    throw new Error('Installation already exists in this project. Nothing was changed.');
  }
  const storage=setupStarSingersBackend();
  const username='admin';
  const initialPassword=Utilities.getUuid().replace(/-/g,'')+'A9!';
  const salt=Utilities.getUuid()+Utilities.getUuid();
  props.setProperties({
    ADMIN_USER:username,
    ADMIN_SALT:salt,
    ADMIN_HASH:hash_(initialPassword,salt),
    SESSION_VERSION:'1'
  });
  props.deleteProperty('ADMIN_PASSWORD');
  Logger.log('========== SAVE THESE ADMIN LOGIN DETAILS ==========');
  Logger.log('Admin username: '+username);
  Logger.log('Initial password: '+initialPassword);
  Logger.log('Change this password after your first successful login.');
  Logger.log('Database: '+storage.spreadsheetUrl);
  Logger.log('Private Drive folder: '+storage.driveFolderUrl);
  Logger.log('=====================================================');
  return {success:true,adminUsername:username,initialPassword:initialPassword,
    spreadsheetUrl:storage.spreadsheetUrl,driveFolderUrl:storage.driveFolderUrl};
}

function initializeStarSingersAdmin() {
  const p=PropertiesService.getScriptProperties();
  const user=String(p.getProperty('ADMIN_USER')||'').trim();
  const pass=String(p.getProperty('ADMIN_PASSWORD')||'');
  if(!user||pass.length<CFG.MIN_PASSWORD) throw new Error('Set ADMIN_USER and ADMIN_PASSWORD (minimum 12 characters) in Script Properties first.');
  if(p.getProperty('ADMIN_HASH')) throw new Error('Admin is already initialized.');
  const salt=Utilities.getUuid()+Utilities.getUuid();
  p.setProperties({ADMIN_SALT:salt,ADMIN_HASH:hash_(pass,salt),SESSION_VERSION:'1'});
  p.deleteProperty('ADMIN_PASSWORD');
  Logger.log('Admin initialized for '+user+'. Plaintext password property removed.');
}

function doGet(e) {
  const action=String(e&&e.parameter&&e.parameter.action||'health');
  if(action==='siteconfig') {
    const payload=JSON.stringify({type:'SS26_PUBLIC_SITE_CONFIG',settings:publicSiteSettings_()}).replace(/</g,'\\u003c');
    return HtmlService.createHtmlOutput('<!doctype html><html><body><script>window.parent.postMessage('+payload+',"*");</script></body></html>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return ContentService.createTextOutput('STAR SINGERS 2026 API is active.').setMimeType(ContentService.MimeType.TEXT);
}
function doPost(e) {
  let p={};
  try {
    if(!e||!e.parameter||!e.parameter.payload) throw new Error('Missing request payload.');
    p=JSON.parse(e.parameter.payload);
    const a=String(p.action||'').toLowerCase();
    let out;
    switch(a) {
      case 'register': out=register_(p); return reply_('SS26_REGISTRATION_RESULT',out,p.clientToken);
      case 'adminlogin': out=login_(p); break;
      case 'admindashboard': out=dashboard_(p); break;
      case 'adminsearch': out=search_(p); break;
      case 'getentryphoto': out=getEntryPhoto_(p); break;
      case 'exportregistrations': out=exportRegistrations_(p); break;
      case 'auditcategorydata': out=auditCategoryData_(p); break;
      case 'repaircategorydata': out=repairCategoryData_(p); break;
      case 'verifypayment': out=verifyPayment_(p); break;
      case 'reviewregistration': out=review_(p); break;
      case 'adminsettings': out=manageSiteSettings_(p); break;
      case 'changepassword': out=changePassword_(p); break;
      case 'adminlogout': out=logout_(p); break;
      default: throw new Error('Unsupported action.');
    }
    return reply_('SS26_ADMIN_RESULT',out,p.clientToken);
  } catch(err) {
    const a=String(p.action||'');
    const type=a==='register'?'SS26_REGISTRATION_RESULT':'SS26_ADMIN_RESULT';
    return reply_(type,{success:false,error:safe_(err)},p.clientToken);
  }
}
function reply_(type,data,token) {
  const msg=Object.assign({type},data||{}); if(token) msg.token=token;
  const json=JSON.stringify(msg).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
  return HtmlService.createHtmlOutput('<!doctype html><html><body><script>window.top.postMessage('+json+',"*");</script></body></html>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function json_(v){return ContentService.createTextOutput(JSON.stringify(v)).setMimeType(ContentService.MimeType.JSON);}
function db_(){const id=PropertiesService.getScriptProperties().getProperty('SS26_SPREADSHEET_ID');if(!id)throw new Error('Run setupStarSingersBackend() first.');return SpreadsheetApp.openById(id);}
function sheet_(name,headers){const s=db_().getSheetByName(name);if(!s)throw new Error('Missing sheet: '+name);if(name===CFG.REG_SHEET){const base=headers.slice(0,24),h=s.getRange(1,1,1,24).getDisplayValues()[0];if(base.some((v,i)=>h[i]!==v))throw new Error('Existing registration headers do not match. No data was changed.');if(s.getMaxColumns()<headers.length)s.insertColumnsAfter(s.getMaxColumns(),headers.length-s.getMaxColumns());const extra=s.getRange(1,25,1,headers.length-24).getDisplayValues()[0];headers.slice(24).forEach((v,i)=>{if(!extra[i])s.getRange(1,25+i).setValue(v);else if(extra[i]!==v)throw new Error('Registration category columns do not match. No data was changed.');});return s;}const h=s.getRange(1,1,1,headers.length).getDisplayValues()[0];if(headers.some((v,i)=>h[i]!==v))throw new Error('Sheet headers do not match. No data was changed.');return s;}
function folder_(key){const id=PropertiesService.getScriptProperties().getProperty(key);if(!id)throw new Error('Drive folder not configured.');return DriveApp.getFolderById(id);}
function clean_(v,n){return String(v==null?'':v).replace(/[<>]/g,'').trim().slice(0,n);}
function digits_(v){return String(v||'').replace(/\D/g,'');}
function decodeFile_(obj,label) {
  if(!obj||!obj.data||!obj.name||!obj.mimeType)throw new Error(label+' is required.');
  const bytes=Utilities.base64Decode(String(obj.data));
  if(!bytes.length||bytes.length>CFG.MAX_FILE_BYTES)throw new Error(label+' must be smaller than 3 MB.');
  const mime=String(obj.mimeType);
  if(label==='Participant Photo'&&!/^image\/(jpeg|png|webp|heic)$/.test(mime))throw new Error('Participant photo must be JPG, PNG, WebP or HEIC.');
  if(label==='Payment Proof'&&!(/^image\/(jpeg|png|webp|heic)$/.test(mime)||mime==='application/pdf'))throw new Error('Payment proof must be an image or PDF.');
  const safeName=String(obj.name).replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,90);
  return Utilities.newBlob(bytes,mime,safeName);
}
function savePrivate_(folder,file,ref,label) {
  const f=folder.createFile(file).setName(ref+'_'+label+'_'+file.getName());
  return {id:f.getId(),url:f.getUrl()};
}
function register_(p) {
  const clientToken=clean_(p.clientToken,100);
  if(clientToken){const cached=CacheService.getScriptCache().get('SS26_SUBMIT_'+clientToken);if(cached)return JSON.parse(cached);}
  const name=clean_(p.participantName,120),parish=clean_(p.parishName,160),diocese=clean_(p.diocese,160);
  const country=clean_(p.country,100),state=clean_(p.state,100),district=clean_(p.district,100);
  const phone=String(p.phone||'').trim(),utr=String(p.utr||'').trim();
  const gender=String(p.gender||'').trim(),dateOfBirth=String(p.dateOfBirth||'').trim(),ageInfo=calculateAgeCategory_(dateOfBirth);
  if(!['Male','Female'].includes(gender))throw new Error('Select Male or Female.');
  if(ageInfo.age<5)throw new Error('Participant must be at least 5 years old on 31 December 2026.');
  if(!name||!parish||!diocese||!country||!state||!district||!phone||!utr)throw new Error('Complete all required fields, including UTR / Transaction ID.');
  if(!/^\d{12}$/.test(utr))throw new Error('UTR / Transaction ID must contain exactly 12 digits.');
  if(!/^\+[1-9]\d{6,14}$/.test(phone.replace(/[\s()-]/g,'')))throw new Error('Enter WhatsApp number with country code, e.g. +91XXXXXXXXXX.');
  if(String(p.feeConsent)!=='true')throw new Error('Registration fee consent is required.');
  const siteSettings=readSiteSettings_();
  const configuredFee=Number(siteSettings['Registration Fee']||300);
  if(!Number.isFinite(configuredFee)||configuredFee<=0)throw new Error('Registration fee is not configured correctly.');
  if(Number(p.fee)!==configuredFee)throw new Error('Registration fee has changed. Refresh the page and review the current fee.');
  const photo=decodeFile_(p.photo,'Participant Photo');
  const originalPhoto=decodeFile_(p.originalPhoto||p.photo,'Original Participant Photo');
  const proof=decodeFile_(p.paymentProof,'Payment Proof');
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  let photoSaved=null,originalSaved=null,proofSaved=null;
  try {
    const sh=sheet_(CFG.REG_SHEET,REG_HEADERS);
    // Block only an exact participant-name + WhatsApp-number duplicate.
    // A shared WhatsApp number with a different participant name is allowed.
    const nameKey=duplicateNameKey_(name),phoneKey=duplicatePhoneKey_(phone);
    const last=sh.getLastRow();
    if(last>1) {
      const existing=sh.getRange(2,1,last-1,REG_HEADERS.length).getValues();
      const duplicate=existing.some(r=>duplicateNameKey_(r[3])===nameKey && duplicatePhoneKey_(r[9])===phoneKey);
      if(duplicate) throw new Error('A registration with the same participant name and WhatsApp number has already been submitted. Please wait for organiser verification; do not submit again.');
    }
    const ref='SS26-P'+Utilities.getUuid().replace(/-/g,'').slice(0,8).toUpperCase();
    photoSaved=savePrivate_(folder_('SS26_PHOTOS_FOLDER_ID'),photo,ref,'CROPPED');
    originalSaved=savePrivate_(folder_('SS26_ORIGINALS_FOLDER_ID'),originalPhoto,ref,'ORIGINAL');
    proofSaved=savePrivate_(folder_('SS26_PROOFS_FOLDER_ID'),proof,ref,'PAYMENT');
    const now=new Date();
    sh.appendRow([ref,'',now,name,parish,diocese,country,state,district,phone,'Individual / Single Entry',configuredFee,utr,
      photoSaved.id,photoSaved.url,originalSaved.id,originalSaved.url,proofSaved.id,proofSaved.url,'Pending Verification','Pending Review','','','',gender,dateOfBirth,ageInfo.age,ageInfo.category]);
    const row=sh.getLastRow();
    // Preserve the complete international number as text (including leading + and country code).
    sh.getRange(row,10).setNumberFormat('@').setValue(phone);
    sh.getRange(row,26).setNumberFormat('@').setValue(dateOfBirth);
    sh.getRange(row,3).setNumberFormat('dd-mmm-yyyy hh:mm:ss');
    audit_('PUBLIC','REGISTRATION_SUBMITTED',ref,'Photo and payment proof stored in private Drive folders.');
    const result={success:true,trackingRef:ref,message:'Registration request received. Payment and documents are pending organiser verification.'};
    if(clientToken)CacheService.getScriptCache().put('SS26_SUBMIT_'+clientToken,JSON.stringify(result),21600);
    return result;
  } catch(err) {
    if(photoSaved)try{DriveApp.getFileById(photoSaved.id).setTrashed(true);}catch(ignore){}
    if(originalSaved)try{DriveApp.getFileById(originalSaved.id).setTrashed(true);}catch(ignore){}
    if(proofSaved)try{DriveApp.getFileById(proofSaved.id).setTrashed(true);}catch(ignore){}
    throw err;
  } finally {lock.releaseLock();}
}
function calculateAgeCategory_(dobText){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(dobText))throw new Error('Enter a valid Date of Birth.');
  const p=dobText.split('-').map(Number),birth=new Date(Date.UTC(p[0],p[1]-1,p[2])),cutoff=new Date(Date.UTC(2026,11,31));
  if(birth.getUTCFullYear()!==p[0]||birth.getUTCMonth()!==p[1]-1||birth.getUTCDate()!==p[2]||birth>cutoff)throw new Error('Date of Birth must be valid and on or before 31 December 2026.');
  const age=2026-p[0];return {age:age,category:age<=17?'Junior':age<=39?'Senior':'Super Senior'};
}
function duplicateNameKey_(v){return String(v||'').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim();}
function duplicatePhoneKey_(v){return String(v||'').replace(/\D/g,'');}
function initAdmin_(){const p=PropertiesService.getScriptProperties();if(!p.getProperty('ADMIN_HASH'))throw new Error('Admin not initialized.');}
function login_(p) {
  initAdmin_();const props=PropertiesService.getScriptProperties();
  const u=String(props.getProperty('ADMIN_USER')||''),salt=props.getProperty('ADMIN_SALT');
  if(String(p.username||'').trim().toLowerCase()!==u.toLowerCase()||!equal_(hash_(String(p.password||''),salt),props.getProperty('ADMIN_HASH'))){Utilities.sleep(350);throw new Error('Invalid Admin username or password.');}
  const token=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');
  CacheService.getScriptCache().put('SS26_SESSION_'+token,JSON.stringify({user:u,version:props.getProperty('SESSION_VERSION')||'1'}),CFG.SESSION_TTL);
  return {success:true,sessionToken:token,username:u};
}
function requireAdmin_(token) {
  if(!/^[a-f0-9]{64}$/i.test(String(token||'')))throw new Error('Admin session invalid. Login again.');
  const cache=CacheService.getScriptCache(),key='SS26_SESSION_'+token,raw=cache.get(key);
  if(!raw)throw new Error('Admin session expired. Login again.');
  const s=JSON.parse(raw),v=PropertiesService.getScriptProperties().getProperty('SESSION_VERSION')||'1';
  if(s.version!==v)throw new Error('Admin session expired. Login again.');
  cache.put(key,raw,CFG.SESSION_TTL);return s;
}
function dashboard_(p) {
  const admin=requireAdmin_(p.sessionToken),sh=sheet_(CFG.REG_SHEET,REG_HEADERS),last=sh.getLastRow();
  const rows=last>1?sh.getRange(2,1,last-1,REG_HEADERS.length).getValues():[];
  const newest=rows.slice().reverse();
  const pendingPayment=rows.filter(r=>r[19]==='Pending Verification');
  const pendingReview=rows.filter(r=>r[20]==='Pending Review'&&r[19]==='Verified');
  const approved=rows.filter(r=>r[20]==='Approved');
  const rejected=rows.filter(r=>r[20]==='Rejected');
  const collected=approved.filter(r=>r[19]==='Verified').reduce((sum,r)=>sum+(Number(r[11])||0),0);
  const pendingAmount=pendingPayment.reduce((sum,r)=>sum+(Number(r[11])||0),0);
  const cutoff=Date.now()-7*24*60*60*1000;
  const last7=rows.filter(r=>{const d=r[2] instanceof Date?r[2]:new Date(r[2]);return !isNaN(d.getTime())&&d.getTime()>=cutoff;});
  const auditSh=sheet_(CFG.AUDIT_SHEET,AUDIT_HEADERS);
  const auditLast=auditSh.getLastRow();
  const auditRows=auditLast>1?auditSh.getRange(Math.max(2,auditLast-49),1,Math.min(50,auditLast-1),5).getValues().reverse():[];
  const auditLogs=auditRows.map(r=>({timestamp:r[0] instanceof Date?Utilities.formatDate(r[0],Session.getScriptTimeZone(),'dd-MMM-yyyy hh:mm a'):String(r[0]||''),admin:String(r[1]||''),action:String(r[2]||''),recordId:String(r[3]||''),details:String(r[4]||'')}));
  return {success:true,total:rows.length,pending:pendingReview.length,pendingPayment:pendingPayment.length,approved:approved.length,rejected:rejected.length,
    collectedAmount:collected,pendingAmount:pendingAmount,last7DaysCount:last7.length,last7Days:last7.slice().reverse().map(rowObject_),
    registrations:newest.slice(0,100).map(rowObject_),auditLogs:auditLogs};
}
function search_(p) {
  requireAdmin_(p.sessionToken);
  const q=String(p.query||'').trim().toLowerCase(),filter=String(p.filter||'').trim().toLowerCase();
  if(!q&&!filter)throw new Error('Enter Registration ID, tracking reference, name or WhatsApp number.');
  const sh=sheet_(CFG.REG_SHEET,REG_HEADERS),last=sh.getLastRow(),rows=last>1?sh.getRange(2,1,last-1,REG_HEADERS.length).getValues():[];
  let found=rows;
  if(filter==='submitted')found=found.filter(r=>String(r[0]||'').trim()!=='');
  else if(filter==='pending-payment')found=found.filter(r=>r[19]==='Pending Verification');
  else if(filter==='pending-review')found=found.filter(r=>r[20]==='Pending Review'&&r[19]==='Verified');
  else if(filter==='approved')found=found.filter(r=>r[20]==='Approved');
  else if(filter==='rejected')found=found.filter(r=>r[20]==='Rejected');
  else if(filter&&filter!=='all')throw new Error('Unsupported registration filter.');
  if(q)found=found.filter(r=>r.join(' ').toLowerCase().includes(q));
  found=found.reverse().slice(0,100);
  return {success:true,registrations:found.map(rowObject_),count:found.length,filter:filter||'search'};
}


function exportRegistrations_(p) {
  const admin=requireAdmin_(p.sessionToken);
  const filter=String(p.filter||'all').toLowerCase();
  if(!['all','approved','pending-payment','pending-review','rejected'].includes(filter))throw new Error('Invalid export filter.');
  const sh=sheet_(CFG.REG_SHEET,REG_HEADERS),last=sh.getLastRow();
  const rows=last>1?sh.getRange(2,1,last-1,REG_HEADERS.length).getValues():[];
  const data=rows.map(rowObject_).filter(r=>{
    if(filter==='approved')return r.status==='Approved';
    if(filter==='pending-payment')return r.paymentStatus==='Pending Verification';
    if(filter==='pending-review')return r.status==='Pending Review'&&r.paymentStatus==='Verified';
    if(filter==='rejected')return r.status==='Rejected'||r.paymentStatus==='Rejected';
    return true;
  }).map(r=>({
    submittedAt:r.submittedAt,participantId:r.registrationId,participantName:r.participantName,
    gender:r.gender,dateOfBirth:r.dateOfBirth,age:r.age,ageCategory:r.ageCategory,
    parish:r.parishName,diocese:r.diocese,country:r.country,state:r.state,district:r.district,
    whatsapp:r.phone,entryType:r.entryType,registrationFee:r.fee,utr:r.utr,
    paymentStatus:r.paymentStatus,registrationStatus:r.status,adminNote:r.adminNote
  }));
  audit_(admin.user,'REGISTRATION_EXPORT',filter,'Exported '+data.length+' participant records; photo and payment-proof files excluded.');
  return {success:true,count:data.length,filter:filter,records:data};
}

function verifyPayment_(p) {
  const admin=requireAdmin_(p.sessionToken),ref=clean_(p.trackingRef,40);
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try {
    const sh=sheet_(CFG.REG_SHEET,REG_HEADERS),last=sh.getLastRow();
    if(last<2)throw new Error('No registrations found.');
    const cell=sh.getRange(2,1,last-1,1).createTextFinder(ref).matchEntireCell(true).findNext();
    if(!cell)throw new Error('Registration record not found.');
    const row=cell.getRow(),r=sh.getRange(row,1,1,REG_HEADERS.length).getValues()[0];
    if(r[19]==='Verified')throw new Error('Payment is already verified.');
    if(r[19]==='Rejected'||r[20]==='Rejected')throw new Error('Rejected registration cannot be verified.');
    if(!r[17])throw new Error('Payment proof file is missing.');
    r[19]='Verified';r[21]=clean_(p.adminNote,500);r[22]=new Date();r[23]=admin.user;
    sh.getRange(row,1,1,REG_HEADERS.length).setValues([r]);
    audit_(admin.user,'PAYMENT_VERIFIED',ref,'Admin manually confirmed bank/UPI credit.');
    return {success:true,registration:rowObject_(r)};
  } finally {lock.releaseLock();}
}

function review_(p) {
  const admin=requireAdmin_(p.sessionToken),ref=clean_(p.trackingRef,40),decision=String(p.decision||'').toLowerCase();
  if(!['approve','reject'].includes(decision))throw new Error('Choose approve or reject.');
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try {
    const sh=sheet_(CFG.REG_SHEET,REG_HEADERS),last=sh.getLastRow();
    if(last<2)throw new Error('No registrations found.');
    const cell=sh.getRange(2,1,last-1,1).createTextFinder(ref).matchEntireCell(true).findNext();
    if(!cell)throw new Error('Registration record not found.');
    const row=cell.getRow(),r=sh.getRange(row,1,1,REG_HEADERS.length).getValues()[0];
    if(decision==='approve') {
      if(r[19]!=='Verified')throw new Error('Verify the payment first. Approval is locked until payment is manually verified.');
      if(r[20]!=='Pending Review')throw new Error('This registration is not awaiting approval.');
      if(!r[1])r[1]=uniqueId_(sh);
      r[20]='Approved';
    } else {
      if(r[20]==='Approved')throw new Error('An approved registration cannot be rejected from this screen.');
      r[19]='Rejected';r[20]='Rejected';
    }
    r[21]=clean_(p.adminNote,500);r[22]=new Date();r[23]=admin.user;
    sh.getRange(row,1,1,REG_HEADERS.length).setValues([r]);
    audit_(admin.user,'REGISTRATION_'+decision.toUpperCase(),ref,r[19]);
    return {success:true,registration:rowObject_(r)};
  } finally {lock.releaseLock();}
}
function uniqueId_(sh) {
  // Sequential Participant IDs: JKJ-CC26-M-001, 002, 003...
  // The Script Property preserves the high-water mark even if an old row is removed.
  const props=PropertiesService.getScriptProperties();
  const last=sh.getLastRow();
  const ids=last>1?sh.getRange(2,2,last-1,1).getDisplayValues().flat():[];
  let highest=Number(props.getProperty('SS26_LAST_PARTICIPANT_SEQUENCE')||0);
  ids.forEach(value=>{
    const match=String(value||'').match(/^JKJ-CC26-M-(\d+)$/);
    if(match)highest=Math.max(highest,Number(match[1]));
  });
  const next=highest+1;
  if(!Number.isSafeInteger(next)||next<1)throw new Error('Participant ID sequence is invalid.');
  props.setProperty('SS26_LAST_PARTICIPANT_SEQUENCE',String(next));
  return CFG.PREFIX+String(next).padStart(3,'0');
}
function normalizeDobValue_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const s=String(value==null?'':value).trim();
  if (/^\\d{4}-\\d{2}-\\d{2}$/.test(s)) {
    try { calculateAgeCategory_(s); return s; } catch (ignore) { return ''; }
  }
  return '';
}
function rowObject_(r) {
  const d=r[2] instanceof Date?r[2]:new Date(r[2]);
  const dob=normalizeDobValue_(r[25]);
  let ageInfo=null;
  if(dob)try{ageInfo=calculateAgeCategory_(dob);}catch(ignore){}
  const gender=['Male','Female'].includes(String(r[24]||'').trim())?String(r[24]).trim():'Needs verification';
  return {trackingRef:String(r[0]||''),registrationId:String(r[1]||''),submittedAt:isNaN(d.getTime())?'':Utilities.formatDate(d,Session.getScriptTimeZone(),'dd-MMM-yyyy hh:mm a'),
    participantName:String(r[3]||''),parishName:String(r[4]||''),diocese:String(r[5]||''),country:String(r[6]||''),state:String(r[7]||''),district:String(r[8]||''),phone:String(r[9]||''),entryType:String(r[10]||''),fee:r[11],utr:String(r[12]||''),
    photoUrl:String(r[14]||''),originalPhotoUrl:String(r[16]||''),paymentProofUrl:String(r[18]||''),paymentStatus:String(r[19]||''),status:String(r[20]||''),adminNote:String(r[21]||''),gender:gender,dateOfBirth:dob,age:ageInfo?ageInfo.age:'',ageCategory:ageInfo?ageInfo.category:''};
}
function auditCategoryData_(p) {
  requireAdmin_(p.sessionToken);
  const sh=sheet_(CFG.REG_SHEET,REG_HEADERS),last=sh.getLastRow();
  const rows=last>1?sh.getRange(2,1,last-1,REG_HEADERS.length).getValues():[];
  const issues=[];
  rows.forEach((r,i)=>{
    const row=i+2,dob=normalizeDobValue_(r[25]),gender=String(r[24]||'').trim();
    let info=null;if(dob)try{info=calculateAgeCategory_(dob);}catch(ignore){}
    const reasons=[];
    if(!['Male','Female'].includes(gender))reasons.push('Gender requires manual confirmation');
    if(!dob)reasons.push('Date of Birth is invalid or missing');
    if(info&&Number(r[26])!==info.age)reasons.push('Stored age does not match DOB');
    if(info&&String(r[27]||'')!==info.category)reasons.push('Stored category does not match DOB');
    if(reasons.length)issues.push({row:row,trackingRef:String(r[0]||''),participantName:String(r[3]||''),genderValid:['Male','Female'].includes(gender),dateOfBirth:dob,calculatedAge:info?info.age:'',calculatedCategory:info?info.category:'',reasons:reasons});
  });
  return {success:true,total:rows.length,issueCount:issues.length,issues:issues.slice(0,200),truncated:issues.length>200};
}
function repairCategoryData_(p) {
  const admin=requireAdmin_(p.sessionToken);
  if(String(p.confirm||'')!=='true')throw new Error('Explicit confirmation is required before repairing registration category columns.');
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try {
    const sh=sheet_(CFG.REG_SHEET,REG_HEADERS),last=sh.getLastRow();
    if(last<2)return {success:true,repaired:0,genderNeedsConfirmation:0,message:'No registration rows to repair.'};
    const backupName='Registrations_Backup_Category_Repair';
    if(db_().getSheetByName(backupName))throw new Error('A category-repair backup already exists. Review it before another repair.');
    const backup=sh.copyTo(db_()).setName(backupName);
    backup.hideSheet();
    const rows=sh.getRange(2,1,last-1,REG_HEADERS.length).getValues();
    let repaired=0,genderNeedsConfirmation=0,unrepairable=0;
    rows.forEach((r,i)=>{
      const row=i+2,dob=normalizeDobValue_(r[25]);
      if(!dob){unrepairable++;return;}
      let info;try{info=calculateAgeCategory_(dob);}catch(ignore){unrepairable++;return;}
      const rawGender=String(r[24]||'').trim(),gender=['Male','Female'].includes(rawGender)?rawGender:'';
      if(!gender)genderNeedsConfirmation++;
      const note=String(r[21]||'').trim();
      const repairNote=!gender?'Data repair: Gender could not be recovered from the stored value; organiser confirmation required.':'Data repair: Age and category recalculated from Date of Birth.';
      const newNote=note.includes(repairNote)?note:(note?note+' | ':'')+repairNote;
      sh.getRange(row,22).setValue(newNote.slice(0,500));
      sh.getRange(row,25,1,4).setValues([[gender,dob,info.age,info.category]]);
      sh.getRange(row,26).setNumberFormat('@');
      repaired++;
    });
    audit_(admin.user,'CATEGORY_DATA_REPAIR',backupName,'Backup sheet created; repaired '+repaired+' rows; gender confirmation needed for '+genderNeedsConfirmation+' rows; unrepairable DOB rows '+unrepairable+'.');
    return {success:true,repaired:repaired,genderNeedsConfirmation:genderNeedsConfirmation,unrepairable:unrepairable,backupSheet:backupName,message:'Repair complete. Review gender-confirmation records before approving participants.'};
  } finally {lock.releaseLock();}
}
function getEntryPhoto_(p) {
  const admin=requireAdmin_(p.sessionToken);
  const sh=sheet_(CFG.REG_SHEET,REG_HEADERS),last=sh.getLastRow();
  if(last<2)throw new Error('No registrations found.');
  const trackingRef=clean_(p.trackingRef,40);
  const participantId=clean_(p.participantId,60);
  let cell=null;
  if(trackingRef)cell=sh.getRange(2,1,last-1,1).createTextFinder(trackingRef).matchEntireCell(true).findNext();
  else if(participantId)cell=sh.getRange(2,2,last-1,1).createTextFinder(participantId).matchEntireCell(true).findNext();
  else throw new Error('Tracking Reference or Participant ID is required.');
  if(!cell)throw new Error('Registration record not found.');
  const row=sh.getRange(cell.getRow(),1,1,REG_HEADERS.length).getValues()[0];
  const photoId=String(row[13]||'');
  if(!photoId)throw new Error('Participant photo is not available for this registration.');
  const file=DriveApp.getFileById(photoId),blob=file.getBlob();
  const bytes=blob.getBytes();
  if(!bytes.length||bytes.length>CFG.MAX_FILE_BYTES)throw new Error('Participant photo is missing or exceeds the permitted size.');
  const mimeType=blob.getContentType()||file.getMimeType();
  if(!/^image\/(jpeg|png|webp|heic)$/i.test(mimeType))throw new Error('Stored participant file is not a supported image.');
  audit_(admin.user,'PARTICIPANT_PHOTO_VIEWED',String(row[0]||''),'Authorised admin viewed the private participant photo.');
  return {success:true,photoBase64:Utilities.base64Encode(bytes),mimeType:mimeType};
}


const SITE_SETTING_FIELDS = {
  registrationFee: {key:'Registration Fee',label:'Registration Fee',max:20},
  registrationOpens: {key:'Registration Opens',label:'Registration Opens',max:80},
  registrationCloses: {key:'Registration Closes',label:'Registration Closes',max:80},
  videoDeadline: {key:'Video Submission Deadline',label:'Video Submission Deadline',max:80},
  resultsDate: {key:'Results Announcement',label:'Results Announcement',max:80},
  participation: {key:'Participation',label:'Participation',max:300},
  rulesSummary: {key:'Rules Summary',label:'Rules Summary',max:2000},
  prizeDetails: {key:'Prize Details',label:'Prize Details',max:1200},
  submissionInstructions: {key:'Submission Instructions',label:'Submission Instructions',max:1200},
  contactEmail: {key:'Contact Email',label:'Contact Email',max:160},
  contactWhatsApp: {key:'Contact WhatsApp',label:'Contact WhatsApp',max:40}
};
function readSiteSettings_() {
  const sh=sheet_('Settings',SETTINGS_HEADERS),last=sh.getLastRow(),out={};
  if(last>1){
    const rows=sh.getRange(2,1,last-1,2).getDisplayValues();
    rows.forEach((r,i)=>{
      const key=String(r[0]||''),value=String(r[1]||'');
      if(key==='Registration Fee'){
        if(Number(value)!==300)sh.getRange(i+2,2).setValue(300);
        out[key]='300';
      } else out[key]=value;
    });
  }
  if(!out['Registration Fee']){
    sh.appendRow(['Registration Fee',300,'INR per individual entry — fixed event fee']);
    out['Registration Fee']='300';
  }
  return out;
}
function publicSiteSettings_() {
  const raw=readSiteSettings_(),out={};
  Object.keys(SITE_SETTING_FIELDS).forEach(k=>{const key=SITE_SETTING_FIELDS[k].key;if(raw[key]!==undefined)out[k]=raw[key];});
  return out;
}
function manageSiteSettings_(p) {
  const admin=requireAdmin_(p.sessionToken),action=String(p.settingsAction||'get').toLowerCase();
  if(action==='get')return {success:true,settings:publicSiteSettings_()};
  if(action!=='save')throw new Error('Unknown settings action.');
  const sh=sheet_('Settings',SETTINGS_HEADERS),last=sh.getLastRow(),rows=last>1?sh.getRange(2,1,last-1,3).getValues():[];
  const incoming=p.settings||{},changed=[];
  Object.keys(SITE_SETTING_FIELDS).forEach(k=>{
    if(!Object.prototype.hasOwnProperty.call(incoming,k))return;
    const meta=SITE_SETTING_FIELDS[k],value=clean_(incoming[k],meta.max);
    if(k==='registrationFee'&&value&&!/^\d{1,7}(\.\d{1,2})?$/.test(value))throw new Error('Registration fee must be a valid amount.');
    if(k==='contactEmail'&&value&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))throw new Error('Enter a valid contact email.');
    const idx=rows.findIndex(r=>String(r[0])===meta.key);
    if(idx>=0){sh.getRange(idx+2,2).setValue(value);if(!String(rows[idx][2]||''))sh.getRange(idx+2,3).setValue('Managed from Admin Panel');}
    else sh.appendRow([meta.key,value,'Managed from Admin Panel']);
    changed.push(meta.key);
  });
  audit_(admin.user,'SITE_SETTINGS_UPDATED','PUBLIC_SITE',changed.join(', '));
  return {success:true,settings:publicSiteSettings_(),updated:changed};
}


function audit_(user,action,id,details){try{db_().getSheetByName(CFG.AUDIT_SHEET).appendRow([new Date(),user,action,id,details]);}catch(ignore){}}
function changePassword_(p) {
  const admin=requireAdmin_(p.sessionToken),props=PropertiesService.getScriptProperties(),cur=String(p.currentPassword||''),next=String(p.newPassword||'');
  if(next.length<CFG.MIN_PASSWORD)throw new Error('New password must contain at least 12 characters.');
  if(!equal_(hash_(cur,props.getProperty('ADMIN_SALT')),props.getProperty('ADMIN_HASH')))throw new Error('Current password is incorrect.');
  const salt=Utilities.getUuid()+Utilities.getUuid();props.setProperties({ADMIN_SALT:salt,ADMIN_HASH:hash_(next,salt),SESSION_VERSION:String(Number(props.getProperty('SESSION_VERSION')||'1')+1)});
  audit_(admin.user,'PASSWORD_CHANGED','ADMIN','');return {success:true,message:'Password changed. Please log in again.'};
}
function logout_(p){const t=String(p.sessionToken||'');if(t)CacheService.getScriptCache().remove('SS26_SESSION_'+t);return {success:true};}
function hash_(pass,salt){let v=String(salt)+'|'+String(pass);for(let i=0;i<CFG.HASH_ROUNDS;i++)v=Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,v,Utilities.Charset.UTF_8));return v;}
function equal_(a,b){a=String(a||'');b=String(b||'');if(a.length!==b.length)return false;let d=0;for(let i=0;i<a.length;i++)d|=a.charCodeAt(i)^b.charCodeAt(i);return d===0;}
function safe_(e){return String(e&&e.message||'Unexpected server error.').slice(0,300);}
