import {test} from 'node:test';
import assert from 'node:assert/strict';
import {incidents,findIncident,incidentRange,incidentHref,logHref,matchesIncidentLog,formatTime} from '../src/incidents.js';
import {logRows} from '../src/logs.js';
import {routeHref} from '../src/styles.js';
test('all incident destinations preserve identity and time context',()=>{
 assert.equal(new Set(incidents.map(i=>incidentHref(i.id))).size,7);
 for(const incident of incidents){
  assert.equal(findIncident(incident.id),incident);
  assert.equal(new URLSearchParams(logHref(incident.id).split('?')[1]).get('incident'),incident.id);
  const range=incidentRange(incident);
  assert.equal(formatTime(range.start),incident.start);
  assert.equal(range.end-range.start,incident.duration*1000);
 }
 assert.equal(findIncident('missing'),undefined);
 assert.equal(routeHref('B4-Incident.dc.html?id=INC-0141'),'#B4-Incident?id=INC-0141');
});
test('related logs include only incident services and timestamps, including boundaries',()=>{
 const incident=findIncident('INC-0142');
 const rows=logRows.filter(row=>matchesIncidentLog(incident,row));
 assert.equal(rows.length,10);
 assert.ok(rows.every(row=>row[3]!=='checkoutservice'));
 assert.equal(logRows.filter(row=>matchesIncidentLog(findIncident('INC-0141'),row)).length,0);
 for(const offset of [-1,0,incident.duration*1000,incident.duration*1000+1]){
  const time=new Date(incidentRange(incident).start+offset).toISOString();
  assert.equal(matchesIncidentLog(incident,['','','','frontend',`ts=${time}`]),offset>=0&&offset<=incident.duration*1000);
 }
});
