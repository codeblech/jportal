/**
 * DraggableDot Component
 *
 * A custom SVG circle that can be dragged vertically to modify SGPA values
 * Used in the InteractiveGPAChart for interactive data manipulation
 */

const DraggableDot = ({ cx, cy, index, onDragStart, isDragging }) => {
  const handlePointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDragStart(index, e.clientY);
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
      onPointerDown={handlePointerDown}
    />
  );
};

export default DraggableDot;
