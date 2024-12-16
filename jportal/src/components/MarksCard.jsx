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
    <div className="bg-[#1f2937] rounded-lg p-4 space-y-3">
      <div className="space-y-1">
        <h3 className="font-medium text-sm">{course.name}</h3>
        <p className="text-xs text-gray-400">{course.code}</p>
      </div>

      <div className="space-y-2">
        {Object.entries(course.exams).map(([examName, marks]) => {
          const percentage = (marks.OM / marks.FM) * 100;
          return (
            <div key={examName} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">
                  {marks.OM}/{marks.FM}
                </span>
                <span className="text-gray-400">
                  {percentage.toFixed(1)}%
                </span>
              </div>
              <Progress
                value={percentage}
                className="h-2"
                indicatorClassName={getProgressColor(percentage)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}