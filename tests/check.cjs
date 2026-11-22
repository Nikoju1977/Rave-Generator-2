'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(script&&script.length>15000,'Standalone audio engine must exist');
new Function(script);
for(const id of ['wavBtn','recordBtn','exportBars','importProjectBtn','projectInput','saveProjectBtn','shareWavBtn']){
 assert(html.includes('id="'+id+'"'),'Required UI control '+id);
}
assert(script.includes("if(!confirm('Remplacer les patterns"),'Import confirmation required');
assert(script.indexOf('const nextSamples={}')<script.indexOf('stop();\n  state=validated;customSamples=nextSamples'),'Decode before mutating project state');
assert(script.includes("return new Uint8Array(bytes)"),'WAV PCM encoder present');
assert(script.includes("new OfflineAudioContext(2"),'True stereo offline render');
assert(script.includes("44+frames*4"),'Live capture WAV PCM encoder present');
const sw=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');
assert(sw.includes('rave-generator-2-v'),'PWA cache is versioned');
console.log('PASS Rave Generator 2: UI controls, script syntax, safe import and WAV engines');
