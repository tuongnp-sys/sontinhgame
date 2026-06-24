import balance from '../src/data/balance.json';
import disruptorConfig from '../src/data/disruptors.json';
import { GameController } from '../src/core/GameController.js';

const ctrl = new GameController(balance, disruptorConfig);
let ended = false;
let frames = 0;

while (!ended && frames < 60 * 120) {
  const dt = 1 / 60;
  const result = ctrl.update(dt);
  if (frames % 15 === 0) ctrl.handleTap();
  ended = result.ended;
  frames++;
}

const state = ctrl.state;
console.log('frames', frames, 'elapsed', state.elapsed.toFixed(1), 'ended', ended);
console.log('victory', state.isVictory, 'defeat', state.isDefeat, 'gap', state.safetyGap.toFixed(1));
console.log('OK');
