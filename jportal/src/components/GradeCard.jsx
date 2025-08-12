import React from "react";

const GradeCard = ({ subject, getGradeColor, useCardBackgrounds = true }) => {
  return (
    <div
      className={`w-full max-w-2xl mx-auto ${
        useCardBackgrounds ? "bg-[var(--card-bg)] rounded-2xl shadow-sm" : ""
      } px-6 py-5 flex flex-col gap-2 mb-2`}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-light truncate mb-1 text-[var(--text-color)]">
            {subject.subjectdesc}
          </h2>
          <div className="text-xs font-normal text-[var(--label-color)]">
            {subject.subjectcode}
          </div>
        </div>
        <div className="flex flex-row items-stretch gap-3 min-w-[100px] sm:min-w-[120px]">
          {/* Grade */}
          <div className="flex flex-col items-center justify-center min-w-[40px] sm:min-w-[48px]">
            <div
              className={`text-xl sm:text-2xl font-mono font-bold ${getGradeColor(
                subject.grade
              )} leading-none`}
            >
              {subject.grade}
            </div>
            <div className="text-[0.65rem] sm:text-xs text-[var(--label-color)] font-light mt-1">
              Grade
            </div>
          </div>
          {/* Divider */}
          <div className="w-px bg-[var(--border-color)] mx-1" />
          {/* Credits */}
          <div className="flex flex-col items-center justify-center min-w-[40px] sm:min-w-[48px]">
            <div className="text-xl sm:text-2xl font-mono font-bold text-[var(--accent-color)] leading-none">
              {subject.coursecreditpoint}
            </div>
            <div className="text-[0.65rem] sm:text-xs text-[var(--label-color)] font-light mt-1">
              Credits
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeCard;
