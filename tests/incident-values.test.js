import test from 'node:test';
import assert from 'node:assert/strict';
import {validateIncident} from '../src/live/incident-values.js';
const record={id:'test',environmentId:1,source:'MANUAL',status:'OPEN',title:'Manual record',service:'frontend',occurredAt:'2026-11-01T00:00:00Z'};
test('accepts manual records, rejects another environment and fabricated detection states',()=>{
 assert.equal(validateIncident(record,1),record);
 for(const change of [{environmentId:2},{source:'ML'},{status:'DETECTED'},{occurredAt:'invalid'}]) assert.throws(()=>validateIncident({...record,...change},1));
 assert.equal(validateIncident({...record,status:'RESOLVED'},1).status,'RESOLVED');
});
