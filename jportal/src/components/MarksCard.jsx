import React from "react";
import { Progress } from "@/components/ui/progress";

export default function MarksCard({ course }) {
  const getProgressColor = (percentage) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    if (percentage >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="bg-[#191c20] rounded-lg p-3 sm:p-4 border border-gray-700">
      <div className="space-y-1 mb-3 sm:mb-4">
        <h3 className="font-bold text-sm sm:text-base">{course.name}</h3>
        <p className="text-xs sm:text-sm text-gray-400">{course.code}</p>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {Object.entries(course.exams).map(([examName, marks]) => {
          const percentage = (marks.OM / marks.FM) * 100;
          return (
            <div key={examName}>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex-1">
                  <Progress
                    value={percentage}
                    className="h-1.5 sm:h-2"
                    indicatorClassName={getProgressColor(percentage)}
                  />
                </div>
                <span className="text-xs sm:text-sm text-gray-400 min-w-[50px] sm:min-w-[60px] text-right">
                  {marks.OM}/{marks.FM}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}