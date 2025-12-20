import { recalculateAllCGPAs } from './gpaCalculations';

/**
 * Configuration for the dancing dots animation
 */
export const ANIMATION_CONFIG = {
  chartAnimationDelay: 1520, // Wait for Recharts initial animation
  duration: 1500, // Total animation duration in ms
  easeOutStartProgress: 0.8, // When to start easing out (80% through)
};

/**
 * Wave parameter ranges for random generation
 */
const WAVE_PARAMS = {
  primaryFrequency: { min: 1.5, max: 3 },
  primaryAmplitude: { min: 0.4, max: 1.0 },
  secondaryFrequency: { min: 2, max: 4 },
  secondaryAmplitude: { min: 0.2, max: 0.3 },
};

/**
 * Generates random wave parameters for each dot in the chart
 * @param {number} count - Number of dots to generate parameters for
 * @returns {Array} Array of wave parameter objects
 */
export const generateWaveParameters = (count) => {
  return Array.from({ length: count }, () => ({
    frequency: WAVE_PARAMS.primaryFrequency.min +
               Math.random() * (WAVE_PARAMS.primaryFrequency.max - WAVE_PARAMS.primaryFrequency.min),
    amplitude: WAVE_PARAMS.primaryAmplitude.min +
               Math.random() * (WAVE_PARAMS.primaryAmplitude.max - WAVE_PARAMS.primaryAmplitude.min),
    phaseOffset: Math.random() * Math.PI * 2,

    frequency2: WAVE_PARAMS.secondaryFrequency.min +
                Math.random() * (WAVE_PARAMS.secondaryFrequency.max - WAVE_PARAMS.secondaryFrequency.min),
    amplitude2: WAVE_PARAMS.secondaryAmplitude.min +
                Math.random() * (WAVE_PARAMS.secondaryAmplitude.max - WAVE_PARAMS.secondaryAmplitude.min),
    phaseOffset2: Math.random() * Math.PI * 2,
  }));
};

/**
 * Calculates the wave offset for a single dot at a given time
 * @param {Object} params - Wave parameters for this dot
 * @param {number} progress - Animation progress (0 to 1)
 * @returns {number} The offset value to apply to SGPA
 */
export const calculateWaveOffset = (params, progress) => {
  // Primary wave
  const time1 = progress * params.frequency * Math.PI * 2;
  const offset1 = Math.sin(time1 + params.phaseOffset) * params.amplitude;

  // Secondary wave for more organic movement
  const time2 = progress * params.frequency2 * Math.PI * 2;
  const offset2 = Math.sin(time2 + params.phaseOffset2) * params.amplitude2;

  // Apply easing at the end for smooth finish
  const easeFactor = progress > ANIMATION_CONFIG.easeOutStartProgress
    ? 1 - ((progress - ANIMATION_CONFIG.easeOutStartProgress) / (1 - ANIMATION_CONFIG.easeOutStartProgress))
    : 1;

  return (offset1 + offset2) * easeFactor;
};

/**
 * Applies wave animation to semester data
 * @param {Array} originalData - Original semester data
 * @param {Array} waveParams - Wave parameters for each dot
 * @param {number} progress - Animation progress (0 to 1)
 * @returns {Array} Updated semester data with animated SGPA values
 */
export const applyWaveAnimation = (originalData, waveParams, progress) => {
  const newData = originalData.map((sem, idx) => {
    const offset = calculateWaveOffset(waveParams[idx], progress);
    const newSGPA = Math.max(0, Math.min(10, sem.sgpa + offset));

    return {
      ...sem,
      sgpa: newSGPA,
      earnedgradepoints: newSGPA * sem.totalcoursecredit
    };
  });

  // Recalculate CGPAs based on new SGPAs
  return recalculateAllCGPAs(newData);
};
