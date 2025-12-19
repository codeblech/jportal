import React, { useState, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Helper function to recalculate CGPA based on modified SGPA
const recalculateCGPA = (semesterData, modifiedIndex, newSGPA) => {
  const updatedData = semesterData.map((sem, idx) => ({ ...sem }));

  // Update the SGPA and earnedgradepoints for the modified semester
  updatedData[modifiedIndex] = {
    ...updatedData[modifiedIndex],
    sgpa: newSGPA,
    earnedgradepoints: newSGPA * updatedData[modifiedIndex].totalcoursecredit
  };

  // Recalculate CGPA for all semesters from the modified one onwards
  for (let i = 0; i < updatedData.length; i++) {
    let totalGradePoints = 0;
    let totalCredits = 0;

    // Sum up all grade points and credits from semester 1 to current semester
    for (let j = 0; j <= i; j++) {
      totalGradePoints += updatedData[j].earnedgradepoints;
      totalCredits += updatedData[j].totalcoursecredit;
    }

    // Calculate CGPA
    updatedData[i].cgpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
  }

  return updatedData;
};

// Custom dot component that can be dragged
const DraggableDot = ({ cx, cy, payload, index, onDragStart, onDrag, onDragEnd, isDragging }) => {
  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDragStart(index, e.clientY);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    onDragStart(index, touch.clientY);
  };

  return (
    <circle
      cx={cx}
      cy={cy}
      r={isDragging ? 8 : 6}
      fill="var(--chart-1)"
      stroke="white"
      strokeWidth={2}
      style={{
        cursor: "ns-resize",
        transition: isDragging ? "none" : "all 0.2s",
        touchAction: "none",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    />
  );
};

export default function InteractiveGPAChart({ semesterData, onDataChange }) {
  const [chartData, setChartData] = useState(semesterData);
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedIndex: null,
    startY: null,
    startValue: null,
  });
  const chartRef = useRef(null);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }) => {
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
          <p style={{ margin: 0, color: "var(--chart-1)" }}>SGPA: {payload[1]?.value?.toFixed(1)}</p>
          <p style={{ margin: 0, color: "var(--chart-2)" }}>CGPA: {payload[0]?.value?.toFixed(1)}</p>
        </div>
      );
    }
    return null;
  };

  const handleDragStart = (index, clientY) => {
    const semesterValue = chartData[index].sgpa;
    setDragState({
      isDragging: true,
      draggedIndex: index,
      startY: clientY,
      startValue: semesterValue,
    });
  };

  const handleMouseMove = (e) => {
    if (!dragState.isDragging) return;
    handleDrag(e.clientY);
  };

  const handleTouchMove = (e) => {
    if (!dragState.isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    handleDrag(touch.clientY);
  };

  const handleDrag = (clientY) => {
    if (!dragState.isDragging || dragState.draggedIndex === null) return;

    const chartHeight = 250; // Match the chart height
    const deltaY = dragState.startY - clientY;

    // Calculate sensitivity: chart height maps to 0-10 SGPA range
    const sensitivity = 10 / chartHeight;
    const deltaValue = deltaY * sensitivity;

    let newValue = dragState.startValue + deltaValue;

    // Clamp between 0 and 10
    newValue = Math.max(0, Math.min(10, newValue));

    // Round to 1 decimal place (multiples of 0.1)
    newValue = Math.round(newValue * 10) / 10;

    // Recalculate CGPA based on new SGPA
    const updatedData = recalculateCGPA(chartData, dragState.draggedIndex, newValue);
    setChartData(updatedData);

    // Notify parent component of changes
    if (onDataChange) {
      onDataChange(updatedData);
    }
  };

  const handleDragEnd = () => {
    setDragState({
      isDragging: false,
      draggedIndex: null,
      startY: null,
      startValue: null,
    });
  };

  // Add event listeners for drag operations
  React.useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleTouchMove, { passive: false });
      window.addEventListener("touchend", handleDragEnd);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleDragEnd);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleDragEnd);
      };
    }
  }, [dragState.isDragging, handleMouseMove, handleTouchMove]);

  return (
    <div className="mb-4 rounded-lg pb-2 w-full max-w-4xl" ref={chartRef}>
      <div className="mb-2 text-sm text-muted-foreground">
        Drag the SGPA dots (blue) vertically to see how CGPA changes
      </div>
      <div style={{ touchAction: "none", WebkitUserSelect: "none", userSelect: "none" }}>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis
            dataKey="stynumber"
            stroke="var(--muted-foreground)"
            label={{ value: "Semester", position: "bottom", fill: "var(--muted-foreground)" }}
            tickFormatter={(value) => `${value}`}
          />
          <YAxis
            stroke="var(--muted-foreground)"
            domain={[0, 10]}
            ticks={[0, 2, 4, 6, 8, 10]}
            tickFormatter={(value) => value.toFixed(1)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="top" height={36} />

          {/* CGPA Line (non-draggable) - rendered first so it appears behind */}
          <Line
            type="monotone"
            dataKey="cgpa"
            stroke="var(--chart-2)"
            name="CGPA"
            strokeWidth={2}
            dot={{ fill: "var(--chart-2)", r: 4 }}
          />

          {/* SGPA Line with draggable dots - rendered last so dots are on top */}
          <Line
            type="monotone"
            dataKey="sgpa"
            stroke="var(--chart-1)"
            name="SGPA"
            strokeWidth={2}
            dot={(props) => (
              <DraggableDot
                {...props}
                onDragStart={handleDragStart}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                isDragging={dragState.isDragging && dragState.draggedIndex === props.index}
              />
            )}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
      </div>

      {/* Display current values */}
      <div className="mt-4 grid grid-cols-2 gap-2 max-w-2xl mx-auto text-sm">
        {chartData.map((sem, idx) => (
          <div key={idx} className="flex justify-between p-2 rounded bg-muted/50">
            <span className="font-medium">Sem {sem.stynumber}:</span>
            <span>
              SGPA: <span className="font-semibold" style={{ color: "var(--chart-1)" }}>
                {sem.sgpa.toFixed(1)}
              </span>
              {" | "}
              CGPA: <span className="font-semibold" style={{ color: "var(--chart-2)" }}>
                {sem.cgpa.toFixed(1)}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
