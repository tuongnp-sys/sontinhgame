/**
 * @param {object} balance
 * @param {number} level
 */
export function getLevelConfig(balance, level) {
  const lv = balance.levels?.[String(level)] ?? balance.levels?.['1'] ?? {};
  const wave = balance.intensityWave ?? {};
  return {
    sessionDuration: lv.sessionDuration ?? balance.sessionDuration,
    acts: lv.acts ?? balance.acts,
    waterRiseMul: lv.waterRiseMul ?? 1,
    noteSpeedMul: lv.noteSpeedMul ?? 1,
    initialWater: lv.initialWater ?? balance.initialWater,
    poisonSpawnChance: lv.poisonSpawnChance ?? balance.poisonSpawnChance,
    calmSeconds: lv.calmSeconds ?? wave.calm ?? 9,
    climaxWaterMul: lv.climaxWaterMul ?? wave.climaxWaterMul ?? 1.3,
    climaxBpmMul: lv.climaxBpmMul ?? wave.climaxBpmMul ?? 1.08,
    calmWaterMul: lv.calmWaterMul ?? wave.calmWaterMul ?? 0.4,
    calmBpmMul: lv.calmBpmMul ?? wave.calmBpmMul ?? 0.82,
    phaseBpmMulBoost: lv.phaseBpmMulBoost ?? 1,
    hitWindowPerfect: lv.hitWindowPerfect ?? balance.hitWindowPerfect,
    hitWindowGreat: lv.hitWindowGreat ?? balance.hitWindowGreat,
    hitWindowGood: lv.hitWindowGood ?? balance.hitWindowGood,
    invasionSpeedMul: lv.invasionSpeedMul ?? 1,
    invasionIntervalMul: lv.invasionIntervalMul ?? 1,
    invasionCountMul: lv.invasionCountMul ?? 1,
    invasionPoolMul: lv.invasionPoolMul ?? 1,
    rain: lv.rain ?? false,
    stormIntensity: lv.stormIntensity ?? 1,
    lightning: lv.lightning ?? false,
    charmThrow: lv.charmThrow ?? false,
    kingHungObserver: lv.kingHungObserver ?? false,
    isFinalLevel: lv.isFinalLevel ?? false,
    label: lv.label ?? `Level ${level}`,
  };
}

export const MAX_GAME_LEVEL = 3;
