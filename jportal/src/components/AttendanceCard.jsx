import React, { useState } from "react";
import CircleProgress from "./CircleProgress";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const AttendanceCard = ({
  subject,
  selectedSubject,
  setSelectedSubject,
  subjectAttendanceData,
  fetchSubjectAttendance,
}) => {
  const { name, attendance, combined, lecture, tutorial, practical, classesNeeded, classesCanMiss } = subject;
  console.log(name, attendance, combined, lecture, tutorial, practical);
  const attendancePercentage = attendance.total > 0 ? combined.toFixed(0) : "100";
  const displayName = name.replace(/\s*\([^)]*\)\s*$/, "");

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

    const dateStr = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const attendances = subjectAttendanceData[subject.name].filter((a) => a.datetime.startsWith(dateStr));

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

    return subjectAttendanceData[subject.name].filter((a) => a.datetime.startsWith(formattedDateStr));
  };

  // Add new function to process data for the chart
  const processAttendanceData = () => {
    if (!subjectAttendanceData[subject.name]) return [];

    const data = subjectAttendanceData[subject.name];

    // Sort all entries by date first
    const sortedData = [...data].sort((a, b) => {
      const [aDay, aMonth, aYear] = a.datetime.split(" ")[0].split("/");
      const [bDay, bMonth, bYear] = b.datetime.split(" ")[0].split("/");
      return new Date(aYear, aMonth - 1, aDay) - new Date(bYear, bMonth - 1, bDay);
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

  return (
    <>
      <Card
        className="shadow-lg cursor-pointer hover:bg-accent/50 transition-colors"
        onClick={handleClick}
      >
        <div className="group flex justify-between items-center px-3 py-1">
          <div className="flex-1 mr-4">
            <h2 className="text-sm font-semibold max-[390px]:text-xs ">{displayName}</h2>
            {lecture !== "" && <p className="text-sm lg:text-base max-[390px]:text-xs">Lecture: {lecture}%</p>}
            {tutorial !== "" && <p className="text-sm lg:text-base max-[390px]:text-xs">Tutorial: {tutorial}%</p>}
            {practical !== "" && <p className="text-sm lg:text-base max-[390px]:text-xs">Practical: {practical}%</p>}
          </div>
          <div className="min-h-[100px]">
            {attendance.attended !== null && attendance.total !== null ? (
              <div className="flex items-center gap-2">
                <div className="text-center">
                  <div className="text-sm">{attendance.attended}</div>
                  <div className="group-hover:bg-accent-foreground h-px w-full bg-foreground"></div>
                  <div className="text-sm">{attendance.total}</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="min-w-[80px] min-h-[80px] flex items-center justify-center">
                    <CircleProgress percentage={attendancePercentage} />
                  </div>
                  {classesNeeded > 0 ? (
                    <div className="text-xs mt-1 text-muted-foreground">Attend {classesNeeded}</div>
                  ) : (
                    classesCanMiss > 0 && <div className="text-xs mt-1 text-muted-foreground">Can miss {classesCanMiss}</div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-center">
                  <div className="h-5 w-8 bg-muted animate-pulse rounded"></div>
                  <div className="h-px w-full bg-muted my-1"></div>
                  <div className="h-5 w-8 bg-muted animate-pulse rounded"></div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="min-w-[80px] min-h-[80px] flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-muted animate-pulse"></div>
                  </div>
                  <div className="h-4 w-16 bg-muted animate-pulse rounded mt-1"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card >

      <Sheet
        open={selectedSubject?.name === subject.name}
        onOpenChange={() => {
          setSelectedSubject(null);
          setSelectedDate(null);
        }}
      >
        <SheetContent side="bottom" className="h-[70vh] bg-background text-foreground border-0 overflow-hidden">
          <SheetHeader>{/* <SheetTitle className="text-foreground">{}</SheetTitle> */}</SheetHeader>
          <div className="h-full overflow-y-auto snap-y snap-mandatory">
            {/* Calendar Section */}
            <div className="min-h-full flex flex-col items-center py-4 snap-start">
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
                      return statuses?.length === 2 && statuses.every((s) => s === true);
                    },
                    absentDouble: (date) => {
                      const statuses = getDayStatus(date);
                      return statuses?.length === 2 && statuses.every((s) => s === false);
                    },
                    mixedDouble: (date) => {
                      const statuses = getDayStatus(date);
                      return statuses?.length === 2 && statuses[0] !== statuses[1];
                    },
                    presentTriple: (date) => {
                      const statuses = getDayStatus(date);
                      return statuses?.length === 3 && statuses.every((s) => s === true);
                    },
                    absentTriple: (date) => {
                      const statuses = getDayStatus(date);
                      return statuses?.length === 3 && statuses.every((s) => s === false);
                    },
                    mixedTripleAllPresent: (date) => {
                      const statuses = getDayStatus(date);
                      return statuses?.length === 3 && statuses.filter((s) => s === true).length === 2;
                    },
                    mixedTripleAllAbsent: (date) => {
                      const statuses = getDayStatus(date);
                      return statuses?.length === 3 && statuses.filter((s) => s === false).length === 2;
                    },
                    mixedTripleEqual: (date) => {
                      const statuses = getDayStatus(date);
                      return (
                        statuses?.length === 3 &&
                        statuses.filter((s) => s === true).length === statuses.filter((s) => s === false).length
                      );
                    },
                    selected: (date) => date === selectedDate,
                  }}
                  modifiersStyles={{
                    presentSingle: {
                      backgroundColor: "color-mix(in srgb, var(--chart-3) 30%, transparent)",
                      borderRadius: "50%",
                      cursor: "pointer",
                    },
                    absentSingle: {
                      backgroundColor: "color-mix(in srgb, var(--chart-5) 30%, transparent)",
                      borderRadius: "50%",
                      cursor: "pointer",
                    },
                    presentDouble: {
                      backgroundColor: "color-mix(in srgb, var(--chart-3) 30%, transparent)",
                      borderRadius: "50%",
                      cursor: "pointer",
                    },
                    absentDouble: {
                      backgroundColor: "color-mix(in srgb, var(--chart-5) 30%, transparent)",
                      borderRadius: "50%",
                      cursor: "pointer",
                    },
                    mixedDouble: {
                      background:
                        "linear-gradient(90deg, color-mix(in srgb, var(--chart-3) 30%, transparent) 50%, color-mix(in srgb, var(--chart-5) 30%, transparent) 50%)",
                      borderRadius: "50%",
                      cursor: "pointer",
                    },
                    presentTriple: {
                      backgroundColor: "color-mix(in srgb, var(--chart-3) 30%, transparent)",
                      borderRadius: "50%",
                      cursor: "pointer",
                    },
                    absentTriple: {
                      backgroundColor: "color-mix(in srgb, var(--chart-5) 30%, transparent)",
                      borderRadius: "50%",
                      cursor: "pointer",
                    },
                    mixedTripleAllPresent: {
                      background:
                        "conic-gradient(color-mix(in srgb, var(--chart-3) 30%, transparent) 0deg 240deg, color-mix(in srgb, var(--chart-5) 30%, transparent) 240deg 360deg)",
                      borderRadius: "50%",
                      cursor: "pointer",
                    },
                    mixedTripleAllAbsent: {
                      background:
                        "conic-gradient(color-mix(in srgb, var(--chart-5) 30%, transparent) 0deg 240deg, color-mix(in srgb, var(--chart-3) 30%, transparent) 240deg 360deg)",
                      borderRadius: "50%",
                      cursor: "pointer",
                    },
                    mixedTripleEqual: {
                      background:
                        "conic-gradient(color-mix(in srgb, var(--chart-3) 30%, transparent) 0deg 120deg, color-mix(in srgb, var(--chart-5) 30%, transparent) 120deg 240deg, color-mix(in srgb, var(--chart-3) 30%, transparent) 240deg 360deg)",
                      borderRadius: "50%",
                      cursor: "pointer",
                    },
                  }}
                  selected={selectedDate}
                  onSelect={(date) => setSelectedDate(date)}
                  className={`pb-2 text-foreground ${isLoading ? "animate-pulse" : ""} w-full shrink-0 max-w-full`}
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
                    head_cell:
                      "text-foreground opacity-50 rounded-md flex-1 font-normal text-[0.8rem] max-[390px]:text-[0.7rem]",
                    row: "flex w-full mt-2",
                    cell: "flex-1 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 mx-auto max-[390px]:h-6 max-[390px]:w-6 max-[390px]:text-xs",
                    day_selected:
                      "bg-primary text-primary-foreground rounded-xs! hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "text-foreground bg-accent/50! rounded-full!",
                    day_outside: "text-muted-foreground opacity-30",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-foreground",
                    day_hidden: "invisible",
                  }}
                />

                {selectedDate && (
                  <div className="mt-4 space-y-2 w-full pb-4">
                    {getClassesForDate(selectedDate).map((classData, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded ${classData.present === "Present" ? "bg-chart-3/30" : "bg-chart-5/30"}`}
                      >
                        <p className="text-sm text-foreground">{classData.attendanceby}</p>

                        <p className="text-xs text-muted-foreground">
                          {classData.classtype} - {classData.present}
                        </p>
                        <p className="text-xs text-muted-foreground">{classData.datetime}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Chart Section */}
            <div className="min-h-full flex flex-col items-center justify-center py-4 pb-10 snap-start">
              <div className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={processAttendanceData()}
                    margin={{
                      top: 10,
                      right: 10,
                      left: -20,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                      dataKey="date"
                      stroke="var(--muted-foreground)"
                      tick={{ fill: "var(--muted-foreground)", fontSize: "0.75rem", dy: 10 }}
                      tickFormatter={(value) => {
                        const [day, month] = value.split("/");
                        return `${day}/${month}`;
                      }}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      tick={{ fill: "var(--muted-foreground)", fontSize: "0.75rem" }}
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      width={65}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--card)",
                        border: "1px solid var(--border)",
                        color: "var(--card-foreground)",
                      }}
                      wrapperStyle={{
                        boxShadow: "var(--shadow)",
                      }}
                      formatter={(value) => [`${value.toFixed(1)}%`]}
                    />
                    <Line
                      type="monotone"
                      dataKey="percentage"
                      stroke="var(--chart-5)"
                      strokeWidth={2}
                      dot={{ fill: "var(--chart-5)", r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Present"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AttendanceCard;
