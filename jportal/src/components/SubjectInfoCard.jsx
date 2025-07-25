import React from "react";
import { useTheme } from "./ThemeProvider";

function SubjectInfoCard({ subject, useCardBackgrounds = true }) {
  const { isLightTheme } = useTheme();

  return (
    <div
      className={`w-full max-w-2xl mx-auto ${
        useCardBackgrounds ? "bg-[var(--card-bg)] rounded-2xl shadow-sm" : ""
      } px-4 sm:px-6 py-3 sm:py-5 flex flex-col gap-1 sm:gap-2 mb-2`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-light truncate mb-1 text-[var(--text-color)]">
            {subject.name}
          </h2>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-normal text-[var(--label-color)]">
              {subject.code}
            </span>
            {subject.isAudit && (
              <span
                className={`text-xs bg-yellow-600/20 ${
                  isLightTheme ? "text-yellow-800" : "text-yellow-400"
                } rounded px-2 py-0.5 ml-2`}
              >
                Audit
              </span>
            )}
          </div>
          <div className="space-y-1">
            {subject.components.map((component, idx) => (
              <div key={idx} className="text-sm text-[var(--label-color)]">
                {component.type === "L" && "Lecture"}
                {component.type === "T" && "Tutorial"}
                {component.type === "P" && "Practical"}
                {": "}
                {component.teacher}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-w-[48px]">
          <div className="text-2xl font-mono font-bold text-[var(--accent-color)] leading-none">
            {subject.credits.toFixed(1)}
          </div>
          <div className="text-xs text-[var(--label-color)] font-light mt-1">
            Credits
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubjectInfoCard;
