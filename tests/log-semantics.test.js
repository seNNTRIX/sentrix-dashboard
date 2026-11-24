import test from 'node:test';
import assert from 'node:assert/strict';
import {semanticWindow,scopeSemantics,semanticLogLink} from '../src/live/log-semantics.js';

const point={service:'checkoutservice',count:2,x:-1,y:3,text:'timeout | service <SERVICE>',novel:true,distance:.34};
const data={environmentId:1,visibility:'operator',status:'OK',windowEnd:'2026-11-24T02:00:00Z',windowSeconds:30,baseline:{start:100,end:200},novel:{sentences:52,lines:140},services:[
 {service:'checkoutservice',stopped:false,novelSentences:50,novelLines:130},{service:'other',stopped:false,novelSentences:2,novelLines:10},{service:'emailservice',stopped:true,novelSentences:0,novelLines:0}],
 points:[point],baselinePoints:[]};

test('KPI totals cover every sentence in visible services even if the model caps its point list',()=>{
 const scope=scopeSemantics(semanticWindow(data,1,false),['checkoutservice','emailservice']);
 assert.equal(scope.novel,50);assert.equal(scope.lines,130);assert.equal(scope.points.length,1);
 const stopped=scopeSemantics(data,['checkoutservice','emailservice'],'emailservice');
 assert.equal(stopped.services[0].stopped,true);assert.equal(stopped.novel,0);
});

test('absence of a trustworthy analysis is distinct from observed zero, and the public response excludes text',()=>{
 assert.equal(scopeSemantics({status:'UNAVAILABLE'}),null);
 assert.throws(()=>semanticWindow(data,2,false));
 assert.throws(()=>semanticWindow({...data,visibility:'public'},1,true));
 const safe=structuredClone(data);safe.visibility='public';delete safe.points[0].text;
 assert.equal(semanticWindow(safe,1,true).status,'OK');
 assert.equal(semanticWindow({status:'UNAVAILABLE',environmentId:1,visibility:'public'},1,true).status,'UNAVAILABLE');
});

test('operator log navigation pins the actual window and searches an unmasked literal',()=>{
 const args=new URLSearchParams(semanticLogLink({...point,text:'<SERVICE> | retry/checkout: server timeout <ID>'},data.windowEnd).split('?')[1]);
 assert.equal(args.get('service'),point.service);assert.equal(args.get('windowEnd'),data.windowEnd);
 assert.equal(args.get('search'),'retry/checkout: server timeout');
 const masked=new URLSearchParams(semanticLogLink({...point,text:'<SERVICE> <ID>'},data.windowEnd).split('?')[1]);
 assert.equal(masked.has('search'),false);
});
