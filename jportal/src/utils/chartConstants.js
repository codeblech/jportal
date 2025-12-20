/**
 * Chart Configuration Constants
 *
 * Shared constants used across chart components
 */

export const CHART_CONFIG = {
  height: 250,
  margin: { top: 0, right: 10, left: 0, bottom: 20 },
  yAxisDomain: [0, 10],
  yAxisTicks: [0, 2, 4, 6, 8, 10],
};

export const DRAG_CONFIG = {
  chartHeight: 250, // Must match CHART_CONFIG.height
  minSGPA: 0,
  maxSGPA: 10,
  precision: 0.1, // Round to 1 decimal place
};
