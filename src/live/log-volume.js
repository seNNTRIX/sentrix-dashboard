export function volumeRange(range) {
 const start=Date.parse(range.from),end=Date.parse(range.to),seconds=(end-start)/1000;
 if(!Number.isInteger(seconds)||seconds<60||seconds>86400) throw new Error('로그 집계는 1분~24시간 범위에서 조회할 수 있습니다.');
 const bucketSeconds=seconds>43200?120:60;
 const unit=bucketSeconds*1000,alignedStart=Math.ceil(start/unit)*unit,alignedEnd=Math.floor(end/unit)*unit;
 if(alignedStart>=alignedEnd) throw new Error('완성된 1분 구간이 없습니다. 조회 기간을 넓혀 주세요.');
 const iso=t=>new Date(t).toISOString().replace('.000Z','Z');
 return {from:iso(alignedStart),to:iso(alignedEnd),bucketSeconds};
}
export function validateVolume(data,environmentId,service,search,range) {
 const count=(Date.parse(range.to)-Date.parse(range.from))/1000/range.bucketSeconds;
 if(data?.environmentId!==environmentId||data.service!==service||data.search!==search||data.from!==range.from||data.to!==range.to
  ||data.bucketSeconds!==range.bucketSeconds||data.intervalBounds!=='START_EXCLUSIVE_END_INCLUSIVE'
  ||!['AVAILABLE','PARTIAL','NO_DATA'].includes(data.dataStatus)||!Array.isArray(data.buckets)||data.buckets.length!==count||!Array.isArray(data.warnings)) throw new Error('로그 집계 응답 형식이 올바르지 않습니다.');
 data.buckets.forEach((b,i)=>{
  if(Date.parse(b.from)!==Date.parse(range.from)+i*range.bucketSeconds*1000||Date.parse(b.to)!==Date.parse(b.from)+range.bucketSeconds*1000
   ||(b.count!==null&&(!Number.isSafeInteger(b.count)||b.count<0))) throw new Error('로그 집계 구간이나 건수가 올바르지 않습니다.');
 });
 return data;
}
