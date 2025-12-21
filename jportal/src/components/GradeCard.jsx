import React from "react";

const GradeCard = ({ subject, getGradeColor }) => {
  const isAudit = subject.cgpapoints == 0;

  return (
    <div className="flex justify-between items-center py-1 border-b border-border">
      <div className="flex-1 mr-4">
        <h2 className="text-sm font-semibold max-[390px]:text-xs">{subject.subjectdesc}</h2>
        <div className="flex items-center gap-2">
          <p className="text-sm lg:text-base max-[390px]:text-xs">{subject.subjectcode}</p>
          {isAudit && (
            <span className="text-xs font-medium px-2 py-0.5 bg-muted text-muted-foreground rounded">
              Audit
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-center">
          <div className={`text-xl font-bold ${getGradeColor(subject.grade)}`}>{subject.grade}</div>
          <div className="text-xs text-muted-foreground">Grade</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-primary">{subject.coursecreditpoint}</div>
          <div className="text-xs text-muted-foreground">Credits</div>
        </div>
      </div>
    </div>
  );
};

export default GradeCard;