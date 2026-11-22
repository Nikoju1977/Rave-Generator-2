'use strict';
/* Browser smoke checks actual PCM content, not just a button click. */
const assert=require('node:assert/strict');
const {spawn,execFileSync}=require('node:child_process');
const {readFile,mkdtemp,rm}=require('node:fs/promises');
const os=require('node:os'),path=require('node:path'),http=require('node:http');
function readHttp(url){
 return new Promise((resolve,reject)=>{
  http.get(url,response=>{
   let content='';response.setEncoding('utf8');
   response.on('data',chunk=>content+=chunk);
   response.on('end',()=>{
    try{resolve({status:response.statusCode,text:content})}catch(error){reject(error)}
   });
   response.on('error',reject);
  }).on('error',reject);
 });
}
const port=19865,base='http://127.0.0.1:'+port;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function poll(fn,label,timeout=30000){
 let lastError;const start=Date.now();
 while(Date.now()-start<timeout){try{const v=await fn();if(v)return v;}catch(e){lastError=e;}await sleep(150)}
 throw Error('Timeout '+label+(lastError?': '+lastError.message:''));
}
function browserBin(){
 if(process.env.CHROME_BIN)return process.env.CHROME_BIN;
 for(const bin of ['google-chrome','google-chrome-stable','chromium','chromium-browser']){
  try{return execFileSync('which',[bin],{encoding:'utf8'}).trim();}catch{}
 }
 throw Error('No Chromium');
}
async function main(){
 const tmp=await mkdtemp(path.join(os.tmpdir(),'rave-generator-ci-'));let server,chrome,ws,seq=0;let stderr='';
 const pending=new Map(),exceptions=[];
 try{
  server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1','--directory','.'],{stdio:['ignore','ignore','pipe']});
  server.stderr.on('data',x=>stderr+=String(x).slice(-300));
  await poll(async()=>(await readHttp(base+'/')).status===200,'site server');
  chrome=spawn(browserBin(),['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
   '--no-first-run','--disable-background-networking','--autoplay-policy=no-user-gesture-required',
   '--remote-debugging-port=0','--remote-allow-origins=*','--user-data-dir='+path.join(tmp,'profile'),'about:blank'],{stdio:['ignore','ignore','pipe']});
  chrome.stderr.on('data',x=>stderr+=String(x).slice(-300));
  const portDev=await poll(async()=>Number((await readFile(path.join(tmp,'profile','DevToolsActivePort'),'utf8')).split('\n')[0]),'Chromium DevTools');
  const tabs=JSON.parse((await readHttp('http://127.0.0.1:'+portDev+'/json/list')).text);
  const page=tabs.find(x=>x.type==='page');assert.ok(page?.webSocketDebuggerUrl,'Chrome page missing');
  ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  ws.addEventListener('message',event=>{
   const m=JSON.parse(event.data);
   if(m.method==='Runtime.exceptionThrown')exceptions.push(m.params?.exceptionDetails?.exception?.description||'Browser exception');
   if(!m.id||!pending.has(m.id))return;
   const d=pending.get(m.id);pending.delete(m.id);m.error?d.reject(Error(JSON.stringify(m.error))):d.resolve(m.result);
  });
  function call(method,params={}){
   const id=++seq;
   return new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{pending.delete(id);reject(Error('Chrome command timeout '+method));},18000);
    pending.set(id,{resolve:v=>{clearTimeout(timeout);resolve(v)},reject:e=>{clearTimeout(timeout);reject(e)}});
    ws.send(JSON.stringify({id,method,params}));
   });
  }
  async function evaluate(expression){
   const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
   if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
   return r.result?.value;
  }
  const wait=(expression,label,time=30000)=>poll(()=>evaluate(expression),label,time);
  const chooseFile=json=>'(()=>{const input=document.querySelector("#projectInput"),d=new DataTransfer();'+
   'd.items.add(new File(['+JSON.stringify(json)+'],"rave-project.json",{type:"application/json"}));'+
   'input.files=d.files;input.dispatchEvent(new Event("change",{bubbles:true}));return true;})()';
  await call('Page.enable');await call('Runtime.enable');
  await call('Page.navigate',{url:base+'/'});
  await wait('document.readyState==="complete"&&document.querySelector("#wavBtn")&&document.querySelector("#saveProjectBtn")','groovebox initialized');
  await evaluate('(()=>{const real=URL.createObjectURL.bind(URL);URL.createObjectURL=blob=>{window.__lastBlob=blob;return real(blob)};document.querySelector("#saveProjectBtn").click();return true})()');
  const project=await evaluate('window.__lastBlob.text().then(JSON.parse)');
  assert.ok(Array.isArray(project.patterns)&&project.patterns.length===8,'8 patterns in real export');
  const initialTempo=Number(await evaluate('document.querySelector("#bpmInput").value'));
  const candidate={...project,bpm:175};
  await evaluate('window.confirm=()=>false;true');
  await evaluate(chooseFile(JSON.stringify(candidate)));
  await wait('document.querySelector("#toast").textContent.includes("Import annulé")','cancel import');
  assert.equal(Number(await evaluate('document.querySelector("#bpmInput").value')),initialTempo,'Cancelled import must not replace project');
  await evaluate('window.confirm=()=>true;true');
  await evaluate(chooseFile(JSON.stringify(candidate)));
  await wait('Number(document.querySelector("#bpmInput").value)===175','successful project import');
  await evaluate('(()=>{window.__lastBlob=null;document.querySelector("#exportBars").value="4";document.querySelector("#wavBtn").click();return true})()');
  await wait('window.__lastBlob?.type==="audio/wav"&&window.__lastBlob.size>100000&&document.querySelector("#wavBtn").disabled===false','PCM WAV rendered',55000);
  const wav=await evaluate(`window.__lastBlob.arrayBuffer().then(buffer=>{
    const v=new DataView(buffer);
    const str=(p,n)=>String.fromCharCode(...new Uint8Array(buffer,p,n));
    let nonzero=0,peak=0;
    for(let i=44;i+2<v.byteLength;i+=512){const sample=Math.abs(v.getInt16(i,true));if(sample>0)nonzero++;if(sample>peak)peak=sample;}
    return {riff:str(0,4),wave:str(8,4),fmt:str(12,4),data:str(36,4),
      channels:v.getUint16(22,true),sampleRate:v.getUint32(24,true),
      bitDepth:v.getUint16(34,true),dataBytes:v.getUint32(40,true),
      fileBytes:v.byteLength,nonzero,peak};
  })`);
  assert.equal(wav.riff,'RIFF');assert.equal(wav.wave,'WAVE');assert.equal(wav.fmt,'fmt ');assert.equal(wav.data,'data');
  assert.equal(wav.channels,2,'stereo required');assert.equal(wav.sampleRate,44100);assert.equal(wav.bitDepth,16);
  assert.equal(wav.fileBytes,44+wav.dataBytes,'RIFF data size agrees');
  assert.ok(wav.nonzero>50&&wav.peak>50,'WAV export must contain real audible PCM samples: '+JSON.stringify(wav));
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:3,mobile:true});
  const mobile=await evaluate('(()=>{const btn=document.querySelector("#wavBtn").getBoundingClientRect();return {width:btn.width,height:btn.height,intersects:btn.right>0&&btn.left<innerWidth};})()');
  assert.equal(mobile.intersects,true,'WAV export button present in mobile viewport');
  assert.deepEqual(exceptions,[],'No unhandled JavaScript error');
  console.log('PASS Rave 2 Chromium: confirmed import, real WAV PCM stereo 44.1 kHz and nonzero signal '+JSON.stringify({nonzero:wav.nonzero,peak:wav.peak,bytes:wav.fileBytes}));
 }catch(error){throw Error(error.message+(stderr?'\nRunner logs: '+stderr.slice(-950):''));}
 finally{try{ws?.close()}catch{}try{chrome?.kill('SIGKILL')}catch{}try{server?.kill('SIGTERM')}catch{}await sleep(300);await rm(tmp,{recursive:true,force:true,maxRetries:6,retryDelay:200}).catch(()=>{});}
}
main().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
