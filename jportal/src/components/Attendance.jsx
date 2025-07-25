import React, { useState, useEffect, useRef } from "react";
import AttendanceCard from "./AttendanceCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import Loader from "./Loader";
import { TextField } from "@mui/material";
import CircleProgress from "./CircleProgress";
import { Button } from "@/components/ui/button";
import { ListFilter, SortAsc, SortDesc } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTheme } from "./ThemeProvider";
import MuiButton from "@mui/material/Button";
import MuiMenuItem from "@mui/material/MenuItem";
import MuiSelect from "@mui/material/Select";
import { FormControl, InputLabel } from "@mui/material";
import TopTabsBar from "./ui/TopTabsBar";
import { useLocation } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import Toast from "./ui/Toast";

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
  guest = false,
}) => {
  const [attendanceSortOrder, setAttendanceSortOrder] = useState("default"); // default, asc, desc
  const {
    useMaterialUI,
    useCardBackgrounds,
    theme,
    customThemes,
    selectedCustomTheme,
  } = useTheme();
  const accentSeparator =
    theme === "custom"
      ? customThemes[selectedCustomTheme]?.colors["--accent-color"] || "#7ec3f0"
      : theme === "white"
      ? "#3182ce"
      : theme === "cream"
      ? "#A47551"
      : theme === "amoled"
      ? "#00bcd4"
      : "#7ec3f0";

  const toggleSortOrder = () => {
    setAttendanceSortOrder((prev) =>
      prev === "default" ? "asc" : prev === "asc" ? "desc" : "default"
    );
  };

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
    const semester = semestersData.semesters.find(
      (sem) => sem.registration_id === value
    );
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

  const subjects =
    (selectedSem &&
      attendanceData[selectedSem.registration_id]?.studentattendancelist?.map(
        (item) => {
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

          const { attended, total } = {
            attended: (Ltotalpres || 0) + (Ttotalpres || 0) + (Ptotalpres || 0),
            total: (Ltotalclass || 0) + (Ttotalclass || 0) + (Ptotalclass || 0),
          };

          const currentPercentage = (attended / total) * 100;
          const classesNeeded = attendanceGoal
            ? Math.ceil(
                (attendanceGoal * total - 100 * attended) /
                  (100 - attendanceGoal)
              )
            : null;
          const classesCanMiss = attendanceGoal
            ? Math.floor(
                (100 * attended - attendanceGoal * total) / attendanceGoal
              )
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
        }
      )) ||
    [];

  const fetchSubjectAttendance = async (subject) => {
    try {
      const attendance = attendanceData[selectedSem.registration_id];
      const subjectData = attendance.studentattendancelist.find(
        (s) => s.subjectcode === subject.name
      );

      if (!subjectData) return;

      const subjectcomponentids = [
        "Lsubjectcomponentid",
        "Psubjectcomponentid",
        "Tsubjectcomponentid",
      ]
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
      setSubjectCacheStatus((p) => ({ ...p, [subject.name]: "cached" }));
    } catch (error) {
      if (error.message && error.message.includes("NO Attendance Found")) {
        setSubjectCacheStatus((p) => ({
          ...p,
          [subject.name]: "noattendance",
        }));
      } else {
        console.error("Failed to fetch subject attendance:", error);
      }
    }
  };

  const [internalTab, setInternalTab] = useState(activeTab || "overview");
  const location = useLocation();
  useEffect(() => {
    if (location.pathname === "/attendance") {
      const entryTab = localStorage.getItem("attendanceEntryTab") || "overview";
      if (internalTab !== entryTab) {
        setInternalTab(entryTab);
      }
    }
  }, [location.pathname]);

  const tabOrder = ["overview", "daily"];
  useEffect(() => {
    function handleSwipe(e) {
      const direction = e.detail.direction;
      const currentIndex = tabOrder.indexOf(internalTab);
      if (direction === "left" && currentIndex < tabOrder.length - 1) {
        setInternalTab(tabOrder[currentIndex + 1]);
      } else if (direction === "right" && currentIndex > 0) {
        setInternalTab(tabOrder[currentIndex - 1]);
      }
    }
    window.addEventListener("attendanceSwipe", handleSwipe);
    return () => window.removeEventListener("attendanceSwipe", handleSwipe);
  }, [internalTab]);

  // sort order in localStorage
  useEffect(() => {
    const savedOrder = localStorage.getItem("attendanceSortOrder");
    if (
      savedOrder === "asc" ||
      savedOrder === "desc" ||
      savedOrder === "default"
    ) {
      setAttendanceSortOrder(savedOrder);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("attendanceSortOrder", attendanceSortOrder);
  }, [attendanceSortOrder]);

  let sortedSubjects = [...subjects];
  // 0/0 -> 100%
  const getSortValue = (subject) => {
    const attended = subject.attendance?.attended ?? 0;
    const total = subject.attendance?.total ?? 0;
    if (total === 0 && attended === 0) return 101; // lol more than 100 so that alwasy on top
    return subject.combined ?? 0;
  };
  if (attendanceSortOrder === "asc") {
    sortedSubjects.sort((a, b) => getSortValue(a) - getSortValue(b));
  } else if (attendanceSortOrder === "desc") {
    sortedSubjects.sort((a, b) => getSortValue(b) - getSortValue(a));
  }

  // ref to track if subject attendance has been fetched for the current semester
  const hasFetchedSubjectAttendance = useRef({});
  // swipping led to this uff

  useEffect(() => {
    // only fetch when entering 'daily' tab, and only once per semester
    if (
      internalTab === "daily" &&
      selectedSem?.registration_id &&
      !hasFetchedSubjectAttendance.current[selectedSem.registration_id]
    ) {
      hasFetchedSubjectAttendance.current[selectedSem.registration_id] = true;
      Promise.all(
        subjects.map(async (subj) => {
          if (
            subjectAttendanceData[subj.name] ||
            subjectCacheStatus[subj.name] === "noattendance"
          ) {
            setSubjectCacheStatus((p) => ({ ...p, [subj.name]: "cached" }));
            return;
          }
          setSubjectCacheStatus((p) => ({ ...p, [subj.name]: "fetching" }));
          try {
            await fetchSubjectAttendance(subj);
          } catch (error) {
            if (
              error.message &&
              error.message.includes("NO Attendance Found")
            ) {
              setSubjectCacheStatus((p) => ({
                ...p,
                [subj.name]: "noattendance",
              }));
            } else {
              console.error("Failed to fetch subject attendance:", error);
            }
          }
        })
      );
    }
  }, [internalTab, selectedSem?.registration_id, subjects]);

  // reset the ref if the semester changes (so we can fetch for new semester)
  useEffect(() => {
    if (selectedSem?.registration_id) {
      if (!hasFetchedSubjectAttendance.current[selectedSem.registration_id]) {
        // reset subject cache status for new semester
        setSubjectCacheStatus({});
      }
    }
  }, [selectedSem?.registration_id]);

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

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] font-sans px-2 pb-32 pt-2">
      {guest && (
        <div className="w-full max-w-3xl mx-auto mb-4 rounded-[var(--radius)] bg-[var(--accent-color)] text-[var(--bg-color)] text-center py-2 font-semibold shadow-md">
          Guest Demo: Viewing Sample Data
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-2 items-center justify-center mb-2">
        <div className="flex flex-row gap-1 items-center justify-center w-full max-w-md px-0 py-0">
          {/* Semester Select */}
          {useMaterialUI ? (
            <FormControl fullWidth variant="outlined">
              <InputLabel
                id="semester-label"
                sx={{ color: "var(--label-color)" }}
              >
                Semester
              </InputLabel>
              <MuiSelect
                labelId="semester-label"
                label="Semester"
                value={selectedSem?.registration_id || ""}
                onChange={(e) => handleSemesterChange(e.target.value)}
                displayEmpty
                variant="outlined"
                fullWidth
                sx={{
                  minWidth: 120,
                  background: "var(--card-bg)",
                  color: "var(--text-color)",
                  borderRadius: "var(--radius)",
                  fontSize: "1.1rem",
                  fontWeight: 300,
                  height: 44,
                  boxShadow: "none",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "var(--radius)",
                    background: "var(--card-bg)",
                    color: "var(--text-color)",
                    fontSize: "1.1rem",
                    fontWeight: 300,
                    border: "1px solid var(--label-color)",
                    boxShadow: "none",
                    "& fieldset": {
                      borderColor: "var(--label-color)",
                    },
                    "&:hover fieldset": {
                      borderColor: "var(--accent-color)",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "var(--accent-color)",
                    },
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--label-color)",
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--accent-color)",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "var(--accent-color)",
                  },
                }}
              >
                <MuiMenuItem value="" disabled>
                  {isAttendanceMetaLoading
                    ? "Loading semesters..."
                    : "Semester"}
                </MuiMenuItem>
                {semestersData?.semesters?.map((sem) => (
                  <MuiMenuItem
                    key={sem.registration_id}
                    value={sem.registration_id}
                  >
                    {sem.registration_code}
                  </MuiMenuItem>
                ))}
              </MuiSelect>
            </FormControl>
          ) : (
            <Select
              onValueChange={handleSemesterChange}
              value={selectedSem?.registration_id}
            >
              <SelectTrigger className="w-full bg-[var(--card-bg)] text-[var(--text-color)] border border-[var(--label-color)] rounded-[var(--radius)] px-4 py-2 flex items-center font-light focus:ring-2 focus:ring-[var(--accent-color)] outline-none transition-all min-h-[44px] h-[44px] text-[1.1rem] shadow-md">
                <SelectValue
                  placeholder={
                    isAttendanceMetaLoading
                      ? "Loading semesters..."
                      : "Semester"
                  }
                >
                  {selectedSem?.registration_code || "Semester"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[var(--card-bg)] text-[var(--text-color)] border-[var(--accent-color)] rounded-[var(--radius)] shadow-lg">
                {semestersData?.semesters?.map((sem) => (
                  <SelectItem
                    key={sem.registration_id}
                    value={sem.registration_id}
                  >
                    {sem.registration_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {/* Input for attendanceGoal */}
          {useMaterialUI ? (
            <TextField
              type="number"
              value={attendanceGoal}
              onChange={(e) => handleGoalChange(e)}
              variant="outlined"
              label="Criteria"
              InputLabelProps={{
                style: {
                  height: 48,
                  minHeight: 48,
                  color: "var(--label-color)",
                  fontSize: "1.1rem",
                  fontWeight: 300,
                },
              }}
              inputProps={{
                style: {
                  color: "var(--text-color)",
                  fontSize: "1.1rem",
                  fontWeight: 300,
                  padding: "0 12px",
                  borderRadius: "var(--radius)",
                  height: 40,
                  boxSizing: "border-box",
                  background: "var(--card-bg)",
                },
              }}
              sx={{
                width: "110px",
                minWidth: "90px",
                maxWidth: "140px",
                marginLeft: 1,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "var(--radius)",
                  background: "var(--card-bg)",
                  borderColor: "var(--label-color)",
                  fontSize: "1.1rem",
                  fontWeight: 300,
                  color: "var(--text-color)",
                  height: "40px",
                  minHeight: "40px",
                  padding: 0,
                  "& fieldset": {
                    borderColor: "var(--label-color)",
                  },
                  "&:hover fieldset": {
                    borderColor: "var(--accent-color)",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "var(--accent-color)",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "var(--label-color)",
                  fontSize: "1.1rem",
                  fontWeight: 300,
                },
              }}
            />
          ) : (
            <Input
              type="number"
              value={attendanceGoal}
              onChange={handleGoalChange}
              className="w-[110px] min-w-[90px] max-w-[140px] ml-1 bg-[var(--card-bg)] border border-[var(--label-color)] text-[var(--text-color)] placeholder:text-[var(--label-color)] focus:border-[var(--accent-color)] focus:ring-[var(--accent-color)]"
              style={{
                fontSize: "1.1rem",
                fontWeight: 300,
                height: 40,
                borderRadius: "var(--radius)",
              }}
              placeholder="Criteria"
            />
          )}
          {/* Sort Button */}
          {useMaterialUI ? (
            <MuiButton
              variant="outlined"
              onClick={toggleSortOrder}
              sx={{
                ml: 2,
                border: "1px solid var(--label-color)",
                background: "var(--card-bg)",
                color: "var(--text-color)",
                borderRadius: "var(--radius)",
                width: 48,
                height: 44,
                minWidth: 48,
                minHeight: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                "&:hover": {
                  background: "var(--accent-color)",
                  color: "var(--card-bg)",
                },
                "&.Mui-focusVisible": {
                  outline: "2px solid var(--accent-color)",
                },
              }}
            >
              {attendanceSortOrder === "default" && (
                <ListFilter className="w-5 h-5" />
              )}
              {attendanceSortOrder === "asc" && <SortAsc className="w-5 h-5" />}
              {attendanceSortOrder === "desc" && (
                <SortDesc className="w-5 h-5" />
              )}
            </MuiButton>
          ) : (
            <Button
              variant="outline"
              size="icon"
              aria-label="Sort by attendance"
              onClick={toggleSortOrder}
              className="ml-2 border border-[var(--label-color)] bg-[var(--card-bg)] text-[var(--text-color)] hover:bg-[var(--accent-color)] hover:text-[var(--card-bg)] focus:ring-2 focus:ring-[var(--accent-color)] rounded-[var(--radius)]"
              style={{
                width: 48,
                height: 44,
                minWidth: 48,
                minHeight: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {attendanceSortOrder === "default" && (
                <ListFilter className="w-5 h-5" />
              )}
              {attendanceSortOrder === "asc" && <SortAsc className="w-5 h-5" />}
              {attendanceSortOrder === "desc" && (
                <SortDesc className="w-5 h-5" />
              )}
            </Button>
          )}
        </div>
      </div>
      {isAttendanceMetaLoading || isAttendanceDataLoading ? (
        <Loader
          message="Loading attendance..."
          className="text-base sm:text-lg font-medium"
        />
      ) : (
        <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-0 lg:gap-0 lg:min-h-[600px]">
          {/* Sidebar Tabs for large screens, horizontal for small */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <Tabs
              value={internalTab}
              onValueChange={setInternalTab}
              className="w-full lg:w-64"
            >
              <TopTabsBar
                orientation="vertical"
                className="mb-2 h-[40px] items-center grid-cols-2 lg:grid-cols-1 lg:w-64 lg:h-auto lg:mb-0 lg:py-4 lg:gap-2 lg:block hidden"
              >
                <TabsTrigger
                  value="overview"
                  className="flex items-center justify-center h-full w-full data-[state=active]:bg-[var(--primary-color)] data-[state=active]:text-[var(--text-color)] text-[var(--label-color)] text-[1.1rem] font-medium transition-colors lg:justify-start lg:px-6 lg:py-3 lg:w-full lg:rounded-none lg:data-[state=active]:rounded-2xl"
                >
                  <span className="flex items-center justify-center w-full h-full lg:justify-start lg:w-auto">
                    Overview
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="daily"
                  className="flex items-center justify-center h-full w-full data-[state=active]:bg-[var(--primary-color)] data-[state=active]:text-[var(--text-color)] text-[var(--label-color)] text-[1.1rem] font-medium transition-colors lg:justify-start lg:px-6 lg:py-3 lg:w-full lg:rounded-none lg:data-[state=active]:rounded-2xl"
                >
                  <span className="flex items-center justify-center w-full h-full lg:justify-start lg:w-auto">
                    Day-to-Day
                  </span>
                </TabsTrigger>
              </TopTabsBar>
              {/* Mobile TabsList (horizontal bar) */}
              <div className="w-full lg:hidden">
                <TopTabsBar
                  orientation="horizontal"
                  className="w-full flex flex-row justify-between h-12"
                >
                  <TabsTrigger
                    value="overview"
                    className="flex-1 text-lg font-semibold data-[state=active]:bg-[var(--card-bg)] data-[state=active]:text-[var(--accent-color)] text-[var(--label-color)] transition-colors"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="daily"
                    className="flex-1 text-lg font-semibold data-[state=active]:bg-[var(--card-bg)] data-[state=active]:text-[var(--accent-color)] text-[var(--label-color)] transition-colors"
                  >
                    Day-to-Day
                  </TabsTrigger>
                </TopTabsBar>
              </div>
            </Tabs>
          </div>
          {/* Content Area */}
          <div className="w-full lg:flex-1 lg:pl-10 lg:min-h-[600px]">
            <Tabs
              value={internalTab}
              onValueChange={setInternalTab}
              className="w-full"
            >
              <TabsContent value="overview">
                <div
                  className={`flex flex-col ${
                    useCardBackgrounds ? "gap-2" : "gap-1"
                  } items-center`}
                >
                  {sortedSubjects.length === 0 ? (
                    <div
                      className={`w-full max-w-xl mx-auto ${
                        useCardBackgrounds
                          ? "bg-[var(--card-bg)] text-[var(--accent-color)] dark:text-[var(--accent-color)] rounded-[var(--radius)] shadow-md"
                          : ""
                      } px-8 py-8 flex items-center justify-center text-center text-base sm:text-lg font-medium`}
                    >
                      No subjects found.
                    </div>
                  ) : (
                    sortedSubjects.map((subject, idx) => (
                      <React.Fragment key={subject.name}>
                        <AttendanceCard
                          subject={subject}
                          selectedSubject={selectedSubject}
                          setSelectedSubject={setSelectedSubject}
                          subjectAttendanceData={subjectAttendanceData}
                          fetchSubjectAttendance={fetchSubjectAttendance}
                          attendanceGoal={attendanceGoal}
                          useCardBackgrounds={useCardBackgrounds}
                        />
                        {!useCardBackgrounds &&
                          idx < sortedSubjects.length - 1 && (
                            <div
                              className="w-full max-w-2xl mx-auto"
                              style={{
                                borderBottom: `1px solid ${accentSeparator}66`,
                                margin: "2px 0",
                              }}
                            />
                          )}
                      </React.Fragment>
                    ))
                  )}
                </div>
              </TabsContent>
              <TabsContent value="daily">
                {/* Day-to-day calendar and daily attendance breakdown */}
                {/* this toast the progress bar or the circle thing this actually tells whats happing pahle it required some guesswork */}
                <Toast
                  message={
                    subjects.length === 0
                      ? "No subjects to load."
                      : subjects.every(
                          (s) =>
                            subjectCacheStatus[s.name] === "cached" ||
                            subjectCacheStatus[s.name] === "noattendance"
                        )
                      ? `All ${subjects.length} subjects loaded!`
                      : `Loaded ${
                          subjects.filter(
                            (s) => subjectCacheStatus[s.name] === "cached"
                          ).length
                        } of ${subjects.length} subjects...`
                  }
                  progress={
                    subjects.filter(
                      (s) => subjectCacheStatus[s.name] === "cached"
                    ).length
                  }
                  total={subjects.length}
                  type={
                    subjects.every(
                      (s) =>
                        subjectCacheStatus[s.name] === "cached" ||
                        subjectCacheStatus[s.name] === "noattendance"
                    )
                      ? "success"
                      : "info"
                  }
                  duration={
                    subjects.every(
                      (s) =>
                        subjectCacheStatus[s.name] === "cached" ||
                        subjectCacheStatus[s.name] === "noattendance"
                    )
                      ? 3000
                      : null
                  }
                  loadedList={subjects
                    .filter((s) => subjectCacheStatus[s.name] === "cached")
                    .map((s) => s.name)}
                  pendingList={subjects
                    .filter(
                      (s) =>
                        (!subjectCacheStatus[s.name] ||
                          subjectCacheStatus[s.name] === "fetching") &&
                        subjectCacheStatus[s.name] !== "noattendance"
                    )
                    .map((s) => s.name)}
                  noAttendanceList={subjects
                    .filter(
                      (s) => subjectCacheStatus[s.name] === "noattendance"
                    )
                    .map((s) => s.name)}
                />
                <div className="flex flex-col items-center w-full">
                  <div
                    className={`w-full max-w-[370px] mx-auto flex flex-col items-center ${
                      useCardBackgrounds
                        ? "bg-[var(--card-bg)] rounded-[var(--radius)] shadow-md"
                        : ""
                    } p-4 mb-6`}
                  >
                    <button
                      onClick={() => setCalendarOpen((open) => !open)}
                      className={`
                      flex items-center justify-between w-full
                      bg-[var(--card-bg)] border border-[var(--accent-color)]
                      rounded-[var(--radius)] px-4 py-2 mb-2
                      text-base font-semibold text-[var(--text-color)]
                      transition-all duration-200
                      shadow-sm
                      hover:bg-[var(--accent-color)]/10
                      hover:border-[var(--primary-color)]
                      focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)]
                      active:scale-[0.98]
                      cursor-pointer
                    `}
                      style={{ minHeight: 44 }}
                      aria-label="Toggle calendar"
                    >
                      <span className="truncate">
                        {dailyDate.toLocaleDateString(undefined, {
                          weekday: "long",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span
                        className={`transition-transform duration-200 ${
                          calendarOpen ? "rotate-180" : ""
                        }`}
                      >
                        {calendarOpen ? (
                          <ChevronUp className="w-5 h-5 text-[var(--accent-color)]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[var(--accent-color)]" />
                        )}
                      </span>
                    </button>
                    {calendarOpen && (
                      <Calendar
                        mode="single"
                        selected={dailyDate}
                        onSelect={(d) => {
                          if (d) setDailyDate(d);
                        }}
                        modifiers={{
                          hasActivity: (date) =>
                            subjects.some(
                              (s) => getClassesFor(s.name, date).length > 0
                            ),
                        }}
                        modifiersStyles={{
                          hasActivity: {
                            boxShadow: "inset 0 -2px 0 0 var(--accent-color)",
                            borderRadius: "2px",
                          },
                        }}
                        className={`pb-2 w-full flex-shrink-0 max-w-full bg-[var(--card-bg)] text-[var(--text-color)] rounded-[var(--radius)] shadow-none border-0`}
                        classNames={{
                          months: "flex flex-col space-y-2",
                          month: "space-y-2 w-full",
                          caption:
                            "flex justify-center pt-1 items-center text-lg font-semibold text-[var(--text-color)] relative",
                          caption_label:
                            "text-lg font-semibold text-[var(--text-color)] mx-2",
                          nav: "flex items-center gap-0 absolute left-0 right-0 justify-between w-full px-2",
                          nav_button:
                            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 mx-0",
                          nav_button_previous: "",
                          nav_button_next: "",
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
                    )}
                  </div>
                  <div
                    className={`w-full max-w-2xl mx-auto flex flex-col ${
                      useCardBackgrounds ? "gap-4" : "gap-1"
                    }`}
                  >
                    {subjects.length === 0 ? (
                      <p className="text-[var(--label-color)] text-center text-base sm:text-lg font-medium">
                        No subjects found.
                      </p>
                    ) : (
                      subjects.flatMap((subj, idx) => {
                        const lectures = getClassesFor(subj.name, dailyDate);
                        if (lectures.length === 0) return [];
                        return [
                          <div
                            key={subj.name}
                            className={`w-full max-w-2xl mx-auto ${
                              useCardBackgrounds
                                ? "bg-[var(--card-bg)] rounded-[var(--radius)] shadow-sm"
                                : ""
                            } py-3 px-4 mb-2`}
                          >
                            <h3 className="font-medium mb-2 text-[var(--text-color)] text-base">
                              {subj.name}
                            </h3>
                            <div className="flex flex-col gap-2">
                              {lectures.map((cls, i) => (
                                <div
                                  key={i}
                                  className={`flex flex-col sm:flex-row sm:items-center justify-between rounded-[var(--radius)] px-2 py-1.5 ${
                                    cls.present === "Present"
                                      ? "bg-[var(--accent-color)]/10 text-[var(--accent-color)]"
                                      : "bg-[var(--error-color,#ef4444)]/10 text-[var(--error-color,#ef4444)]"
                                  }`}
                                >
                                  <div className="flex-1">
                                    <span className="font-medium text-sm">
                                      {cls.classtype}
                                    </span>
                                    <span className="mx-2">•</span>
                                    <span className="text-sm">
                                      {cls.present}
                                    </span>
                                  </div>
                                  <div className="text-xs font-mono opacity-80 mt-1 sm:mt-0">
                                    {cls.datetime
                                      .split(" ")
                                      .slice(1)
                                      .join(" ")
                                      .slice(1, -1)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>,
                          !useCardBackgrounds && idx < subjects.length - 1 && (
                            <div
                              key={subj.name + "-sep"}
                              className="w-full max-w-2xl mx-auto"
                              style={{
                                borderBottom: `1px solid ${accentSeparator}66`,
                                margin: "2px 0",
                              }}
                            />
                          ),
                        ];
                      })
                    )}
                    {/* nothing on that day? */}
                    {subjects.every(
                      (s) => getClassesFor(s.name, dailyDate).length === 0
                    ) && (
                      <p className="text-[var(--label-color)] mt-4 text-center text-base sm:text-lg font-medium">
                        No classes were scheduled on&nbsp;
                        {dailyDate.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
