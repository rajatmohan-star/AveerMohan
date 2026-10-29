/**
 * Formats large numbers with suffixes (k, m, b, t, qa, qi, sx, sp, oc, no, dc)
 * matching the exact notation in the screenshots (e.g. 162.67qa, 597.48m).
 */
export function formatNumber(num: number): string {
  if (num === 0) return '0';
  if (isNaN(num)) return '0';
  if (num < 1000) {
    return num % 1 === 0 ? num.toString() : num.toFixed(1);
  }

  const suffixes = [
    { value: 1e33, symbol: 'dc' },  // Decillion
    { value: 1e30, symbol: 'no' },  // Nonillion
    { value: 1e27, symbol: 'oc' },  // Octillion
    { value: 1e24, symbol: 'sp' },  // Septillion
    { value: 1e21, symbol: 'sx' },  // Sextillion
    { value: 1e18, symbol: 'qi' },  // Quintillion
    { value: 1e15, symbol: 'qa' },  // Quadrillion
    { value: 1e12, symbol: 't' },   // Trillion
    { value: 1e9, symbol: 'b' },    // Billion
    { value: 1e6, symbol: 'm' },    // Million
    { value: 1e3, symbol: 'k' },    // Thousand
  ];

  for (const item of suffixes) {
    if (num >= item.value) {
      const formatted = (num / item.value).toFixed(2);
      return `${formatted.replace(/\.00$/, '')}${item.symbol}`;
    }
  }

  return num.toLocaleString();
}

/**
 * Calculates current level and progress to next level based on accumulated speed
 */
export function calculateLevelAndProgress(speed: number) {
  // Base formula for speed-runner obby: Level scales with log or power of speed
  // At level 1 -> 0 speed
  // At level 75 -> ~1,000,000 speed (1m)
  // At level 150 -> ~1,000,000,000 speed (1b)
  // At level 250 -> ~1,000,000,000,000 speed (1t)
  // At level 400 -> ~1e15 speed (1qa)
  
  // Inverse level function
  let level = 1;
  if (speed > 10) {
    const rawLevel = Math.floor(Math.pow(Math.log10(Math.max(10, speed)), 2.6) * 7.5);
    level = Math.max(1, rawLevel);
  }
  
  // Calculate speed needed for current and next level
  // Reverse: speed needed for level L
  const speedForLevel = (l: number) => {
    if (l <= 1) return 0;
    const logVal = Math.pow(l / 7.5, 1 / 2.6);
    return Math.pow(10, logVal);
  };

  const currentLevelMin = speedForLevel(level);
  const nextLevelMin = speedForLevel(level + 1);
  const range = nextLevelMin - currentLevelMin;
  const progressRatio = range > 0 ? Math.min(1, Math.max(0, (speed - currentLevelMin) / range)) : 0;

  return {
    level,
    progressRatio,
    currentSpeed: speed,
    targetSpeed: nextLevelMin,
  };
}
