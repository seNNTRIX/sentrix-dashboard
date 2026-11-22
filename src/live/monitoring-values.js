export function validateMonitoring(data,id){
 const expected=data?.enabled?(data?.modelStatus==='CONFIGURED'?'BLOCKED_AUTOMATIC_ANALYSIS_UNAVAILABLE':'BLOCKED_MODEL_UNAVAILABLE'):'DISABLED';
 if(data?.environmentId!==id||typeof data.enabled!=='boolean'||!Number.isInteger(data.intervalSeconds)||data.intervalSeconds<30||data.intervalSeconds>3600||!['DISABLED','BLOCKED_MODEL_UNAVAILABLE','BLOCKED_AUTOMATIC_ANALYSIS_UNAVAILABLE'].includes(data.executionStatus)||!['UNAVAILABLE','CONFIGURED'].includes(data.modelStatus)||data.lastSuccessfulAt!==null||data.executionStatus!==expected)throw new Error('분석 설정 응답이 올바르지 않습니다.');
 return data;
}
export const monitoringLabel=status=>({DISABLED:'비활성화',BLOCKED_AUTOMATIC_ANALYSIS_UNAVAILABLE:'모델 연결 설정됨 · 자동 분석 준비 중',BLOCKED_MODEL_UNAVAILABLE:'모델 미연결 · 실행 대기'}[status]||'확인 불가');
