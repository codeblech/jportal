import React, { useState } from "react";
import CircleProgress from "./CircleProgress";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";

const AttendanceCard = ({
  subject,
  selectedSubject,
  setSelectedSubject,
  subjectAttendanceData,
  fetchSubjectAttendance
}) => {
  const { name, attendance, combined, lecture, tutorial, practical, classesNeeded, classesCanMiss } = subject;
  console.log(name, attendance, combined, lecture, tutorial, practical)
  const attendancePercentage = (attendance.total > 0) ? combined.toFixed(0) : "100";
  const displayName = name.replace(/\s*\([^)]*\)\s*$/, '');

  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const handleClick = async () => {
    setSelectedSubject(subject);
    if (!subjectAttendanceData[subject.name]) {
      setIsLoading(true);
      await fetchSubjectAttendance(subject);
      setIsLoading(false);
    }
  };

  // Updated getDayStatus function to return array of statuses
  const getDayStatus = (date) => {
    if (!subjectAttendanceData[subject.name]) return null;

    const dateStr = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const attendances = subjectAttendanceData[subject.name].filter(
      a => a.datetime.startsWith(dateStr)
    );

    if (attendances.length === 0) return null;
    return attendances.map(a => a.present === "Present");
  };

  // Add this function to format the date string for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  // Modify getClassesForDate to handle string date
  const getClassesForDate = (dateStr) => {
    if (!subjectAttendanceData[subject.name] || !dateStr) return [];

    const date = new Date(dateStr);
    const formattedDateStr = date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    return subjectAttendanceData[subject.name].filter(
      a => a.datetime.startsWith(formattedDateStr)
    );
  };
  return (
    <>
      <div
        className="flex justify-between items-center py-1 border-b border-gray-700 cursor-pointer hover:bg-gray-800/50 dark:border-gray-300 dark:hover:bg-gray-200/50"
        onClick={handleClick}
      >
        <div className="flex-1 mr-4">
          <h2 className="text-sm font-semibold max-[390px]:text-xs dark:text-black">{displayName}</h2>
          {lecture !== '' && <p className="text-sm lg:text-base max-[390px]:text-xs dark:text-black">Lecture: {lecture}%</p>}
          {tutorial !== '' && <p className="text-sm lg:text-base max-[390px]:text-xs dark:text-black">Tutorial: {tutorial}%</p>}
          {practical !== '' && <p className="text-sm lg:text-base max-[390px]:text-xs dark:text-black">Practical: {practical}%</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className="text-center">
            <div className="text-sm dark:text-black">{attendance.attended}</div>
            <div className="h-px w-full bg-gray-700 dark:bg-gray-300"></div>
            <div className="text-sm dark:text-black">{attendance.total}</div>
          </div>
          <div className="flex flex-col items-center">
            <CircleProgress key={Date.now()} percentage={attendancePercentage} />
            {classesNeeded > 0 ? (
              <div className="text-xs mt-1 text-gray-400 dark:text-gray-600">
                Attend {classesNeeded}
              </div>
            ) : classesCanMiss > 0 && (
              <div className="text-xs mt-1 text-gray-400 dark:text-gray-600">
                Can miss {classesCanMiss}
              </div>
            )}
          </div>
        </div>
      </div>

      <Sheet open={selectedSubject?.name === subject.name} onOpenChange={() => {
        setSelectedSubject(null);
        setSelectedDate(null);
      }}>
        <SheetContent side="bottom" className="h-[70vh] bg-[#191c20] text-white border-0 overflow-hidden flex flex-col dark:bg-white dark:text-black">
          <SheetHeader>
            {/* <SheetTitle className="text-white dark:text-black">{}</SheetTitle> */}
          </SheetHeader>
          <div className="py-4 flex flex-col items-center flex-1 overflow-y-auto">
            <div className="w-full max-w-[320px] flex flex-col">
              <Calendar
                mode="single"
                modifiers={{
                  presentSingle: (date) => {
                    const statuses = getDayStatus(date);
                    return statuses?.length === 1 && statuses[0] === true;
                  },
                  absentSingle: (date) => {
                    const statuses = getDayStatus(date);
                    return statuses?.length === 1 && statuses[0] === false;
                  },
                  presentDouble: (date) => {
                    const statuses = getDayStatus(date);
                    return statuses?.length === 2 && statuses.every(s => s === true);
                  },
                  absentDouble: (date) => {
                    const statuses = getDayStatus(date);
                    return statuses?.length === 2 && statuses.every(s => s === false);
                  },
                  mixedDouble: (date) => {
                    const statuses = getDayStatus(date);
                    return statuses?.length === 2 && statuses[0] !== statuses[1];
                  },
                  presentTriple: (date) => {
                    const statuses = getDayStatus(date);
                    return statuses?.length === 3 && statuses.every(s => s === true);
                  },
                  absentTriple: (date) => {
                    const statuses = getDayStatus(date);
                    return statuses?.length === 3 && statuses.every(s => s === false);
                  },
                  mixedTripleAllPresent: (date) => {
                    const statuses = getDayStatus(date);
                    return statuses?.length === 3 && statuses.filter(s => s === true).length === 2;
                  },
                  mixedTripleAllAbsent: (date) => {
                    const statuses = getDayStatus(date);
                    return statuses?.length === 3 && statuses.filter(s => s === false).length === 2;
                  },
                  mixedTripleEqual: (date) => {
                    const statuses = getDayStatus(date);
                    return statuses?.length === 3 &&
                           statuses.filter(s => s === true).length ===
                           statuses.filter(s => s === false).length;
                  },
                  selected: (date) => date === selectedDate,
                }}
                modifiersStyles={{
                  presentSingle: {
                    backgroundColor: 'rgba(22, 163, 72, 0.4)',
                    borderRadius: '50%'
                  },
                  absentSingle: {
                    backgroundColor: 'rgba(220, 38, 38, 0.4)',
                    borderRadius: '50%'
                  },
                  presentDouble: {
                    backgroundColor: 'rgba(22, 163, 72, 0.4)',
                    borderRadius: '50%'
                  },
                  absentDouble: {
                    backgroundColor: 'rgba(220, 38, 38, 0.4)',
                    borderRadius: '50%'
                  },
                  mixedDouble: {
                    background: 'linear-gradient(90deg, rgba(22, 163, 72, 0.4) 50%, rgba(220, 38, 38, 0.4) 50%)',
                    borderRadius: '50%'
                  },
                  presentTriple: {
                    backgroundColor: 'rgba(22, 163, 72, 0.4)',
                    borderRadius: '50%'
                  },
                  absentTriple: {
                    backgroundColor: 'rgba(220, 38, 38, 0.4)',
                    borderRadius: '50%'
                  },
                  mixedTripleAllPresent: {
                    background: 'conic-gradient(rgba(22, 163, 72, 0.4) 0deg 240deg, rgba(220, 38, 38, 0.4) 240deg 360deg)',
                    borderRadius: '50%'
                  },
                  mixedTripleAllAbsent: {
                    background: 'conic-gradient(rgba(220, 38, 38, 0.4) 0deg 240deg, rgba(22, 163, 72, 0.4) 240deg 360deg)',
                    borderRadius: '50%'
                  },
                  mixedTripleEqual: {
                    background: 'conic-gradient(rgba(22, 163, 72, 0.4) 0deg 120deg, rgba(220, 38, 38, 0.4) 120deg 240deg, rgba(22, 163, 72, 0.4) 240deg 360deg)',
                    borderRadius: '50%'
                  },
                }}
                selected={selectedDate}
                onSelect={(date) => setSelectedDate(date)}
                className={`pb-2 text-white dark:text-black ${isLoading ? 'animate-pulse' : ''} w-full flex-shrink-0 max-w-full`}
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4 w-full",
                  caption: "flex justify-center pt-1 relative items-center text-sm",
                  caption_label: "text-sm font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-gray-500 rounded-md flex-1 font-normal text-[0.8rem] max-[390px]:text-[0.7rem]",
                  row: "flex w-full mt-2",
                  cell: "flex-1 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 mx-auto max-[390px]:h-6 max-[390px]:w-6 max-[390px]:text-xs",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
              />

              {/* Day data section with scrolling */}
              {selectedDate && (
                <div className="mt-4 space-y-2 w-full pb-4 flex-shrink-0">
                  {getClassesForDate(selectedDate).map((classData, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded ${
                        classData.present === "Present"
                          ? "bg-green-600/40 dark:bg-green-200/40"
                          : "bg-red-600/40 dark:bg-red-200/40"
                      }`}
                    >
                      <p className="text-sm dark:text-black">
                        {classData.attendanceby}
                      </p>

                        <p className="text-xs text-gray-400 dark:text-gray-600">
                      {classData.classtype} - {classData.present}
                        </p>
                      <p className="text-xs text-gray-400 dark:text-gray-600">
                        {classData.datetime}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AttendanceCard;
