/**
 * STAR SINGERS 2026 — Google Apps Script backend
 * Separate database and Drive storage. Never reuse CAROLIA IDs or credentials.
 *
 * First run setupStarSingersBackend() from the Apps Script editor.
 * Then set ADMIN_USER and ADMIN_PASSWORD in Script Properties and run
 * initializeStarSingersAdmin() once.
 */
const CFG = {
  PREFIX: 'JKJ-CC26-M-',
  SESSION_TTL: 21600,
  HASH_ROUNDS: 3000,
  MIN_PASSWORD: 12,
  MAX_FILE_BYTES: 3 * 1024 * 1024,
  REG_SHEET: 'Registrations',
  NOTICE_SHEET: 'Notices',
  AUDIT_SHEET: 'AuditLog'
};
const REG_HEADERS = [
  'Tracking Ref','Participant ID','Submitted At','Participant Name','Own Parish',
  'Own Diocese','Residence Country','State / Province','District / Region',
  'WhatsApp Number','Entry Type','Registration Fee','UTR / Transaction ID',
  'Participant Photo Drive ID','Participant Photo Drive URL','Original Photo Drive ID','Original Photo Drive URL',
  'Payment Proof Drive ID','Payment Proof Drive URL','Payment Status',
  'Registration Status','Admin Note','Reviewed At','Reviewed By'
];
const NOTICE_HEADERS = ['Notice ID','Created At','Updated At','Title','Body','Publish Date','Status','Updated By'];
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
  const notices = ss.insertSheet(CFG.NOTICE_SHEET);
  notices.getRange(1,1,1,NOTICE_HEADERS.length).setValues([NOTICE_HEADERS]).setFontWeight('bold');
  notices.setFrozenRows(1);
  const audit = ss.insertSheet(CFG.AUDIT_SHEET);
  audit.getRange(1,1,1,AUDIT_HEADERS.length).setValues([AUDIT_HEADERS]).setFontWeight('bold');
  audit.setFrozenRows(1);
  const settings=ss.insertSheet('Settings');
  settings.getRange(1,1,1,SETTINGS_HEADERS.length).setValues([SETTINGS_HEADERS]).setFontWeight('bold');
  settings.getRange(2,1,6,3).setValues([
    ['Event Name','NAKSHATHRA GAYAKAR – STAR SINGERS 2026','Official competition title'],
    ['Registration Fee',500,'INR per individual entry'],
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
    ['=COUNTA(Registrations!A2:A)'],['=COUNTIF(Registrations!T2:T,"Pending Verification")'],['=COUNTIF(Registrations!U2:U,"Pending Review")'],['=COUNTIF(Registrations!U2:U,"Approved")'],['=COUNTIF(Registrations!U2:U,"Rejected")'],['=SUMIFS(Registrations!L2:L,Registrations!T2:T,"Verified",Registrations!U2:U,"Approved")']
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
  Logger.log('Keep these URLs private. Set ADMIN_USER and ADMIN_PASSWORD in Script Properties next.');
  return {spreadsheetUrl:ss.getUrl(),driveFolderUrl:root.getUrl()};
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
  if(action==='notices') {
    const payload=JSON.stringify({type:'SS26_PUBLIC_NOTICES',notices:publicNotices_()}).replace(/</g,'\\u003c');
    return HtmlService.createHtmlOutput('<!doctype html><html><body><script>window.top.postMessage('+payload+',"*");</script></body></html>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
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
      case 'verifypayment': out=verifyPayment_(p); break;
      case 'reviewregistration': out=review_(p); break;
      case 'adminnotices': out=manageNotices_(p); break;
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
function sheet_(name,headers){const s=db_().getSheetByName(name);if(!s)throw new Error('Missing sheet: '+name);const h=s.getRange(1,1,1,headers.length).getDisplayValues()[0];if(headers.some((v,i)=>h[i]!==v))throw new Error('Sheet headers do not match. No data was changed.');return s;}
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
  const phone=String(p.phone||'').trim(),utr=clean_(p.utr,100);
  if(!name||!parish||!diocese||!country||!state||!district||!phone)throw new Error('Complete all required fields.');
  if(!/^\+[1-9]\d{6,14}$/.test(phone.replace(/[\s()-]/g,'')))throw new Error('Enter WhatsApp number with country code, e.g. +91XXXXXXXXXX.');
  if(String(p.feeConsent)!=='true')throw new Error('Registration fee consent is required.');
  if(Number(p.fee)!==500)throw new Error('Registration fee must be ₹500.');
  const photo=decodeFile_(p.photo,'Participant Photo');
  const originalPhoto=decodeFile_(p.originalPhoto||p.photo,'Original Participant Photo');
  const proof=decodeFile_(p.paymentProof,'Payment Proof');
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  let photoSaved=null,originalSaved=null,proofSaved=null;
  try {
    const sh=sheet_(CFG.REG_SHEET,REG_HEADERS);
    const ref='SS26-P'+Utilities.getUuid().replace(/-/g,'').slice(0,8).toUpperCase();
    photoSaved=savePrivate_(folder_('SS26_PHOTOS_FOLDER_ID'),photo,ref,'CROPPED');
    originalSaved=savePrivate_(folder_('SS26_ORIGINALS_FOLDER_ID'),originalPhoto,ref,'ORIGINAL');
    proofSaved=savePrivate_(folder_('SS26_PROOFS_FOLDER_ID'),proof,ref,'PAYMENT');
    const now=new Date();
    sh.appendRow([ref,'',now,name,parish,diocese,country,state,district,phone,'Individual / Single Entry',500,utr,
      photoSaved.id,photoSaved.url,originalSaved.id,originalSaved.url,proofSaved.id,proofSaved.url,'Pending Verification','Pending Review','','','']);
    const row=sh.getLastRow();sh.getRange(row,3).setNumberFormat('dd-mmm-yyyy hh:mm:ss');
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
    registrations:newest.slice(0,100).map(rowObject_),auditLogs:auditLogs,notices:adminNotices_()};
}
function search_(p) {
  requireAdmin_(p.sessionToken);const q=String(p.query||'').trim().toLowerCase();if(!q)throw new Error('Enter Registration ID, tracking reference, name or WhatsApp number.');
  const sh=sheet_(CFG.REG_SHEET,REG_HEADERS),last=sh.getLastRow(),rows=last>1?sh.getRange(2,1,last-1,REG_HEADERS.length).getValues():[];
  const found=rows.filter(r=>r.join(' ').toLowerCase().includes(q)).reverse().slice(0,100);
  return {success:true,count:found.length,registrations:found.map(rowObject_)};
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
function rowObject_(r) {
  const d=r[2] instanceof Date?r[2]:new Date(r[2]);
  return {trackingRef:String(r[0]||''),registrationId:String(r[1]||''),submittedAt:isNaN(d.getTime())?'':Utilities.formatDate(d,Session.getScriptTimeZone(),'dd-MMM-yyyy hh:mm a'),
    participantName:String(r[3]||''),parishName:String(r[4]||''),diocese:String(r[5]||''),country:String(r[6]||''),state:String(r[7]||''),district:String(r[8]||''),phone:String(r[9]||''),entryType:String(r[10]||''),fee:r[11],utr:String(r[12]||''),
    photoUrl:String(r[14]||''),originalPhotoUrl:String(r[16]||''),paymentProofUrl:String(r[18]||''),paymentStatus:String(r[19]||''),status:String(r[20]||''),adminNote:String(r[21]||'')};
}
function manageNotices_(p) {
  const admin=requireAdmin_(p.sessionToken),action=String(p.noticeAction||'list').toLowerCase(),sh=sheet_(CFG.NOTICE_SHEET,NOTICE_HEADERS);
  if(action==='list')return {success:true,notices:adminNotices_()};
  if(action==='save') {
    const id=clean_(p.noticeId,40),title=clean_(p.title,180),body=clean_(p.body,5000),date=clean_(p.publishDate,40),status=String(p.status||'Draft');
    if(!title||!body||!['Draft','Published','Archived'].includes(status))throw new Error('Enter title, body and valid status.');
    const last=sh.getLastRow(),rows=last>1?sh.getRange(2,1,last-1,NOTICE_HEADERS.length).getValues():[];
    const idx=rows.findIndex(r=>String(r[0])===id);
    const now=new Date(),nid=id||('NOTICE-'+Utilities.getUuid().slice(0,8).toUpperCase());
    const row=[nid,idx>=0?rows[idx][1]:now,now,title,body,date,status,admin.user];
    if(idx>=0)sh.getRange(idx+2,1,1,row.length).setValues([row]);else sh.appendRow(row);
    audit_(admin.user,'NOTICE_SAVED',nid,status);return {success:true,notices:adminNotices_()};
  }
  if(action==='delete') {
    const id=clean_(p.noticeId,40),last=sh.getLastRow(),rows=last>1?sh.getRange(2,1,last-1,NOTICE_HEADERS.length).getValues():[];
    const idx=rows.findIndex(r=>String(r[0])===id);if(idx<0)throw new Error('Notice not found.');
    sh.deleteRow(idx+2);audit_(admin.user,'NOTICE_DELETED',id,'');return {success:true,notices:adminNotices_()};
  }
  throw new Error('Unknown notice action.');
}
function adminNotices_() {
  const sh=sheet_(CFG.NOTICE_SHEET,NOTICE_HEADERS),last=sh.getLastRow();
  return last<2?[]:sh.getRange(2,1,last-1,NOTICE_HEADERS.length).getValues().reverse().map(r=>({id:String(r[0]),title:String(r[3]),body:String(r[4]),publishDate:String(r[5]||''),status:String(r[6])}));
}
function publicNotices_(){return adminNotices_().filter(n=>n.status==='Published').map(n=>({date:n.publishDate,title:n.title,summary:n.body.slice(0,220),content:n.body,category:'Official Notice'}));}
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
