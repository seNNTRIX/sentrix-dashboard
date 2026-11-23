import test from 'node:test';
import assert from 'node:assert/strict';
import {lastDetectedWindow,validateIncident} from '../src/live/incident-values.js';
const record={id:'test',environmentId:1,source:'MANUAL',status:'OPEN',title:'Manual record',service:'frontend',occurredAt:'2026-11-01T00:00:00Z'};
test('accepts manual records, rejects another environment and fabricated detection states',()=>{
 assert.equal(validateIncident(record,1),record);
 assert.equal(validateIncident({...record,source:'AUTOMATIC'},1).source,'AUTOMATIC');
 for(const change of [{environmentId:2},{source:'ML'},{status:'DETECTED'},{occurredAt:'invalid'}]) assert.throws(()=>validateIncident({...record,...change},1));
 assert.equal(validateIncident({...record,status:'RESOLVED'},1).status,'RESOLVED');
});

test('home retains an observed anomaly across recovery and links the matching incident and analysis',()=>{
 const range={from:'2026-11-24T07:00:00Z',to:'2026-11-24T07:05:00Z'};
 const alarm={windowEnd:'2026-11-24T07:03:00Z',decision:'ANOMALY',incidentId:'A',jobId:'first'};
 const newer={...alarm,incidentId:'B',jobId:'later',windowEnd:'2026-11-24T07:04:00Z'};
 const windows=[{...alarm,windowEnd:'2026-11-24T07:06:00Z'}, {...alarm,decision:'NORMAL'}, newer,alarm];
 assert.equal(lastDetectedWindow(windows,range),newer);
 assert.equal(lastDetectedWindow(windows,range,'A'),alarm);
 assert.equal(lastDetectedWindow(windows,range,'unrelated'),undefined);
 assert.equal(lastDetectedWindow([{...alarm,windowEnd:range.from}],range),undefined);
});
