export function validateMonitoring(data,id){
 if(data?.environmentId!==id||typeof data.enabled!=='boolean'||!Number.isInteger(data.intervalSeconds)||data.intervalSeconds<30||data.intervalSeconds>3600||!['DISABLED','BLOCKED_MODEL_UNAVAILABLE'].includes(data.executionStatus)||data.modelStatus!=='UNAVAILABLE'||data.lastSuccessfulAt!==null||data.executionStatus!==(data.enabled?'BLOCKED_MODEL_UNAVAILABLE':'DISABLED'))throw new Error('분석 설정 응답이 올바르지 않습니다.');
 return data;
}
export const monitoringLabel=status=>({DISABLED:'비활성화',BLOCKED_MODEL_UNAVAILABLE:'모델 미연결 · 실행 대기'}[status]||'확인 불가');
