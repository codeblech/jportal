import React, { useState, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { recalculateCGPA } from "@/utils/gpaCalculations";
import { ANIMATION_CONFIG, generateWaveParameters, applyWaveAnimation } from "@/utils/chartAnimation";
import { CHART_CONFIG, DRAG_CONFIG } from "@/utils/chartConstants";
import DraggableDot from "./DraggableDot";
import GPAChartTooltip from "./GPAChartTooltip";
import { Card } from "@/components/ui/card";

export default function InteractiveGPAChart({ semesterData, onDataChange }) {
  const [chartData, setChartData] = useState(semesterData);
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedIndex: null,
    startY: null,
    startValue: null,
  });
  const [cardDragState, setCardDragState] = useState({
    isDragging: false,
    draggedIndex: null,
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const chartRef = useRef(null);
  const animationFrameRef = useRef(null);
  const originalDataRef = useRef(semesterData);
  const waveParamsRef = useRef(null);

  const handleDragStart = (index, clientY) => {
    // Don't allow dragging during intro animation
    if (isAnimating) return;

    const semesterValue = chartData[index].sgpa;
    setDragState({
      isDragging: true,
      draggedIndex: index,
      startY: clientY,
      startValue: semesterValue,
    });
  };

  const handlePointerMove = (e) => {
    if (!dragState.isDragging) return;
    e.preventDefault();
    handleDrag(e.clientY);
  };

  const handleDrag = (clientY) => {
    if (!dragState.isDragging || dragState.draggedIndex === null) return;

    const deltaY = dragState.startY - clientY;

    // Calculate sensitivity: chart height maps to SGPA range
    const sensitivity = (DRAG_CONFIG.maxSGPA - DRAG_CONFIG.minSGPA) / DRAG_CONFIG.chartHeight;
    const deltaValue = deltaY * sensitivity;

    let newValue = dragState.startValue + deltaValue;

    // Clamp between min and max SGPA
    newValue = Math.max(DRAG_CONFIG.minSGPA, Math.min(DRAG_CONFIG.maxSGPA, newValue));

    // Round to specified precision
    newValue = Math.round(newValue / DRAG_CONFIG.precision) * DRAG_CONFIG.precision;

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

  // Card progress bar drag handlers
  const handleCardDragStart = (index, e) => {
    // Don't allow dragging during intro animation
    if (isAnimating) return;

    setCardDragState({
      isDragging: true,
      draggedIndex: index,
    });

    // Immediately update based on click position
    handleCardDrag(index, e);
  };

  const handleCardDrag = (index, e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));

    // Calculate new SGPA value (0 to 10 range)
    let newValue = percentage * DRAG_CONFIG.maxSGPA;

    // Round to specified precision
    newValue = Math.round(newValue / DRAG_CONFIG.precision) * DRAG_CONFIG.precision;

    // Recalculate CGPA based on new SGPA
    const updatedData = recalculateCGPA(chartData, index, newValue);
    setChartData(updatedData);

    // Notify parent component of changes
    if (onDataChange) {
      onDataChange(updatedData);
    }
  };

  const handleCardPointerMove = (index, e) => {
    if (!cardDragState.isDragging || cardDragState.draggedIndex !== index) return;
    e.preventDefault();
    handleCardDrag(index, e);
  };

  const handleCardDragEnd = () => {
    setCardDragState({
      isDragging: false,
      draggedIndex: null,
    });
  };

  // Add event listeners for drag operations
  React.useEffect(() => {
    if (dragState.isDragging) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handleDragEnd);
      window.addEventListener("pointercancel", handleDragEnd);

      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handleDragEnd);
        window.removeEventListener("pointercancel", handleDragEnd);
      };
    }
  }, [dragState.isDragging, handlePointerMove]);

  // Add event listeners for card drag operations
  React.useEffect(() => {
    if (cardDragState.isDragging) {
      window.addEventListener("pointerup", handleCardDragEnd);
      window.addEventListener("pointercancel", handleCardDragEnd);

      return () => {
        window.removeEventListener("pointerup", handleCardDragEnd);
        window.removeEventListener("pointercancel", handleCardDragEnd);
      };
    }
  }, [cardDragState.isDragging]);

  // Dancing animation on mount to show interactivity
  React.useEffect(() => {
    const startTime = Date.now();

    // Generate random wave parameters for each dot
    if (!waveParamsRef.current) {
      waveParamsRef.current = generateWaveParameters(originalDataRef.current.length);
    }

    const startAnimation = setTimeout(() => {
      setIsAnimating(true);

      const animate = () => {
        const elapsed = Date.now() - startTime - ANIMATION_CONFIG.chartAnimationDelay;

        if (elapsed >= ANIMATION_CONFIG.duration) {
          // Animation complete - reset to original values
          setChartData(originalDataRef.current);
          setIsAnimating(false);
          if (onDataChange) {
            onDataChange(originalDataRef.current);
          }
          return;
        }

        // Apply wave animation
        const progress = elapsed / ANIMATION_CONFIG.duration;
        const updatedData = applyWaveAnimation(originalDataRef.current, waveParamsRef.current, progress);

        setChartData(updatedData);
        if (onDataChange) {
          onDataChange(updatedData);
        }

        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    }, ANIMATION_CONFIG.chartAnimationDelay);

    return () => {
      clearTimeout(startAnimation);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="mb-4 rounded-lg pb-2 w-full max-w-4xl" ref={chartRef}>
      <div style={{ touchAction: "none", WebkitUserSelect: "none", userSelect: "none" }}>
        <ResponsiveContainer width="100%" height={CHART_CONFIG.height}>
          <LineChart data={chartData} margin={CHART_CONFIG.margin}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="stynumber"
              stroke="var(--muted-foreground)"
              label={{ value: "Semester", position: "bottom", fill: "var(--muted-foreground)" }}
              tickFormatter={(value) => `${value}`}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              domain={CHART_CONFIG.yAxisDomain}
              ticks={CHART_CONFIG.yAxisTicks}
              tickFormatter={(value) => value.toFixed(1)}
            />
            <Tooltip content={<GPAChartTooltip />} />
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

      {/* Display current values with interactive progress bars */}
      <div className="mt-4 grid grid-cols-2 gap-3 max-w-2xl mx-auto">
        {chartData.map((sem, idx) => {
          const sgpaPercentage = (sem.sgpa / DRAG_CONFIG.maxSGPA) * 100;
          const cgpaPercentage = (sem.cgpa / DRAG_CONFIG.maxSGPA) * 100;
          const isDraggingThisCard = cardDragState.isDragging && cardDragState.draggedIndex === idx;

          return (
            <div key={idx} className="relative">
              {/* Semester number label */}
              <div className="max-[400px]:text-[0.55rem] max-[460px]:text-[0.65rem] max-[540px]:text-[0.7rem] text-xs text-muted-foreground mb-1 ml-1">
                Sem {sem.stynumber}
              </div>

              {/* Card with progress bars */}
              <Card className="shadow-lg overflow-hidden">
                <div className="space-y-0 p-0">
                  {/* SGPA Progress Bar (Interactive) */}
                  <div
                    className={`relative rounded-t-lg overflow-hidden select-none transition-all ${
                      isDraggingThisCard ? "h-8 opacity-60" : "h-6"
                    }`}
                    style={{
                      cursor: isDraggingThisCard ? "ew-resize" : "pointer",
                      touchAction: "none",
                    }}
                    onPointerDown={(e) => handleCardDragStart(idx, e)}
                    onPointerMove={(e) => handleCardPointerMove(idx, e)}
                  >
                    {/* Background (empty part) */}
                    <div className="absolute inset-0 bg-muted" />

                    {/* Filled part (progress) */}
                    <div
                      className="absolute inset-y-0 left-0"
                      style={{
                        width: `${sgpaPercentage}%`,
                        backgroundColor: "var(--chart-1)",
                        transition: isDraggingThisCard || isAnimating ? "none" : "width 0.2s",
                      }}
                    />

                    {/* Text overlay */}
                    <div className="relative h-full flex items-center px-2 text-xs font-semibold text-chart-1 mix-blend-difference">
                      SGPA: {sem.sgpa.toFixed(1)}
                    </div>
                  </div>

                  {/* CGPA Progress Bar (Read-only) */}
                  <div className="relative h-6 rounded-b-lg overflow-hidden">
                    {/* Background (empty part) */}
                    <div className="absolute inset-0 bg-muted" />

                    {/* Filled part (progress) */}
                    <div
                      className="absolute inset-y-0 left-0"
                      style={{
                        width: `${cgpaPercentage}%`,
                        backgroundColor: "var(--chart-2)",
                        transition: isAnimating ? "none" : "width 0.2s",
                      }}
                    />

                    {/* Text overlay */}
                    <div className="relative h-full flex items-center px-2 text-xs font-semibold text-chart-2 mix-blend-difference">
                      CGPA: {sem.cgpa.toFixed(1)}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
