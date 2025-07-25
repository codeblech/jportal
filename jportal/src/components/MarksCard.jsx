import React from "react";
import { Progress } from "@/components/ui/progress";

export default function MarksCard({
  course,
  gradeCard,
  useCardBackgrounds = true,
}) {
  const getProgressColor = (percentage) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    if (percentage >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  // Calculate total marks and percentage
  const totalOM = Object.values(course.exams).reduce(
    (sum, m) => sum + (m.OM || 0),
    0
  );
  const totalFM = Object.values(course.exams).reduce(
    (sum, m) => sum + (m.FM || 0),
    0
  );
  const totalPercent = totalFM > 0 ? (totalOM / totalFM) * 100 : 0;

  // Find grade from gradeCard if available, with safe checks
  let matchedGrade = null;
  if (gradeCard && Array.isArray(gradeCard.gradecard)) {
    const found = gradeCard.gradecard.find(
      (s) =>
        s.subjectcode === course.code ||
        s.subjectcode === course.subjectcode ||
        s.subjectdesc === course.name
    );
    if (found) {
      matchedGrade = found.grade;
    }
  }

  // Grade and credits (if available)
  const grade = matchedGrade || course.grade || course.gradepoint || "-";
  const credits =
    course.credits || course.credit || course.coursecreditpoint || "-";
  const isAudit = course.audtsubject === "Y" || course.isAudit;

  return (
    <div
      className={`${
        useCardBackgrounds ? "bg-[var(--card-bg)] rounded-2xl shadow-sm" : ""
      } px-6 py-5 flex flex-col gap-2 mb-2 border-none`}
    >
      <div className="flex items-center justify-between gap-4 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-light truncate text-[var(--text-color)] font-sans">
              {course.name}
            </h3>
            {isAudit && (
              <span className="text-xs bg-yellow-600/20 text-yellow-400 rounded px-2 py-0.5 ml-2">
                Audit
              </span>
            )}
          </div>
          <div className="text-xs font-normal text-[var(--label-color)] flex items-center gap-3">
            <span>{course.code}</span>
            {credits !== "-" && (
              <span className="text-xs bg-[var(--primary-color)]/10 text-[var(--accent-color)] rounded px-2 py-0.5">
                {credits} Credits
              </span>
            )}
            {grade !== "-" && (
              <span className="text-xs bg-[var(--accent-color)]/10 text-[var(--accent-color)] rounded px-2 py-0.5">
                Grade: {grade}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-w-[64px]">
          <div className="text-2xl font-mono font-bold text-[var(--accent-color)] leading-none">
            {totalOM}/{totalFM}
          </div>
          <div className="text-xs text-[var(--label-color)] font-light mt-1">
            {totalFM > 0 ? `${totalPercent.toFixed(1)}%` : "-"}
          </div>
        </div>
      </div>
      <div className="space-y-2 sm:space-y-3 mt-2">
        {Object.entries(course.exams).map(([examName, marks]) => {
          const percentage = (marks.OM / marks.FM) * 100;
          return (
            <div key={examName}>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-0.5">
                    <span className="text-xs text-[var(--label-color)] font-medium">
                      {examName.replace(/_/g, " ").toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">
                      {marks.OM}/{marks.FM}
                    </span>
                  </div>
                  <Progress
                    value={percentage}
                    className="h-1.5 sm:h-2"
                    indicatorClassName={getProgressColor(percentage)}
                  />
                </div>
                <span className="text-xs sm:text-sm text-gray-400 min-w-[50px] sm:min-w-[60px] text-right">
                  {marks.FM > 0 ? `${percentage.toFixed(1)}%` : "-"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
