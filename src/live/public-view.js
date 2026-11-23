// The read-only gateway marks its HTML. The gateway enforces access independently.
export const publicView = typeof document !== 'undefined' && document.documentElement.dataset.sentrixView === 'public';
export const publicRoutes = new Set(['B1-Overview','B2-ServiceMap','B3-Incidents','B4-Incident','B5-Service','B6-Trace','B7-Logs','B8-Model','C1-Notifications','C2-AlertRules','C3-Settings','C4-Team','C5-Account','C6-Audit','C7-States']);
