import React, { useState, useEffect } from "react";
import AttendanceCard from "./AttendanceCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import CircleProgress from "./CircleProgress";
import { Check, Loader2, AlertCircle, ChevronDown, ChevronUp, ListFilter, SortAsc, SortDesc } from "lucide-react";

const Attendance = ({
  w,
  attendanceData,
  setAttendanceData,
  semestersData,
  setSemestersData,
  selectedSem,
  setSelectedSem,
  attendanceGoal,
  setAttendanceGoal,
  subjectAttendanceData,
  setSubjectAttendanceData,
  selectedSubject,
  setSelectedSubject,
  isAttendanceMetaLoading,
  setIsAttendanceMetaLoading,
  isAttendanceDataLoading,
  setIsAttendanceDataLoading,
  activeTab,
  setActiveTab,
  dailyDate,
  setDailyDate,
  calendarOpen,
  setCalendarOpen,
  isTrackerOpen,
  setIsTrackerOpen,
  subjectCacheStatus,
  setSubjectCacheStatus,
}) => {
  useEffect(() => {
    const fetchSemesters = async () => {
      if (semestersData) {
        if (semestersData.semesters.length > 0 && !selectedSem) {
          setSelectedSem(semestersData.latest_semester);
        }
        return;
      }

      setIsAttendanceMetaLoading(true);
      setIsAttendanceDataLoading(true);
      try {
        const meta = await w.get_attendance_meta();
        const header = meta.latest_header();
        const latestSem = meta.latest_semester();

        setSemestersData({
          semesters: meta.semesters,
          latest_header: header,
          latest_semester: latestSem,
        });

        try {
          const data = await w.get_attendance(header, latestSem);
          setAttendanceData((prev) => ({
            ...prev,
            [latestSem.registration_id]: data,
          }));
          setSelectedSem(latestSem);
        } catch (error) {
          console.log(error.message);
          console.log(error.status);
          if (error.message.includes("NO Attendance Found")) {
            // If latest semester has no attendance, try the previous one
            const previousSem = meta.semesters[1]; // Index 1 is the second most recent semester
            if (previousSem) {
              const data = await w.get_attendance(header, previousSem);
              setAttendanceData((prev) => ({
                ...prev,
                [previousSem.registration_id]: data,
              }));
              setSelectedSem(previousSem);
              console.log(previousSem);
            }
          } else {
            throw error;
          }
        }
      } catch (error) {
        console.error("Failed to fetch attendance:", error);
      } finally {
        setIsAttendanceMetaLoading(false);
        setIsAttendanceDataLoading(false);
      }
    };

    fetchSemesters();
  }, [w, setAttendanceData, semestersData, setSemestersData]);

  const handleSemesterChange = async (value) => {
    // Update selected semester immediately
    const semester = semestersData.semesters.find((sem) => sem.registration_id === value);
    setSelectedSem(semester);

    setIsAttendanceDataLoading(true);
    try {
      if (attendanceData[value]) {
        setIsAttendanceDataLoading(false);
        return;
      }

      const meta = await w.get_attendance_meta();
      const header = meta.latest_header();
      const data = await w.get_attendance(header, semester);
      setAttendanceData((prev) => ({
        ...prev,
        [value]: data,
      }));
    } catch (error) {
      if (error.message.includes("NO Attendance Found")) {
        // Show message that attendance is not available for this semester
        setAttendanceData((prev) => ({
          ...prev,
          [value]: { error: "Attendance not available for this semester" },
        }));
      } else {
        console.error("Failed to fetch attendance:", error);
      }
    } finally {
      setIsAttendanceDataLoading(false);
    }
  };

  const handleGoalChange = (e) => {
    const value = e.target.value === "" ? "" : parseInt(e.target.value);
    if (value === "" || (!isNaN(value) && value > 0 && value <= 100)) {
      setAttendanceGoal(value);
    }
  };

  const [perSubReadyBySem, setPerSubReadyBySem] = useState({});
  const semId = selectedSem?.registration_id;
  const semAttendance = attendanceData?.[semId];
  const list = semAttendance?.studentattendancelist;

  const perSubLoading =
    !!semId &&
    Array.isArray(attendanceData[semId]?.studentattendancelist) &&
    attendanceData[semId]?.studentattendancelist.length > 0 &&
    !attendanceData[semId]?.error &&
    perSubReadyBySem[semId] !== true;

  const pageLoading = isAttendanceMetaLoading || isAttendanceDataLoading;

  useEffect(() => {
    if (!selectedSem) return;
    if (!Array.isArray(list) || list.length === 0) return;
    if (semAttendance?.error) return;

    // Since this effect will do multiple network calls, it is very costly, to prevent unnecessary costs:
    // do nothing if sem data is present
    if (perSubReadyBySem?.[semId] === true) return;
    // flag for async ops of each subject, state refers e.g. changing sem mid loading for all subjs etc.
    let stateChanged = false;

    (async () => {
      setPerSubReadyBySem((p) => ({ ...(p || {}), [semId]: false }));
      await Promise.all(
        list.map(async (item) => {
          const name = item.subjectcode;

          if (subjectAttendanceData?.[name]) {
            if (!stateChanged) setSubjectCacheStatus((p) => ({ ...(p || {}), [name]: "cached" }));
            return;
          }
          if (!stateChanged) setSubjectCacheStatus((p) => ({ ...(p || {}), [name]: "fetching" }));

          try {
            const subjectData = semAttendance.studentattendancelist.find((s) => s.subjectcode === name);
            if (!subjectData) {
              if (!stateChanged) {
                setSubjectAttendanceData((p) => ({ ...(p || {}), [name]: [] }));
                setSubjectCacheStatus((p) => ({ ...(p || {}), [name]: "cached" }));
              }
              return;
            }

            const subjectcomponentids = ["Lsubjectcomponentid", "Psubjectcomponentid", "Tsubjectcomponentid"]
              .filter((id) => subjectData[id])
              .map((id) => subjectData[id]);

            const data = await w.get_subject_daily_attendance(
              selectedSem,
              subjectData.subjectid,
              subjectData.individualsubjectcode,
              subjectcomponentids
            );

            if (!stateChanged) {
              setSubjectAttendanceData((p) => ({
                ...(p || {}),
                [name]: data?.studentAttdsummarylist ?? [],
              }));
              setSubjectCacheStatus((p) => ({ ...(p || {}), [name]: "cached" }));
            }
          } catch (e) {
            if (!stateChanged) {
              setSubjectAttendanceData((p) => ({ ...(p || {}), [name]: [] }));
              setSubjectCacheStatus((p) => ({ ...(p || {}), [name]: "cached" }));
            }
          }
        })
      );

      if (!stateChanged) setPerSubReadyBySem((p) => ({ ...(p || {}), [semId]: true }));
    })();

    return () => {
      stateChanged = true;
    };
  }, [
    w,
    selectedSem?.registration_id,
    attendanceData?.[semId]?.studentattendancelist?.length,
    attendanceData?.[semId]?.error,
    perSubReadyBySem?.[semId],
  ]);

  // this function calculates the attended and total class from the daily subject wise attendance (as used in AttendanceCard for graph)
  function getAttendanceFromDaily(attendances) {
    let attended, total;
    if (attendances === undefined) {
      return { attended: null, total: null };
    }
    total = attendances.length;
    attended = 0;
    for (const attendance of attendances) {
      if (attendance.present === "Present") {
        attended++;
      }
    }
    return { attended, total };
  }

  const subjects =
    (selectedSem &&
      attendanceData[selectedSem.registration_id]?.studentattendancelist?.map((item) => {
        const {
          subjectcode,
          Ltotalclass,
          Ltotalpres,
          Lpercentage,
          Ttotalclass,
          Ttotalpres,
          Tpercentage,
          Ptotalclass,
          Ptotalpres,
          Ppercentage,
          LTpercantage,
        } = item;

        const { attended, total } = getAttendanceFromDaily(subjectAttendanceData[subjectcode]);
        const currentPercentage = (attended / total) * 100;
        const classesNeeded = attendanceGoal
          ? Math.ceil((attendanceGoal * total - 100 * attended) / (100 - attendanceGoal))
          : null;
        const classesCanMiss = attendanceGoal
          ? Math.floor((100 * attended - attendanceGoal * total) / attendanceGoal)
          : null;

        return {
          name: subjectcode,
          attendance: {
            attended,
            total,
          },
          combined: LTpercantage,
          lecture: Lpercentage,
          tutorial: Tpercentage,
          practical: Ppercentage,
          classesNeeded: classesNeeded > 0 ? classesNeeded : 0,
          classesCanMiss: classesCanMiss > 0 ? classesCanMiss : 0,
        };
      })) ||
    [];

  const fetchSubjectAttendance = async (subject) => {
    try {
      const attendance = attendanceData[selectedSem.registration_id];
      const subjectData = attendance.studentattendancelist.find((s) => s.subjectcode === subject.name);

      if (!subjectData) return;

      const subjectcomponentids = ["Lsubjectcomponentid", "Psubjectcomponentid", "Tsubjectcomponentid"]
        .filter((id) => subjectData[id])
        .map((id) => subjectData[id]);

      const data = await w.get_subject_daily_attendance(
        selectedSem,
        subjectData.subjectid,
        subjectData.individualsubjectcode,
        subjectcomponentids
      );

      setSubjectAttendanceData((prev) => ({
        ...prev,
        [subject.name]: data.studentAttdsummarylist,
      }));
    } catch (error) {
      console.error("Failed to fetch subject attendance:", error);
    }
  };

  // sort order for subjects: default, asc, desc
  const [attendanceSortOrder, setAttendanceSortOrder] = useState("default");

  const toggleSortOrder = () => {
    setAttendanceSortOrder((prev) => (prev === "default" ? "asc" : prev === "asc" ? "desc" : "default"));
  };

  // load saved sort order from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("attendanceSortOrder");
      if (saved === "asc" || saved === "desc" || saved === "default") setAttendanceSortOrder(saved);
    } catch (e) {
      // ignore
    }
  }, []);

  // persist sort order
  useEffect(() => {
    try {
      localStorage.setItem("attendanceSortOrder", attendanceSortOrder);
    } catch (e) {
      // ignore
    }
  }, [attendanceSortOrder]);

  // Can be removed since now attended/total is calcuated after fetching attendance for each subject 

  //   useEffect(() => {
  //     if (activeTab !== "daily") return;
  // 
  //     const loadAllSubjects = async () => {
  //       await Promise.all(
  //         subjects.map(async (subj) => {
  //           if (subjectAttendanceData[subj.name]) {
  //             setSubjectCacheStatus((p) => ({ ...p, [subj.name]: "cached" }));
  //             return;
  //           }
  //           setSubjectCacheStatus((p) => ({ ...p, [subj.name]: "fetching" }));
  //           await fetchSubjectAttendance(subj); // server round‑trip
  //           setSubjectCacheStatus((p) => ({ ...p, [subj.name]: "cached" }));
  //         })
  //       );
  //     };
  //     loadAllSubjects();
  //   }, [activeTab]);

  const getClassesFor = (subjectName, date) => {
    const all = subjectAttendanceData[subjectName];
    if (!all) return [];
    const key = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return all.filter((c) => c.datetime.startsWith(key));
  };

  // compute sortedSubjects according to selected attendanceSortOrder
  let sortedSubjects = [...subjects];
  const getSortValue = (subject) => {
    const attended = subject.attendance?.attended ?? 0;
    const total = subject.attendance?.total ?? 0;
    // treat 0/0 as very high so they appear on top (matches original behavior)
    //if (total === 0 && attended === 0) return 1000;
    // prefer provided combined percentage, fallback to computed percentage
    if (typeof subject.combined === "number") return subject.combined;
    return total === 0 ? 0 : (attended / total) * 100;
  };

  if (attendanceSortOrder === "asc") {
    sortedSubjects.sort((a, b) => getSortValue(a) - getSortValue(b));
  } else if (attendanceSortOrder === "desc") {
    sortedSubjects.sort((a, b) => getSortValue(b) - getSortValue(a));
  }

  return (
    <div className="text-foreground font-sans">
      <div className="sticky top-[var(--header-height)] bg-background z-20">
        <div className="flex gap-2 py-2 px-3">
          <Select onValueChange={handleSemesterChange} value={selectedSem?.registration_id}>
            <SelectTrigger className="bg-background text-foreground border-foreground cursor-pointer hover:bg-accent hover:text-accent-foreground">
              <SelectValue placeholder={isAttendanceMetaLoading ? "Loading semesters..." : "Select semester"}>
                {selectedSem?.registration_code}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-background text-foreground border-foreground">
              {semestersData?.semesters?.map((sem) => (
                <SelectItem key={sem.registration_id} value={sem.registration_id}>
                  {sem.registration_code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={attendanceGoal}
            onChange={handleGoalChange}
            min="-1"
            max="100"
            className="w-32 bg-background text-foreground border-foreground hover:bg-input/30"
            placeholder="Goal %"
          />
          <Button
            onClick={toggleSortOrder}
            title="Toggle sort order"
            className="bg-background text-foreground rounded-md px-3 py-1 flex items-center justify-center hover:opacity-90 border border-foreground"
          >
            {attendanceSortOrder === "default" && <ListFilter className="w-4 h-4" />}
            {attendanceSortOrder === "asc" && <SortAsc className="w-4 h-4" />}
            {attendanceSortOrder === "desc" && <SortDesc className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {pageLoading ? (
        <div className="flex items-center justify-center py-4 h-[calc(100vh_-_<header_height>-<navbar_height>)]">
          Loading attendance...
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-3 pb-4">
          <TabsList className="grid grid-cols-2 bg-background gap-3">
            <TabsTrigger
              value="overview"
              className="cursor-pointer text-muted-foreground bg-background data-[state=active]:bg-muted data-[state=active]:text-foreground"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="daily"
              className="cursor-pointer text-muted-foreground bg-background data-[state=active]:bg-muted data-[state=active]:text-foreground"
            >
              Day‑to‑Day
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {selectedSem && attendanceData[selectedSem.registration_id]?.error ? (
              <div className="flex items-center justify-center py-4">
                {attendanceData[selectedSem.registration_id].error}
              </div>
            ) : (
              <div className="space-y-4 mt-4 pb-4">
                {sortedSubjects.map((subject) => (
                  <AttendanceCard
                    key={subject.name}
                    subject={subject}
                    selectedSubject={selectedSubject}
                    setSelectedSubject={setSelectedSubject}
                    subjectAttendanceData={subjectAttendanceData}
                    fetchSubjectAttendance={fetchSubjectAttendance}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="daily">
            <div className="flex flex-col items-center">
              <div className="w-full max-w-[320px] flex flex-col">
                <button
                  onClick={() => setCalendarOpen((o) => !o)}
                  className="flex items-center justify-between bg-card text-card-foreground rounded-md px-3 py-2 mb-2 text-sm cursor-pointer"
                >
                  <span>{dailyDate.toDateString()}</span>
                  {calendarOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {calendarOpen && (
                  <Calendar
                    mode="single"
                    selected={dailyDate}
                    onSelect={(d) => {
                      if (d) {
                        setDailyDate(d);
                      }
                    }}
                    modifiers={{
                      hasActivity: (date) => subjects.some((s) => getClassesFor(s.name, date).length > 0),
                    }}
                    modifiersStyles={{
                      hasActivity: {
                        boxShadow: "inset 0 -2px 0 0 var(--color-primary)",
                        borderRadius: "3px",
                      },
                    }}
                    // className={` pb-2 text-foreground w-full shrink-0 max-w-full`}
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
                      presentation: "bg-destructive",
                      head_row: "flex",
                      head_cell:
                        "text-foreground opacity-50 rounded-md flex-1 font-normal text-[0.8rem] max-[390px]:text-[0.7rem]",
                      row: "flex w-full mt-2",
                      cell: "flex-1 text-center text-sm p-0 relative first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: "h-8 w-8 p-0 font-normal rounded-[2px] aria-selected:opacity-100 mx-auto max-[390px]:h-6 max-[390px]:w-6 max-[390px]:text-xs",
                      day_selected: "bg-accent/50 rounded-xs!",
                      day_today: "text-foreground bg-accent/50! rounded-full!",
                      day_outside: "text-muted-foreground opacity-30",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_range_middle: "aria-selected:bg-accent aria-selected:text-foreground",
                      day_hidden: "invisible",
                    }}
                  />
                )}
              </div>

              {subjects.length === 0 ? (
                <p className="text-muted-foreground">No subjects found.</p>
              ) : (
                subjects.flatMap((subj) => {
                  const lectures = getClassesFor(subj.name, dailyDate);
                  if (lectures.length === 0) return [];
                  return (
                    <div key={subj.name} className="w-full max-w-lg border-b border-border py-3">
                      <h3 className="font-semibold mb-1">{subj.name}</h3>
                      {lectures.map((cls, i) => (
                        <div
                          key={i}
                          className={`flex justify-between text-sm ${cls.present === "Present" ? "text-chart-1" : "text-chart-2"
                            }`}
                        >
                          <span>
                            {cls.classtype} • {cls.present}
                          </span>
                          <span>{cls.datetime.split(" ").slice(1).join(" ").slice(1, -1)}</span>
                        </div>
                      ))}
                    </div>
                  );
                })
              )}

              {/* nothing on that day? */}
              {subjects.every((s) => getClassesFor(s.name, dailyDate).length === 0) && (
                <p className="text-muted-foreground mt-4">
                  No classes were scheduled on&nbsp;
                  {dailyDate.toLocaleDateString()}
                </p>
              )}
            </div>

            {subjects.length > 0 && Object.values(subjectCacheStatus).some((s) => s !== "cached") && (
              <Sheet open={isTrackerOpen} onOpenChange={setIsTrackerOpen}>
                <SheetTrigger asChild>
                  <button
                    className="fixed bottom-20 right-4 z-50
                           bg-card shadow rounded-full
                           ring-ring
                           hover:scale-105
                           transition-transform cursor-pointer"
                  >
                    <CircleProgress
                      percentage={
                        (100 * subjects.filter((s) => subjectCacheStatus[s.name] === "cached").length) / subjects.length
                      }
                      label={`${subjects.filter((s) => subjectCacheStatus[s.name] === "cached").length}/${subjects.length
                        }`}
                    />
                  </button>
                </SheetTrigger>

                <SheetContent
                  side="bottom"
                  /* hide default close button & force white text */
                  className="h-[45vh] bg-background text-foreground border-0 overflow-hidden
                         **:data-radix-dialog-close:hidden"
                >
                  <SheetHeader>
                    <SheetTitle className="text-sm text-foreground">
                      Fetching daily attendance&nbsp;(
                      {subjects.filter((s) => subjectCacheStatus[s.name] === "cached").length}/{subjects.length})
                    </SheetTitle>
                  </SheetHeader>

                  <div className="mt-4 space-y-4 px-1 overflow-y-auto h-[calc(100%-3rem)]">
                    <Progress
                      value={
                        (100 * subjects.filter((s) => subjectCacheStatus[s.name] === "cached").length) / subjects.length
                      }
                      className="h-2 bg-muted"
                      indicatorClassName={"bg-primary"}
                    />

                    <div className="divide-y divide-white/10 mt-4 overflow-y-auto h-[calc(100%-5rem)] pr-1">
                      {subjects.map((s) => {
                        const st = subjectCacheStatus[s.name] || "idle";
                        return (
                          <div key={s.name} className="py-3 flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{s.name}</p>
                            </div>
                            {st === "cached" && <Check className="text-primary w-5 h-5" />}
                            {st === "fetching" && <Loader2 className="animate-spin text-muted-foreground w-5 h-5" />}
                            {st === "idle" && <AlertCircle className="text-primary w-5 h-5" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Attendance;
