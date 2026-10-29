import test from 'node:test';
import assert from 'node:assert/strict';
import {volumeRange,validateVolume} from '../src/live/log-volume.js';
const from='2026-10-29T09:00:00Z',to='2026-10-29T09:02:00Z';
const range={from,to,bucketSeconds:60};
const valid=()=>({environmentId:1,service:'frontend',search:'',...range,intervalBounds:'START_EXCLUSIVE_END_INCLUSIVE',dataStatus:'PARTIAL',warnings:[],buckets:[{from,to:'2026-10-29T09:01:00Z',count:0},{from:'2026-10-29T09:01:00Z',to,count:null}]});
test('volume keeps zero distinct from missing and rejects wrong identity and buckets',()=>{
 const data=valid();assert.equal(validateVolume(data,1,'frontend','',range),data);
 for(const change of [{environmentId:2},{service:'other'},{search:'other'},{bucketSeconds:120},{intervalBounds:'OTHER'},{buckets:[]}])
  assert.throws(()=>validateVolume({...valid(),...change},1,'frontend','',range));
 for(const count of [-1,1.2,undefined,Number.MAX_SAFE_INTEGER+1]) {const d=valid();d.buckets[0].count=count;assert.throws(()=>validateVolume(d,1,'frontend','',range));}
 const d=valid();d.buckets[1].from=from;assert.throws(()=>validateVolume(d,1,'frontend','',range));
});
test('volume query bounds support 24 hours and omit only an incomplete final bucket',()=>{
 assert.deepEqual(volumeRange({from,to}),range);
 assert.equal(volumeRange({from,to:'2026-10-30T09:00:00Z'}).bucketSeconds,120);
 assert.equal(volumeRange({from,to:'2026-10-29T09:02:59Z'}).to,to);
 assert.throws(()=>volumeRange({from,to:'2026-10-29T09:00:59Z'}));
});
