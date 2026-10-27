export const incidentRows = [
      ['INC-0142', 'open', 'frontend → productcatalogservice', 'net', 0.84, 2, '2026-10-27 14:21:30', 635, '14:22:00', ['frontend', 'productcatalogservice']],
      ['INC-0141', 'resolved', 'checkoutservice', 'pod', 0.91, 3, '2026-10-27 13:12:10', 390, '13:12:40', ['checkoutservice']],
      ['INC-0140', 'resolved', 'checkoutservice → paymentservice', 'loss', 0.77, 2, '2026-10-27 10:48:00', 720, '10:48:30', ['checkoutservice', 'paymentservice']],
      ['INC-0139', 'resolved', 'recommendationservice', 'cpu', 0.88, 2, '2026-10-26 16:05:30', 510, '16:06:00', ['recommendationservice']],
      ['INC-0138', 'resolved', 'frontend', 'traffic', 0.72, 5, '2026-10-26 11:20:00', 930, '11:20:30', ['frontend']],
      ['INC-0137', 'resolved', 'cartservice → redis-cart', 'net', 0.81, 3, '2026-10-25 21:42:30', 540, '21:43:00', ['cartservice', 'redis-cart']],
      ['INC-0136', 'resolved', 'currencyservice', 'cpu', 0.69, 4, '2026-10-25 15:10:00', 450, '15:10:30', ['currencyservice']]
    ];
export const faultLabels = {cpu:'CPU saturation',net:'Network delay',loss:'Packet loss',pod:'Pod failure',traffic:'Traffic spike'};
export const statusLabels = {open:'진행 중',ack:'확인함',resolved:'해결됨'};
export const incidents = incidentRows.map(([id,status,target,fault,score,impact,start,duration,detected,services]) => ({id,status,target,fault,score,impact,start,duration,detected,services}));
export function findIncident(id) { return incidents.find(item => item.id === id); }
export function incidentHref(id) { return '#B4-Incident?id='+encodeURIComponent(id); }
export function logHref(id) { return '#B7-Logs?incident='+encodeURIComponent(id); }
export function incidentRange(incident) {
 const start = new Date(incident.start.replace(' ','T')+'+09:00');
 return {start:start.getTime(),end:start.getTime()+incident.duration*1000};
}
export function formatTime(value) { return new Date(value+9*3600000).toISOString().slice(0,19).replace('T',' '); }
export function matchesIncidentLog(incident, row) {
 const timestamp = row[4].match(/ts=(\S+)/)?.[1];
 const time = Date.parse(timestamp); const range = incidentRange(incident);
 return incident.services.includes(row[3]) && time >= range.start && time <= range.end;
}
export function readListState() {
 try { return JSON.parse(sessionStorage.getItem('sentrix-incident-list') || '{}'); } catch { return {}; }
}
