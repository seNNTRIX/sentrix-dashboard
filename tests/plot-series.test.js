import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreSamples,scoreY,splitSeries} from '../src/live/plot-series.js';

const points = values => values.map((value,i)=>({t:i*30000,value}));

test('short gaps only join two measured endpoints with a separate guide', () => {
  const samples=points([null,0,1,null,null,.9,null,.4,null]);
  const {runs,bridges}=splitSeries(samples,30000);
  assert.deepEqual(runs, [[samples[1],samples[2]],[samples[5]],[samples[7]]]);
  assert.deepEqual(bridges, [[samples[2],samples[5]],[samples[5],samples[7]]]);
});

test('long gaps, including omitted timestamps, stay open', () => {
  const samples=points([1,null,null,null,.9]);
  for (const input of [samples,[samples[0],samples[4]]]) {
    assert.deepEqual(splitSeries(input,30000), {runs:[[samples[0]],[samples[4]]],bridges:[]});
  }
  assert.deepEqual(splitSeries(points([null,null]),30000), {runs:[],bridges:[]});
});

test('zero and maximum scores are inside the plot and share a linear scale with the threshold', () => {
  assert.equal(scoreY(0,1),148);
  assert.equal(scoreY(1,1),14);
  assert.equal(scoreY(100,100),scoreY(1,1));
  assert.equal(scoreY(.5,1),(scoreY(0,1)+scoreY(1,1))/2);
});

test('overview draws one trend from the real scores, skipping missing windows of any length', () => {
  const samples=points([null,.9,null,null,null,null,0,null,1,null]);
  assert.deepEqual(scoreSamples(samples),[samples[1],samples[6],samples[8]]);
  assert.deepEqual(scoreSamples(points([null,null])),[]);
});
