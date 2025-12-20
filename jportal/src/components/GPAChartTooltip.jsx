/**
 * GPAChartTooltip Component
 *
 * Custom tooltip for the GPA chart that displays SGPA and CGPA values
 * Styled to match the application's theme
 */

const GPAChartTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="max-[400px]:text-[0.65rem] max-[540px]:text-xs text-sm"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "4px",
          padding: "4px 8px",
          color: "var(--card-foreground)",
        }}
      >
        <p style={{ margin: 0, color: "var(--chart-1)" }}>
          SGPA: {payload[1]?.value?.toFixed(1)}
        </p>
        <p style={{ margin: 0, color: "var(--chart-2)" }}>
          CGPA: {payload[0]?.value?.toFixed(1)}
        </p>
      </div>
    );
  }
  return null;
};

export default GPAChartTooltip;
