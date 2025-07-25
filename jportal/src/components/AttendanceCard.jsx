import React, { useState, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useSwipeable } from "react-swipeable";
import { useTheme } from "./ThemeProvider";
import Loader from "./Loader";
import { getAttendanceDecimal } from "../lib/utils";

const AttendanceCard = ({
  subject,
  selectedSubject,
  setSelectedSubject,
  subjectAttendanceData,
  fetchSubjectAttendance,
  attendanceGoal = 75,
  useCardBackgrounds = true,
}) => {
  const {
    name,
    attendance,
    combined,
    lecture,
    tutorial,
    practical,
    classesNeeded,
    classesCanMiss,
  } = subject;

  const attendancePercentage =
    attendance.total > 0
      ? Number(combined).toFixed(getAttendanceDecimal())
      : "100";
  const displayName = name.replace(/\s*\([^)]*\)\s*$/, "");

  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // 1. Create a ref for the scrollable container
  const scrollableRef = useRef(null);

  const { theme } = useTheme();
  const themes = {
    darkBlue: {
      "--accent-color": "#7ec3f0",
    },
    white: {
      "--accent-color": "#3182ce",
    },
    cream: {
      "--accent-color": "#A47551",
    },
    amoled: {
      "--accent-color": "#00bcd4",
    },
  };
  const accentColor = themes[theme]["--accent-color"];

  // Progress color logic: accent if above goal+5, yellow if within 5%, red if below
  let progressColor = accentColor;
  if (attendanceGoal) {
    const percent = Number(attendancePercentage);
    if (percent < attendanceGoal) {
      progressColor = "#ef4444"; // red
    } else if (percent < attendanceGoal + 5) {
      progressColor = "#eab308"; // yellow
    }
  }

  // Helper to change month
  const changeMonth = (direction) => {
    const baseDate = selectedDate || new Date();
    const newDate = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth() + direction,
      1
    );
    setSelectedDate(newDate);
  };
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => changeMonth(1),
    onSwipedRight: () => changeMonth(-1),
    onSwipedDown: () => {
      // Only dismiss if at the top of the scrollable container
      if (!scrollableRef.current || scrollableRef.current.scrollTop === 0) {
        setIsSheetOpen(false);
      }
    },
    trackMouse: true,
    preventDefaultTouchmoveEvent: true,
  });

  const handleClick = async (e) => {
    // Prevent opening if already open (avoid bubbling issues)
    if (isSheetOpen) return;
    setSelectedSubject(subject);
    setIsSheetOpen(true);
    if (!subjectAttendanceData[subject.name]) {
      setIsLoading(true);
      await fetchSubjectAttendance(subject);
      setIsLoading(false);
    }
  };

  // Updated getDayStatus function to return array of statuses
  const getDayStatus = (date) => {
    if (!subjectAttendanceData[subject.name]) return null;

    const dateStr = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const attendances = subjectAttendanceData[subject.name].filter((a) =>
      a.datetime.startsWith(dateStr)
    );

    if (attendances.length === 0) return null;
    return attendances.map((a) => a.present === "Present");
  };

  // Add this function to format the date string for display
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  // Modify getClassesForDate to handle string date
  const getClassesForDate = (dateStr) => {
    if (!subjectAttendanceData[subject.name] || !dateStr) return [];

    const date = new Date(dateStr);
    const formattedDateStr = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return subjectAttendanceData[subject.name].filter((a) =>
      a.datetime.startsWith(formattedDateStr)
    );
  };

  // Add new function to process data for the chart
  const processAttendanceData = () => {
    if (!subjectAttendanceData[subject.name]) return [];

    const data = subjectAttendanceData[subject.name];

    // Sort all entries by date first
    const sortedData = [...data].sort((a, b) => {
      const [aDay, aMonth, aYear] = a.datetime.split(" ")[0].split("/");
      const [bDay, bMonth, bYear] = b.datetime.split(" ")[0].split("/");
      return (
        new Date(aYear, aMonth - 1, aDay) - new Date(bYear, bMonth - 1, bDay)
      );
    });

    let cumulativePresent = 0;
    let cumulativeTotal = 0;
    const attendanceByDate = {};

    // Calculate cumulative attendance for each date
    sortedData.forEach((entry) => {
      const [date] = entry.datetime.split(" ");
      cumulativeTotal++;
      if (entry.present === "Present") {
        cumulativePresent++;
      }

      attendanceByDate[date] = {
        date,
        percentage: (cumulativePresent / cumulativeTotal) * 100,
      };
    });

    return Object.values(attendanceByDate);
  };

  const isMobile =
    typeof window !== "undefined" ? window.innerWidth < 768 : false;

  return (
    <div
      className={`w-full max-w-2xl mx-auto ${
        useCardBackgrounds ? "bg-[var(--card-bg)] rounded-2xl shadow-sm" : ""
      } px-4 pt-5 pb-3 flex flex-col gap-1`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-xl font-light truncate mb-0.5 sm:mb-1 text-[var(--text-color)]">
            {displayName}
          </h2>
          <div className="text-xs sm:text-base font-normal text-[var(--label-color)]">
            {lecture !== "" && <div>Lecture: {lecture}%</div>}
            {tutorial !== "" && <div>Tutorial: {tutorial}%</div>}
            {practical !== "" && <div>Practical: {practical}%</div>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 justify-end">
            <div className="flex flex-col items-end justify-center">
              <div className="text-lg sm:text-2xl font-mono font-bold text-[var(--text-color)] leading-none">
                {attendance.attended}
                <span className="text-sm sm:text-lg font-normal text-[var(--label-color)]">
                  /{attendance.total}
                </span>
              </div>
              {classesNeeded > 0 ? (
                <div className="text-[0.7rem] sm:text-xs font-bold mt-0.5 sm:mt-1 text-red-700">
                  Attend{" "}
                  <span className="font-bold text-red-600">
                    {classesNeeded}
                  </span>
                </div>
              ) : classesCanMiss > 0 ? (
                <div className="text-[0.7rem] sm:text-xs font-bold mt-0.5 sm:mt-1 text-green-700">
                  Can miss{" "}
                  <span className="font-bold text-green-600">
                    {classesCanMiss}
                  </span>
                </div>
              ) : null}
            </div>
            <div className="relative flex items-center justify-center">
              <svg
                width="56"
                height="56"
                viewBox="0 0 72 72"
                className="sm:w-[72px] sm:h-[72px] w-[56px] h-[56px]"
              >
                <circle
                  cx="36"
                  cy="36"
                  r="32"
                  fill="none"
                  stroke="var(--label-color)"
                  strokeWidth="3"
                />
                <circle
                  cx="36"
                  cy="36"
                  r="32"
                  fill="none"
                  stroke={progressColor}
                  strokeWidth="6"
                  strokeDasharray={2 * Math.PI * 32}
                  strokeDashoffset={
                    2 * Math.PI * 32 * (1 - attendancePercentage / 100)
                  }
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.5s, stroke 0.3s" }}
                />
                <text
                  x="50%"
                  y="50%"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="1.1rem"
                  fontWeight="bold"
                  fill={progressColor}
                >
                  {attendancePercentage}
                </text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <Sheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) {
            setSelectedSubject(null);
            setSelectedDate(null);
          }
        }}
        modal={true}
      >
        <SheetContent
          side="bottom"
          className="min-h-[70vh] max-h-[90vh] bg-[var(--card-bg)] text-[var(--text-color)] border-0 overflow-y-scroll rounded-t-3xl shadow-xl p-0"
        >
          <SheetHeader>
            {/* <SheetTitle className="text-white">{}</SheetTitle> */}
          </SheetHeader>
          <div
            className="h-full overflow-y-auto flex flex-col items-center justify-start pt-4 px-2"
            ref={scrollableRef}
          >
            {isLoading ? (
              <div className="flex items-center justify-center w-full h-full min-h-[300px]">
                <Loader message="Loading attendance data..." />
              </div>
            ) : (
              <>
                <div className="w-full flex flex-col md:flex-row gap-4 items-center justify-center max-w-[1080px] mx-auto">
                  {/* Calendar Section */}
                  <div
                    className="flex flex-col items-center bg-[var(--card-bg)] rounded-xl shadow-sm p-4 w-full md:max-w-[370px] mx-auto"
                    {...swipeHandlers}
                  >
                    <Calendar
                      mode="single"
                      modifiers={{
                        presentSingle: (date) => {
                          const statuses = getDayStatus(date);
                          return statuses?.length === 1 && statuses[0] === true;
                        },
                        absentSingle: (date) => {
                          const statuses = getDayStatus(date);
                          return (
                            statuses?.length === 1 && statuses[0] === false
                          );
                        },
                        presentDouble: (date) => {
                          const statuses = getDayStatus(date);
                          return (
                            statuses?.length === 2 &&
                            statuses.every((s) => s === true)
                          );
                        },
                        absentDouble: (date) => {
                          const statuses = getDayStatus(date);
                          return (
                            statuses?.length === 2 &&
                            statuses.every((s) => s === false)
                          );
                        },
                        mixedDouble: (date) => {
                          const statuses = getDayStatus(date);
                          return (
                            statuses?.length === 2 &&
                            statuses[0] !== statuses[1]
                          );
                        },
                        selected: (date) => date === selectedDate,
                      }}
                      modifiersStyles={{
                        presentSingle: {
                          backgroundColor: "var(--accent-color)",
                          color: "var(--card-bg)",
                          borderRadius: "50%",
                        },
                        absentSingle: {
                          backgroundColor: "var(--error-color, #ef4444)",
                          color: "var(--card-bg)",
                          borderRadius: "50%",
                        },
                        presentDouble: {
                          backgroundColor: "var(--accent-color)",
                          color: "var(--card-bg)",
                          borderRadius: "50%",
                        },
                        absentDouble: {
                          backgroundColor: "var(--error-color, #ef4444)",
                          color: "var(--card-bg)",
                          borderRadius: "50%",
                        },
                        mixedDouble: {
                          background:
                            "linear-gradient(90deg, var(--accent-color) 50%, var(--error-color, #ef4444) 50%)",
                          color: "var(--card-bg)",
                          borderRadius: "50%",
                        },
                      }}
                      selected={selectedDate}
                      onSelect={(date) => setSelectedDate(date)}
                      className={`pb-2 w-full flex-shrink-0 max-w-full bg-[var(--card-bg)] text-[var(--text-color)] rounded-xl shadow-none border-0`}
                      classNames={{
                        months: "flex flex-col space-y-2",
                        month: "space-y-2 w-full",
                        caption:
                          "flex justify-center pt-1 items-center text-lg font-semibold text-[var(--text-color)]",
                        caption_label:
                          "text-lg font-semibold text-[var(--text-color)]",
                        nav: "space-x-1 flex items-center",
                        nav_button:
                          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                        nav_button_previous: "absolute left-1",
                        nav_button_next: "absolute right-1",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell:
                          "text-[var(--label-color)] rounded-md flex-1 font-normal text-[1rem]",
                        row: "flex w-full mt-2",
                        cell: "flex-1 text-center text-base p-0 relative",
                        day: "h-10 w-10 p-0 font-medium mx-auto text-base",
                        day_selected:
                          "bg-[var(--primary-color)] text-[var(--card-bg)]",
                        day_today: "border border-[var(--primary-color)]",
                        day_outside: "text-[var(--label-color)] opacity-50",
                        day_disabled: "text-[var(--label-color)] opacity-50",
                        day_range_middle: "",
                        day_hidden: "invisible",
                      }}
                    />
                    {/* Mobile: Selected Day's Attendance Details above the graph */}
                    {selectedDate && (
                      <div className="w-full flex justify-center mt-4 md:hidden">
                        <div className="bg-[var(--card-bg)] rounded-xl shadow-sm p-4 w-full max-w-full text-center mx-auto">
                          <div className="font-semibold text-lg mb-2 text-[var(--text-color)]">
                            Attendance for{" "}
                            {selectedDate.toLocaleDateString("en-GB")}
                          </div>
                          {getClassesForDate(selectedDate).length === 0 ? (
                            <div className="text-[var(--label-color)] text-base">
                              No classes scheduled.
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2 items-center w-full">
                              {getClassesForDate(selectedDate).map(
                                (classData, index) => (
                                  <div
                                    key={index}
                                    className={`rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm border bg-[var(--card-bg-alt, var(--bg-color))] w-full mx-auto ${
                                      classData.present === "Present"
                                        ? "border-[var(--accent-color)]"
                                        : "border-[var(--error-color,#ef4444)]"
                                    }`}
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium text-[var(--text-color)] text-base">
                                        {classData.attendanceby}
                                      </div>
                                      <div className="text-[var(--label-color)] text-sm">
                                        {classData.classtype} &bull;{" "}
                                        {classData.datetime}
                                      </div>
                                    </div>
                                    <div
                                      className={`font-semibold text-base ml-4 ${
                                        classData.present === "Present"
                                          ? "text-[var(--accent-color)]"
                                          : "text-[var(--error-color,#ef4444)]"
                                      }`}
                                    >
                                      {classData.present}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Optional vertical divider for desktop */}
                  <div className="hidden md:block w-px h-auto bg-[var(--border-color)] mx-2" />
                  {/* Progress Graph Section */}
                  <div className="w-full md:max-w-full flex flex-col items-center bg-[var(--card-bg)] rounded-xl shadow-sm p-4 mx-auto md:flex-1">
                    <div className="w-full h-[220px] flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={processAttendanceData()}
                          margin={{
                            top: 10,
                            right: 10,
                            left: isMobile ? 0 : 32,
                            bottom: 0,
                          }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border-color)"
                          />
                          <XAxis
                            dataKey="date"
                            stroke="var(--label-color)"
                            tick={{
                              fill: "var(--label-color)",
                              fontSize: "0.75rem",
                              dy: 10,
                            }}
                            tickFormatter={(value) => {
                              const [day, month] = value.split("/");
                              return `${day}/${month}`;
                            }}
                          />
                          <YAxis
                            stroke="var(--label-color)"
                            tick={{
                              fill: "var(--label-color)",
                              fontSize: "0.75rem",
                            }}
                            domain={[0, 100]}
                            tickFormatter={(value) => `${value}%`}
                            width={isMobile ? 40 : 60}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--card-bg)",
                              border: "1px solid var(--border-color)",
                              color: "var(--text-color)",
                            }}
                            formatter={(value) => [`${value.toFixed(1)}%`]}
                          />
                          <Line
                            type="monotone"
                            dataKey="percentage"
                            stroke="var(--accent-color)"
                            strokeWidth={2}
                            dot={{ fill: "var(--accent-color)", r: 4 }}
                            activeDot={{ r: 6 }}
                            name="Present"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                {/* Desktop: Selected Day's Attendance Details below the graph */}
                {selectedDate && (
                  <div className="w-full justify-center mt-4 hidden md:flex">
                    <div className="bg-[var(--card-bg)] rounded-xl shadow-sm p-4 w-full max-w-xl text-center">
                      <div className="font-semibold text-lg mb-2 text-[var(--text-color)]">
                        Attendance for{" "}
                        {selectedDate.toLocaleDateString("en-GB")}
                      </div>
                      {getClassesForDate(selectedDate).length === 0 ? (
                        <div className="text-[var(--label-color)] text-base">
                          No classes scheduled.
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2 items-center w-full">
                          {getClassesForDate(selectedDate).map(
                            (classData, index) => (
                              <div
                                key={index}
                                className={`rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm border bg-[var(--card-bg-alt, var(--bg-color))] w-full max-w-md mx-auto ${
                                  classData.present === "Present"
                                    ? "border-[var(--accent-color)]"
                                    : "border-[var(--error-color,#ef4444)]"
                                }`}
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-[var(--text-color)] text-base">
                                    {classData.attendanceby}
                                  </div>
                                  <div className="text-[var(--label-color)] text-sm">
                                    {classData.classtype} &bull;{" "}
                                    {classData.datetime}
                                  </div>
                                </div>
                                <div
                                  className={`font-semibold text-base ml-4 ${
                                    classData.present === "Present"
                                      ? "text-[var(--accent-color)]"
                                      : "text-[var(--error-color,#ef4444)]"
                                  }`}
                                >
                                  {classData.present}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AttendanceCard;
