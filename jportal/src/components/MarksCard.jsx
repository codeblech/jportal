import React from "react";
import { Progress } from "@/components/ui/progress";

export default function MarksCard({ course }) {
  const getProgressColor = (percentage) => {
    if (percentage >= 80) return "bg-marks-outstanding";
    if (percentage >= 60) return "bg-marks-good";
    if (percentage >= 40) return "bg-marks-average";
    return "bg-marks-poor";
  };

  // Calculate overall totals
  const calculateOverallTotals = () => {
    let totalObtained = 0;
    let totalFull = 0;
    Object.values(course.exams).forEach((marks) => {
      totalObtained += marks.OM;
      totalFull += marks.FM;
    });
    const percentage = totalFull > 0 ? ((totalObtained / totalFull) * 100).toFixed(1) : 0;
    return { totalObtained, totalFull, percentage };
  };

  const { totalObtained, totalFull, percentage: overallPercentage } = calculateOverallTotals();

  return (
    <div className="bg-background rounded-lg p-3 sm:p-4 border border-border">
      <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
        <div className="space-y-1 flex-1">
          <h3 className="font-bold text-sm sm:text-base">{course.name}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">{course.code}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-base sm:text-lg font-bold text-foreground tabular-nums">
            {totalObtained}/{totalFull}
          </div>
          <div className="text-xs text-muted-foreground tabular-nums">{overallPercentage}%</div>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {Object.entries(course.exams).map(([examName, marks]) => {
          const percentage = (marks.OM / marks.FM) * 100;
          return (
            <div key={examName}>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <Progress
                    value={percentage}
                    className="h-1.5 sm:h-2 bg-muted"
                    indicatorClassName={getProgressColor(percentage)}
                  />
                </div>
                <div className="w-[100px] sm:w-[120px] flex-shrink-0 text-right tabular-nums">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {marks.OM}/{marks.FM}
                  </span>
                  <span className="text-xs sm:text-sm text-muted-foreground/70 ml-2">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}