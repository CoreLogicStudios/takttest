import test from 'node:test';
import assert from 'node:assert/strict';
import { shiftSelected, shiftTrainFromHere } from '../lib/board/shift.ts';

test('shiftSelected detects collisions', () => {
  const assignments = [
    { zone_id: 'z1', period_index: 0, train_id: 't1' },
    { zone_id: 'z1', period_index: 1, train_id: 't2' }
  ];
  const result = shiftSelected(assignments, [{ zone_id: 'z1', period_index: 0 }], 1, 5);
  assert.equal(result.moves.length, 0);
  assert.equal(result.collisions.length, 1);
});

test('shiftTrainFromHere moves within bounds', () => {
  const assignments = [{ zone_id: 'z1', period_index: 1, train_id: 't1' }];
  const result = shiftTrainFromHere(assignments, 't1', 1, 1, 5);
  assert.equal(result.collisions.length, 0);
  assert.equal(result.moves[0].toPeriod, 2);
});
