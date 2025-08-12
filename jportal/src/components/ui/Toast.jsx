import React, { useEffect, useState } from "react";

const Toast = ({
  message,
  progress,
  total,
  type = "info",
  duration = 3000,
  onClose,
  loadedList = [],
  pendingList = [],
  noAttendanceList = [],
}) => {
  const [visible, setVisible] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (duration !== null && !expanded) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose, expanded]);

  if (!visible) return null;

  let bg = "bg-[var(--card-bg)]";
  let border = "border-l-4 border-[var(--accent-color)]";
  let text = "text-[var(--text-color)]";
  if (type === "success") border = "border-l-4 border-green-500";
  if (type === "error") border = "border-l-4 border-red-500";

  const isClickable = loadedList.length > 0 || pendingList.length > 0;

  return (
    <div
      className={`fixed bottom-24 md:bottom-6 right-6 z-50 min-w-[220px] max-w-xs shadow-lg rounded-xl p-4 flex flex-col gap-2 animate-toast-in ${bg} ${border} ${text} ${
        isClickable
          ? "cursor-pointer hover:bg-[var(--accent-color)]/10 transition"
          : ""
      }`}
      style={{ pointerEvents: "auto" }}
      onClick={isClickable ? () => setExpanded((e) => !e) : undefined}
      title={isClickable ? "Click to see details" : undefined}
    >
      <span className="font-medium text-base flex items-center gap-2">
        {message}
        {isClickable && (
          <span
            className={`ml-1 text-xs ${
              expanded ? "rotate-90" : ""
            } transition-transform duration-200`}
          >
            ▶
          </span>
        )}
      </span>
      {typeof progress === "number" && typeof total === "number" && (
        <div className="w-full h-2 bg-[var(--border-color)] rounded overflow-hidden">
          <div
            className="h-2 bg-[var(--accent-color)] transition-all duration-300"
            style={{ width: `${(progress / total) * 100}%` }}
          />
        </div>
      )}
      {expanded && (
        <div className="mt-2 text-left">
          {loadedList.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-semibold mb-1 text-green-500 uppercase tracking-wide">
                Loaded
              </div>
              <ul className="space-y-1">
                {loadedList.map((name) => (
                  <li
                    key={name}
                    className="pl-2 border-l-4 border-green-400 text-green-700 text-sm bg-transparent"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {pendingList.length > 0 && (
            <div className="mb-2">
              <div className="text-xs font-semibold mb-1 text-yellow-400 uppercase tracking-wide">
                Pending
              </div>
              <ul className="space-y-1">
                {pendingList.map((name) => (
                  <li
                    key={name}
                    className="pl-2 border-l-4 border-yellow-400 text-yellow-700 text-sm bg-transparent"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {noAttendanceList.length > 0 && (
            <div>
              <div className="text-xs font-semibold mb-1 text-gray-400 uppercase tracking-wide">
                No Attendance
              </div>
              <ul className="space-y-1">
                {noAttendanceList.map((name) => (
                  <li
                    key={name}
                    className="pl-2 border-l-4 border-gray-400 text-gray-500 text-sm bg-transparent"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <style>{`
        @keyframes toast-in { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }
        .animate-toast-in { animation: toast-in 0.3s cubic-bezier(.4,0,.2,1); }
      `}</style>
    </div>
  );
};

export default Toast;
