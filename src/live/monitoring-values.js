export function validateMonitoring(data,id){
 const status=data?.executionStatus;
 const allowed=!data?.enabled?['DISABLED']:data.modelStatus==='CONFIGURED'
  ?['SCHEDULED','ACTIVATION_REQUIRED','BLOCKED_AUTOMATIC_ANALYSIS_UNAVAILABLE']:['BLOCKED_MODEL_UNAVAILABLE'];
 const last=data?.lastSuccessfulAt;
 if(data?.environmentId!==id||typeof data.enabled!=='boolean'||!Number.isInteger(data.intervalSeconds)||data.intervalSeconds<30||data.intervalSeconds>3600||!['UNAVAILABLE','CONFIGURED'].includes(data.modelStatus)||!allowed.includes(status)||
    !(last===null||(typeof last==='string'&&last.includes('T')&&Number.isFinite(Date.parse(last)))))throw new Error('분석 설정 응답이 올바르지 않습니다.');
 return data;
}
export const monitoringLabel=status=>({DISABLED:'비활성화',SCHEDULED:'주기 분석 예약됨',ACTIVATION_REQUIRED:'설정을 저장하면 주기 분석이 시작됩니다',BLOCKED_AUTOMATIC_ANALYSIS_UNAVAILABLE:'자동 분석 실행 대기',BLOCKED_MODEL_UNAVAILABLE:'모델 미연결 · 실행 대기'}[status]||'확인 불가');
