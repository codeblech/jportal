import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GradeCard from "./GradeCard";
import { Button } from "@/components/ui/button";
import { Download, Calculator } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MarksCard from "./MarksCard";
import {
  generate_local_name,
  API,
} from "https://cdn.jsdelivr.net/npm/jsjiit@0.0.16/dist/jsjiit.esm.js";
import Loader from "./Loader";
import { useTheme } from "./ThemeProvider";
import {
  TextField as MuiTextField,
  Button as MuiButton,
  Select as MuiSelect,
  MenuItem as MuiMenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import TopTabsBar from "./ui/TopTabsBar";
import {
  formatDecimal,
  getGpaDecimal,
  getTargetGpaDecimal,
} from "../lib/utils";
import { useLocation } from "react-router-dom";
import Toast from "./ui/Toast";
import fakedata from "../../fakedata.json";

export default function Grades({
  w,
  gradesData,
  setGradesData,
  semesterData,
  setSemesterData,
  activeTab,
  setActiveTab,
  gradeCardSemesters,
  setGradeCardSemesters,
  selectedGradeCardSem,
  setSelectedGradeCardSem,
  gradeCard,
  setGradeCard,
  gradeCards,
  setGradeCards,
  marksSemesters,
  setMarksSemesters,
  selectedMarksSem,
  setSelectedMarksSem,
  marksData,
  setMarksData,
  marksSemesterData,
  setMarksSemesterData,
  gradesLoading,
  setGradesLoading,
  gradesError,
  setGradesError,
  gradeCardLoading,
  setGradeCardLoading,
  isDownloadDialogOpen,
  setIsDownloadDialogOpen,
  marksLoading,
  setMarksLoading,
  guest = false,
}) {
  // State for Target CGPA Calculator Modal
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [targetCGPA, setTargetCGPA] = useState("");
  const [requiredSGPA, setRequiredSGPA] = useState(null);
  const [calcError, setCalcError] = useState("");
  const {
    useMaterialUI,
    theme,
    customThemes,
    selectedCustomTheme,
    useCardBackgrounds,
  } = useTheme();

  // Determine if the current theme is light
  let isLightTheme = false;
  if (theme === "custom") {
    const custom = customThemes[selectedCustomTheme] || {};
    isLightTheme = !!custom.isLightTheme;
  } else {
    isLightTheme = theme === "cream" || theme === "white";
  }
  const sgpaColor = isLightTheme ? "#15803d" : "#4ADE80"; // deep green for light
  const cgpaColor = isLightTheme ? "#1e40af" : "#60A5FA"; // deep blue for light
  const sgpaTextColor = isLightTheme ? "text-green-800" : "text-green-400";
  const cgpaTextColor = isLightTheme ? "text-blue-800" : "text-blue-400";

  // Add state for sorting
  const [creditSort, setCreditSort] = useState("default"); // default, asc, desc
  const [gradeSort, setGradeSort] = useState("default"); // default, asc, desc

  const [internalTab, setInternalTab] = useState(activeTab || "overview");
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/grades") {
      const entryTab = localStorage.getItem("gradesEntryTab") || "overview";
      if (internalTab !== entryTab) {
        setInternalTab(entryTab);
      }
    }
  }, [location.pathname]);

  // Sorting logic for gradeCard.gradecard
  const getSortedGradeCard = () => {
    if (!gradeCard || !Array.isArray(gradeCard.gradecard)) return [];
    let arr = [...gradeCard.gradecard];
    if (creditSort !== "default") {
      arr.sort((a, b) =>
        creditSort === "asc"
          ? a.coursecreditpoint - b.coursecreditpoint
          : b.coursecreditpoint - a.coursecreditpoint
      );
    } else if (gradeSort !== "default") {
      // Sort by grade (A+ > A > B+ > B > ... > F)
      const gradeOrder = ["A+", "A", "B+", "B", "C+", "C", "D", "F"];
      arr.sort((a, b) => {
        const aIdx = gradeOrder.indexOf(a.grade);
        const bIdx = gradeOrder.indexOf(b.grade);
        if (gradeSort === "asc") return aIdx - bIdx;
        else return bIdx - aIdx;
      });
    }
    return arr;
  };

  // Button state cycling
  const nextSortState = (current) => {
    if (current === "default") return "asc";
    if (current === "asc") return "desc";
    return "default";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (semesterData) {
          setGradesLoading(false);
          return;
        }

        const data = await w.get_sgpa_cgpa();

        if (!data || Object.keys(data).length === 0) {
          setGradesError("Grade sheet is not available");
          return;
        }

        setGradesData(data);
        setSemesterData(data.semesterList);
      } catch (err) {
        if (err.message.includes("Unexpected end of JSON input")) {
          setGradesError("Grade sheet is not available");
        } else {
          setGradesError("Failed to fetch grade data");
        }
        console.error(err);
      } finally {
        setGradesLoading(false);
      }
    };
    fetchData();
  }, [w, semesterData, setGradesData, setSemesterData]);

  useEffect(() => {
    const fetchGradeCardSemesters = async () => {
      if (gradeCardSemesters.length === 0) {
        try {
          const semesters = await w.get_semesters_for_grade_card();
          setGradeCardSemesters(semesters);

          // Automatically select the latest semester
          if (semesters.length > 0 && !selectedGradeCardSem) {
            const latestSemester = semesters[0];
            setSelectedGradeCardSem(latestSemester);
            // Fetch the grade card data for the latest semester
            const data = await w.get_grade_card(latestSemester);
            data.semesterId = latestSemester.registration_id;
            setGradeCard(data);
            setGradeCards((prev) => ({
              ...prev,
              [latestSemester.registration_id]: data,
            }));
          }
        } catch (err) {
          console.error("Failed to fetch grade card semesters:", err);
        }
      }
    };
    fetchGradeCardSemesters();
  }, [
    w,
    gradeCardSemesters.length,
    setGradeCardSemesters,
    selectedGradeCardSem,
  ]);

  useEffect(() => {
    const fetchMarksSemesters = async () => {
      if (marksSemesters.length === 0) {
        try {
          const sems = await w.get_semesters_for_marks();
          setMarksSemesters(sems);
          // Automatically select the latest semester if not already selected
          if (sems.length > 0 && !selectedMarksSem) {
            const latestSemester = sems[0];
            setSelectedMarksSem(latestSemester);
            // Optionally, set marksSemesterData if marksData is available
            if (marksData[latestSemester.registration_id]) {
              setMarksSemesterData(marksData[latestSemester.registration_id]);
            }
          }
        } catch (err) {
          console.error("Failed to fetch marks semesters:", err);
        }
      }
    };
    fetchMarksSemesters();
  }, [
    w,
    marksSemesters.length,
    selectedMarksSem,
    setSelectedMarksSem,
    marksData,
    setMarksSemesterData,
    setMarksSemesters,
  ]);

  useEffect(() => {
    let mounted = true;

    const processPdfMarks = async () => {
      if (!selectedMarksSem || marksData[selectedMarksSem.registration_id]) {
        return;
      }

      setMarksLoading(true);
      try {
        if (guest) {
          // Guest mode: use fakedata.json and transform to expected structure
          const semId = selectedMarksSem.registration_id;
          const marksJson = fakedata.grades.marksData[semId];
          if (!marksJson || !marksJson.courses) {
            const errorObj = { error: "marks_not_uploaded" };
            setMarksSemesterData(errorObj);
            setMarksData((prev) => ({
              ...prev,
              [semId]: errorObj,
            }));
            return;
          }

          // Transform each course's breakup array to exams object
          const courses = marksJson.courses.map((course) => {
            const exams = {};
            if (Array.isArray(course.breakup)) {
              course.breakup.forEach((b) => {
                exams[b.label] = { OM: b.marks, FM: b.max };
              });
            }
            return {
              ...course,
              exams,
            };
          });
          const result = { courses };
          setMarksSemesterData(result);
          setMarksData((prev) => ({
            ...prev,
            [semId]: result,
          }));
          return;
        }

        const ENDPOINT = `/studentsexamview/printstudent-exammarks/${w.session.instituteid}/${selectedMarksSem.registration_id}/${selectedMarksSem.registration_code}`;
        const localname = await generate_local_name();
        const headers = await w.session.get_headers(localname);

        const pyodide = await loadPyodide();

        pyodide.globals.set("ENDPOINT", ENDPOINT);
        pyodide.globals.set("fetchOptions", { method: "GET", headers });
        pyodide.globals.set("API", API);

        const res = await pyodide.runPythonAsync(`
          import pyodide_js
          import asyncio
          import pyodide.http

          marks = {}

          async def process_pdf():
              global marks
              await pyodide_js.loadPackage("/jportal/artifact/PyMuPDF-1.24.12-cp311-abi3-emscripten_3_1_32_wasm32.whl")
              await pyodide_js.loadPackage("/jportal/artifact/jiit_marks-0.2.0-py3-none-any.whl")

              import pymupdf
              from jiit_marks import parse_report

              r = await pyodide.http.pyfetch(API+ENDPOINT, **(fetchOptions.to_py()))
              data = await r.bytes()

              doc = pymupdf.Document(stream=data)
              marks = parse_report(doc)
              return marks

          await process_pdf()
        `);

        if (mounted) {
          const result = res.toJs({
            dict_converter: Object.fromEntries,
            create_pyproxies: false,
          });

          setMarksSemesterData(result);
          setMarksData((prev) => ({
            ...prev,
            [selectedMarksSem.registration_id]: result,
          }));
        }
      } catch (error) {
        console.error("Failed to load marks:", error);
        // If error is table not found or IndexError, set a special error object
        if (
          error.message?.includes("table not on page") ||
          error.message?.includes("IndexError") ||
          error.message?.includes("table not found")
        ) {
          const errorObj = { error: "marks_not_uploaded" };
          if (mounted) {
            setMarksSemesterData(errorObj);
            setMarksData((prev) => ({
              ...prev,
              [selectedMarksSem.registration_id]: errorObj,
            }));
          }
        }
      } finally {
        if (mounted) {
          setMarksLoading(false);
        }
      }
    };

    if (selectedMarksSem) {
      processPdfMarks();
    }

    return () => {
      mounted = false;
    };
  }, [selectedMarksSem, w.session, marksData, guest]);

  const handleSemesterChange = async (value) => {
    setGradeCardLoading(true);
    try {
      const semester = gradeCardSemesters.find(
        (sem) => sem.registration_id === value
      );
      setSelectedGradeCardSem(semester);

      if (gradeCards[value]) {
        setGradeCard(gradeCards[value]);
      } else {
        const data = await w.get_grade_card(semester);
        data.semesterId = value;
        setGradeCard(data);
        setGradeCards((prev) => ({
          ...prev,
          [value]: data,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch grade card:", error);
    } finally {
      setGradeCardLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    const lightGradeColors = {
      "A+": "text-green-900",
      A: "text-green-800",
      "B+": "text-blue-900",
      B: "text-blue-800",
      "C+": "text-yellow-800",
      C: "text-yellow-700",
      D: "text-orange-800",
      F: "text-red-800",
    };
    const darkGradeColors = {
      "A+": "text-green-400",
      A: "text-green-300",
      "B+": "text-blue-400",
      B: "text-blue-300",
      "C+": "text-yellow-400",
      C: "text-yellow-300",
      D: "text-orange-400",
      F: "text-red-400",
    };
    return (
      (isLightTheme ? lightGradeColors[grade] : darkGradeColors[grade]) ||
      "text-white"
    );
  };

  // Toast state for download progress
  const [downloadToast, setDownloadToast] = useState({
    open: false,
    message: "",
    type: "info",
    progress: null,
    total: null,
  });
  const [downloading, setDownloading] = useState(false);
  const [selectedDownloadSem, setSelectedDownloadSem] = useState(null);

  const handleDownloadMarks = async () => {
    if (!selectedDownloadSem) return;
    setDownloading(true);
    setDownloadToast({
      open: true,
      message: `Downloading marks for ${selectedDownloadSem.registration_code}...`,
      type: "info",
      progress: null,
      total: null,
    });
    try {
      await w.download_marks(selectedDownloadSem);
      setDownloadToast({
        open: true,
        message: `Downloaded marks for ${selectedDownloadSem.registration_code}!`,
        type: "success",
        progress: null,
        total: null,
      });
      setTimeout(() => setDownloadToast((t) => ({ ...t, open: false })), 2500);
      setIsDownloadDialogOpen(false);
    } catch (err) {
      setDownloadToast({
        open: true,
        message: `Failed to download marks for ${
          selectedDownloadSem?.registration_code || "semester"
        }.`,
        type: "error",
        progress: null,
        total: null,
      });
      setTimeout(() => setDownloadToast((t) => ({ ...t, open: false })), 3500);
    } finally {
      setDownloading(false);
    }
  };

  const handleMarksSemesterChange = async (value) => {
    try {
      const semester = marksSemesters.find(
        (sem) => sem.registration_id === value
      );
      setSelectedMarksSem(semester);

      // If we have cached data, use it immediately
      if (marksData[value]) {
        setMarksSemesterData(marksData[value]);
      }
    } catch (error) {
      console.error("Failed to change marks semester:", error);
    }
  };

  const tabOrder = ["overview", "semester", "marks"];

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
    window.addEventListener("gradesSwipe", handleSwipe);
    return () => window.removeEventListener("gradesSwipe", handleSwipe);
  }, [internalTab]);

  // format GPA values with one decimal places
  const formatGPA = (value) => formatDecimal(value, getGpaDecimal());

  const handleCalculateSGPA = () => {
    setCalcError("");
    setRequiredSGPA(null);
    if (!targetCGPA || isNaN(targetCGPA)) {
      setCalcError("Please enter a valid target CGPA");
      return;
    }
    const target = parseFloat(targetCGPA);
    if (target < 0 || target > 10) {
      setCalcError("Target CGPA must be between 0 and 10");
      return;
    }
    if (!semesterData || semesterData.length === 0) {
      setCalcError("No semester data available");
      return;
    }

    const totalCredits = semesterData.reduce(
      (sum, sem) => sum + sem.totalcoursecredit,
      0
    );
    const totalGradePoints = semesterData.reduce(
      (sum, sem) => sum + sem.earnedgradepoints,
      0
    );
    const nextCredits =
      semesterData[semesterData.length - 1]?.totalcoursecredit || 24; // fallback to 24
    // Required SGPA = (targetCGPA * (totalCredits + nextCredits) - totalGradePoints) / nextCredits
    const required =
      (target * (totalCredits + nextCredits) - totalGradePoints) / nextCredits;
    setRequiredSGPA(required);
  };

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
  const separatorStyle = !useCardBackgrounds
    ? { borderBottom: `1px solid ${accentSeparator}66`, margin: "2px 0" }
    : {};

  if (gradesLoading) {
    return (
      <Loader
        message="Loading grades..."
        className="text-base sm:text-lg font-medium"
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] font-sans px-2 pb-36 pt-1">
      {guest && (
        <div className="w-full max-w-3xl mx-auto mb-4 rounded-[var(--radius)] bg-[var(--accent-color)] text-[var(--bg-color)] text-center py-2 font-semibold shadow-md">
          Guest Demo: Viewing Sample Data
        </div>
      )}
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
              className="mb-1 h-[36px] items-center grid-cols-3 lg:grid-cols-1 lg:w-64 lg:h-auto lg:mb-0 lg:py-2 lg:gap-1 lg:block hidden"
            >
              <TabsTrigger
                value="overview"
                className="flex items-center justify-center h-full w-full data-[state=active]:bg-[var(--primary-color)] data-[state=active]:text-[var(--text-color)] text-[var(--label-color)] text-[1.1rem] font-medium transition-colors lg:justify-start lg:px-6 lg:py-3 lg:w-full lg:data-[state=active]:rounded-2xl lg:rounded-none"
              >
                <span className="flex items-center justify-center w-full h-full lg:justify-start lg:w-auto">
                  Overview
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="semester"
                className="flex items-center justify-center h-full w-full data-[state=active]:bg-[var(--primary-color)] data-[state=active]:text-[var(--text-color)] text-[var(--label-color)] text-[1.1rem] font-medium transition-colors lg:justify-start lg:px-6 lg:py-3 lg:w-full lg:data-[state=active]:rounded-2xl lg:rounded-none"
              >
                <span className="flex items-center justify-center w-full h-full lg:justify-start lg:w-auto">
                  Semester
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="marks"
                className="flex items-center justify-center h-full w-full data-[state=active]:bg-[var(--primary-color)] data-[state=active]:text-[var(--text-color)] text-[var(--label-color)] text-[1.1rem] font-medium transition-colors lg:justify-start lg:px-6 lg:py-3 lg:w-full lg:data-[state=active]:rounded-2xl lg:rounded-none"
              >
                <span className="flex items-center justify-center w-full h-full lg:justify-start lg:w-auto">
                  Marks
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
                  value="semester"
                  className="flex-1 text-lg font-semibold data-[state=active]:bg-[var(--card-bg)] data-[state=active]:text-[var(--accent-color)] text-[var(--label-color)] transition-colors"
                >
                  Semester
                </TabsTrigger>
                <TabsTrigger
                  value="marks"
                  className="flex-1 text-lg font-semibold data-[state=active]:bg-[var(--card-bg)] data-[state=active]:text-[var(--accent-color)] text-[var(--label-color)] transition-colors"
                >
                  Marks
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
              <div className="flex flex-col items-center">
                {gradesError ? (
                  <div
                    className={`w-full max-w-2xl text-center py-8 ${
                      useCardBackgrounds
                        ? "bg-[var(--card-bg)] rounded-[var(--radius)] shadow-sm"
                        : ""
                    } px-6 mb-4`}
                  >
                    <p className="text-base sm:text-lg font-medium">
                      {gradesError}
                    </p>
                    <p className="text-[var(--label-color)] mt-2">
                      Please check back later
                    </p>
                  </div>
                ) : (
                  <>
                    <div
                      className={`mb-4 w-full max-w-2xl ${
                        useCardBackgrounds
                          ? "bg-[var(--card-bg)] rounded-[var(--radius)] shadow-sm"
                          : ""
                      } px-6 sm:px-10 py-4 sm:py-7`}
                    >
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart
                          data={semesterData}
                          margin={{
                            top: 0,
                            right: 10,
                            left: 0,
                            bottom: 20,
                          }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border-color)"
                          />
                          <XAxis
                            dataKey="stynumber"
                            stroke="var(--label-color)"
                            label={{
                              value: "Semester",
                              position: "bottom",
                              fill: "var(--label-color)",
                            }}
                            tickFormatter={(value) => `${value}`}
                          />
                          <YAxis
                            stroke="var(--label-color)"
                            domain={["dataMin", "dataMax"]}
                            ticks={undefined}
                            tickCount={5}
                            padding={{ top: 20, bottom: 20 }}
                            tickFormatter={(value) =>
                              formatDecimal(value, getGpaDecimal())
                            }
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "var(--card-bg)",
                              border: "1px solid var(--border-color)",
                              borderRadius: "8px",
                              color: "var(--text-color)",
                            }}
                          />
                          <Legend verticalAlign="top" height={36} />
                          <Line
                            type="monotone"
                            dataKey="sgpa"
                            stroke={sgpaColor}
                            name="SGPA"
                            strokeWidth={2}
                            dot={{ fill: sgpaColor }}
                          />
                          <Line
                            type="monotone"
                            dataKey="cgpa"
                            stroke={cgpaColor}
                            name="CGPA"
                            strokeWidth={2}
                            dot={{ fill: cgpaColor }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-2 w-full max-w-2xl">
                      {semesterData.map((sem, idx) => (
                        <React.Fragment key={sem.stynumber}>
                          <div
                            className={`w-full ${
                              useCardBackgrounds
                                ? "bg-[var(--card-bg)] rounded-[var(--radius)] shadow-sm mb-1"
                                : "mb-0"
                            } px-3 sm:px-8 py-2 sm:py-5 flex items-center justify-between`}
                            style={
                              !useCardBackgrounds
                                ? {
                                    marginBottom: 0,
                                    paddingTop: 8,
                                    paddingBottom: 8,
                                  }
                                : {}
                            }
                          >
                            <div className="flex-1 min-w-0">
                              <h2 className="text-sm sm:text-lg font-light truncate mb-0.5 text-[var(--text-color)]">
                                Semester {sem.stynumber}
                              </h2>
                              <div className="text-xs sm:text-base font-normal text-[var(--label-color)]">
                                GP:{" "}
                                {formatDecimal(
                                  sem.earnedgradepoints,
                                  getGpaDecimal()
                                )}
                                /
                                {formatDecimal(
                                  sem.totalcoursecredit * 10,
                                  getGpaDecimal()
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3 sm:gap-6">
                              <div className="text-center">
                                <div
                                  className={`text-lg sm:text-2xl font-mono font-bold ${sgpaTextColor}`}
                                >
                                  {formatGPA(sem.sgpa)}
                                </div>
                                <div className="text-[0.7rem] sm:text-sm text-[var(--label-color)]">
                                  SGPA
                                </div>
                              </div>
                              <div className="text-center">
                                <div
                                  className={`text-lg sm:text-2xl font-mono font-bold ${cgpaTextColor}`}
                                >
                                  {formatGPA(sem.cgpa)}
                                </div>
                                <div className="text-[0.7rem] sm:text-sm text-[var(--label-color)]">
                                  CGPA
                                </div>
                              </div>
                            </div>
                          </div>
                          {!useCardBackgrounds &&
                            idx < semesterData.length - 1 && (
                              <div style={separatorStyle} />
                            )}
                        </React.Fragment>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="semester">
              <div className="w-full max-w-2xl mx-auto">
                {gradeCardSemesters.length === 0 ? (
                  <div
                    className={`text-center py-8 ${
                      useCardBackgrounds
                        ? "bg-[var(--card-bg)] rounded-[var(--radius)] shadow-sm"
                        : ""
                    } px-6 mb-4`}
                  >
                    <p className="text-base sm:text-lg font-medium">
                      Grade card is not available yet
                    </p>
                    <p className="text-[var(--label-color)] mt-2">
                      Please check back later
                    </p>
                  </div>
                ) : (
                  <div className="w-full max-w-2xl mx-auto">
                    {/* Semester Dropdown and Sorting Controls Row (MUI and Regular variants) */}
                    {useMaterialUI ? (
                      <div className="flex flex-col gap-2 mb-2 w-full">
                        <div className="flex-1 min-w-0">
                          <FormControl fullWidth variant="outlined">
                            <InputLabel
                              id="grade-semester-label"
                              sx={{
                                color: "var(--label-color)",
                                fontSize: "1.1rem",
                                fontWeight: 300,
                              }}
                            >
                              Semester
                            </InputLabel>
                            <MuiSelect
                              labelId="grade-semester-label"
                              label="Semester"
                              value={
                                selectedGradeCardSem?.registration_id || ""
                              }
                              onChange={(e) =>
                                handleSemesterChange(e.target.value)
                              }
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
                                "& .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "var(--border-color)",
                                },
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "var(--accent-color)",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                  {
                                    borderColor: "var(--accent-color)",
                                  },
                              }}
                            >
                              <MuiMenuItem value="" disabled>
                                {gradeCardLoading
                                  ? "Loading semesters..."
                                  : "Select semester"}
                              </MuiMenuItem>
                              {gradeCardSemesters.map((sem) => (
                                <MuiMenuItem
                                  key={sem.registration_id}
                                  value={sem.registration_id}
                                >
                                  {sem.registration_code}
                                </MuiMenuItem>
                              ))}
                            </MuiSelect>
                          </FormControl>
                        </div>
                        <div className="flex gap-2 bg-transparent rounded-xl px-0 py-0 h-10 items-center mt-0">
                          <button
                            type="button"
                            aria-label="Sort by Grade"
                            className={`
                              flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all duration-150
                                      focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] h-8
                                      border
                                      ${
                                        gradeSort === "default"
                                          ? "bg-transparent text-[var(--label-color)] border-[var(--border-color)]"
                                          : "bg-[var(--accent-color)] text-[var(--card-bg)] border-[var(--accent-color)] shadow"
                                      }
                                      hover:bg-[var(--accent-color)]/10 hover:text-[var(--text-color)] hover:border-[var(--accent-color)]
                            `}
                            style={{
                              boxShadow:
                                gradeSort !== "default"
                                  ? "0 2px 8px 0 rgba(0,0,0,0.08)"
                                  : "none",
                            }}
                            onClick={() => {
                              setGradeSort(nextSortState(gradeSort));
                              setCreditSort("default");
                            }}
                          >
                            <span className="text-[0.98rem] font-medium">
                              Grade
                            </span>
                            <span
                              className={`
                                text-xs ml-1 transition-opacity duration-100
                                ${
                                  gradeSort === "asc" || gradeSort === "desc"
                                    ? "opacity-100"
                                    : "opacity-0"
                                }
                              `}
                            >
                              {gradeSort === "asc" && "▲"}
                              {gradeSort === "desc" && "▼"}
                            </span>
                          </button>
                          <button
                            type="button"
                            aria-label="Sort by Credits"
                            className={`
                                      flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all duration-150
                                      focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] h-8
                                      border
                                      ${
                                        creditSort === "default"
                                          ? "bg-transparent text-[var(--label-color)] border-[var(--border-color)]"
                                          : "bg-[var(--accent-color)] text-[var(--card-bg)] border-[var(--accent-color)] shadow"
                                      }
                                      hover:bg-[var(--accent-color)]/10 hover:text-[var(--text-color)] hover:border-[var(--accent-color)]
                                    `}
                            style={{
                              boxShadow:
                                creditSort !== "default"
                                  ? "0 2px 8px 0 rgba(0,0,0,0.08)"
                                  : "none",
                            }}
                            onClick={() => {
                              setCreditSort(nextSortState(creditSort));
                              setGradeSort("default");
                            }}
                          >
                            <span className="text-[0.98rem] font-medium">
                              Credits
                            </span>
                            <span
                              className={`
                                        text-xs ml-1 transition-opacity duration-100
                                        ${
                                          creditSort === "asc" ||
                                          creditSort === "desc"
                                            ? "opacity-100"
                                            : "opacity-0"
                                        }
                                      `}
                            >
                              {creditSort === "asc" && "▲"}
                              {creditSort === "desc" && "▼"}
                            </span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 mb-2 w-full">
                        <div className="flex-1 min-w-0">
                          <Select
                            onValueChange={handleSemesterChange}
                            value={selectedGradeCardSem?.registration_id}
                          >
                            <SelectTrigger className="bg-[var(--card-bg)] text-[var(--text-color)] border-[var(--border-color)] w-full max-w-2xl mx-auto rounded-[var(--radius)">
                              <SelectValue
                                placeholder={
                                  gradeCardLoading
                                    ? "Loading semesters..."
                                    : "Select semester"
                                }
                              >
                                {selectedGradeCardSem?.registration_code}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-[var(--card-bg)] text-[var(--text-color)] border-[var(--border-color)] rounded-[var(--radius)]">
                              {gradeCardSemesters.map((sem) => (
                                <SelectItem
                                  key={sem.registration_id}
                                  value={sem.registration_id}
                                >
                                  {sem.registration_code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex gap-2 bg-transparent rounded-xl px-0 py-0 h-10 items-center mt-0">
                          <button
                            type="button"
                            aria-label="Sort by Grade"
                            className={`
                              flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all duration-150
                              focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] h-8
                              border
                              ${
                                gradeSort === "default"
                                  ? "bg-transparent text-[var(--label-color)] border-[var(--border-color)]"
                                  : "bg-[var(--accent-color)] text-[var(--card-bg)] border-[var(--accent-color)] shadow"
                              }
                            hover:bg-[var(--accent-color)]/10 hover:text-[var(--text-color)] hover:border-[var(--accent-color)]
                            `}
                            style={{
                              boxShadow:
                                gradeSort !== "default"
                                  ? "0 2px 8px 0 rgba(0,0,0,0.08)"
                                  : "none",
                            }}
                            onClick={() => {
                              setGradeSort(nextSortState(gradeSort));
                              setCreditSort("default");
                            }}
                          >
                            <span className="text-[0.98rem] font-medium">
                              Grade
                            </span>
                            <span
                              className={`
                                text-xs ml-1 transition-opacity duration-100
                                ${
                                  gradeSort === "asc" || gradeSort === "desc"
                                    ? "opacity-100"
                                    : "opacity-0"
                                }
                                `}
                            >
                              {gradeSort === "asc" && "▲"}
                              {gradeSort === "desc" && "▼"}
                            </span>
                          </button>
                          <button
                            type="button"
                            aria-label="Sort by Credits"
                            className={`
                                    flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold text-sm transition-all duration-150
                                    focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] h-8
                                    border
                                    ${
                                      creditSort === "default"
                                        ? "bg-transparent text-[var(--label-color)] border-[var(--border-color)]"
                                        : "bg-[var(--accent-color)] text-[var(--card-bg)] border-[var(--accent-color)] shadow"
                                    }
                                  hover:bg-[var(--accent-color)]/10 hover:text-[var(--text-color)] hover:border-[var(--accent-color)]
                                  `}
                            style={{
                              boxShadow:
                                creditSort !== "default"
                                  ? "0 2px 8px 0 rgba(0,0,0,0.08)"
                                  : "none",
                            }}
                            onClick={() => {
                              setCreditSort(nextSortState(creditSort));
                              setGradeSort("default");
                            }}
                          >
                            <span className="text-[0.98rem] font-medium">
                              Credits
                            </span>
                            <span
                              className={`
                                      text-xs ml-1 transition-opacity duration-100
                                      ${
                                        creditSort === "asc" ||
                                        creditSort === "desc"
                                          ? "opacity-100"
                                          : "opacity-0"
                                      }
                                    `}
                            >
                              {creditSort === "asc" && "▲"}
                              {creditSort === "desc" && "▼"}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                    {/* Sorted GradeCard List */}
                    <div className="space-y-2 mt-4">
                      {getSortedGradeCard().map((subject, idx, arr) => (
                        <React.Fragment key={subject.subjectcode}>
                          <GradeCard
                            subject={subject}
                            getGradeColor={getGradeColor}
                            useCardBackgrounds={useCardBackgrounds}
                          />
                          {!useCardBackgrounds && idx < arr.length - 1 && (
                            <div style={separatorStyle} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="marks">
              <div className="w-full max-w-2xl mx-auto">
                {marksSemesters.length === 0 ? (
                  <div
                    className={`text-center py-8 ${
                      useCardBackgrounds
                        ? "bg-[var(--card-bg)] rounded-[var(--radius)] shadow-sm"
                        : ""
                    } px-6 mb-4`}
                  >
                    <p className="text-base sm:text-lg font-medium">
                      Marks data is not available yet
                    </p>
                    <p className="text-[var(--label-color)] mt-2">
                      Please check back later
                    </p>
                  </div>
                ) : (
                  <>
                    {useMaterialUI ? (
                      <FormControl fullWidth variant="outlined">
                        <InputLabel
                          id="marks-semester-label"
                          sx={{ color: "var(--label-color)" }}
                        >
                          Semester
                        </InputLabel>
                        <MuiSelect
                          labelId="marks-semester-label"
                          label="Semester"
                          value={selectedMarksSem?.registration_id || ""}
                          onChange={(e) =>
                            handleMarksSemesterChange(e.target.value)
                          }
                          displayEmpty
                          variant="outlined"
                          fullWidth
                          renderValue={(selected) => {
                            if (!selected) return "Select semester";
                            const sem = marksSemesters.find(
                              (s) => s.registration_id === selected
                            );
                            return sem ? sem.registration_code : "";
                          }}
                          sx={{
                            minWidth: 120,
                            background: "var(--card-bg)",
                            color: "var(--text-color)",
                            borderRadius: "var(--radius)",
                            fontSize: "1.1rem",
                            fontWeight: 300,
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "var(--border-color)",
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
                            Select semester
                          </MuiMenuItem>
                          {marksSemesters.map((sem) => (
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
                        onValueChange={handleMarksSemesterChange}
                        value={selectedMarksSem?.registration_id}
                      >
                        <SelectTrigger className="bg-[var(--card-bg)] text-[var(--text-color)] border-[var(--border-color)]">
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent className="bg-[var(--card-bg)] text-[var(--text-color)] border-[var(--border-color)]">
                          {marksSemesters.map((sem) => (
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

                    {marksLoading ? (
                      <div className="flex justify-center mt-4">
                        <Loader
                          message="Loading marks data..."
                          className="text-base sm:text-lg font-medium"
                        />
                      </div>
                    ) : marksSemesterData &&
                      marksSemesterData.error === "marks_not_uploaded" ? (
                      <div
                        className={`text-center mt-4 ${
                          useCardBackgrounds
                            ? "bg-[var(--card-bg)] rounded-[var(--radius)] px-6 py-8 shadow-sm"
                            : ""
                        }`}
                      >
                        <p className="text-base sm:text-lg font-medium text-[var(--text-color)] mb-2">
                          Marks not yet uploaded for this semester
                        </p>
                        <p className="text-[var(--label-color)]">
                          Please check back later
                        </p>
                      </div>
                    ) : marksSemesterData && marksSemesterData.courses ? (
                      <div className="space-y-4 mt-4">
                        {marksSemesterData.courses.map((course, idx, arr) => (
                          <React.Fragment key={course.code}>
                            <MarksCard
                              course={course}
                              gradeCard={gradeCard}
                              useCardBackgrounds={useCardBackgrounds}
                            />
                            {!useCardBackgrounds && idx < arr.length - 1 && (
                              <div style={separatorStyle} />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center mt-4 text-[var(--label-color)]">
                        <span className="text-base sm:text-lg font-medium">
                          Select a semester to view marks
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Floating Download Marks Button above navbar */}
      <div className="fixed bottom-24 md:bottom-2 right-4 md:right-6 z-50 flex flex-col gap-2 items-end">
        {/* Download Marks Button */}
        <Button
          variant="secondary"
          className={`
            rounded-[var(--radius)] shadow-lg flex items-center gap-2 text-[var(--text-color)]
            bg-[var(--primary-color)] hover:bg-[var(--accent-color)]
            border-[var(--border-color)] hover:border-[var(--primary-color)]
            px-3 h-10 text-base font-semibold
            sm:px-6 sm:h-14 sm:text-lg
          `}
          onClick={() => setIsDownloadDialogOpen(true)}
          aria-label="Download Marks"
        >
          <Download className="h-4 w-4 mr-1 sm:h-6 sm:w-6 sm:mr-2" />
          <span className="hidden sm:inline">Download Marks</span>
          <span className="sm:hidden">Download</span>
        </Button>
        {/* Targeted GPA Calculator Button */}
        <Button
          variant="secondary"
          className={`
            rounded-[var(--radius)] shadow-lg flex items-center gap-2 text-[var(--text-color)]
            bg-[var(--card-bg)] hover:bg-[var(--primary-color)]
            border-[var(--border-color)] hover:border-[var(--primary-color)]
            px-3 h-10 text-base font-semibold
            sm:px-6 sm:h-14 sm:text-lg
          `}
          onClick={() => setIsTargetModalOpen(true)}
          aria-label="Calculate Targeted GPA"
        >
          <Calculator className="h-4 w-4 mr-1 sm:h-6 sm:w-6 sm:mr-2" />
          <span className="hidden sm:inline">Calculate Targeted GPA</span>
          <span className="sm:hidden">Target GPA</span>
        </Button>
      </div>

      <Dialog
        open={isDownloadDialogOpen}
        onOpenChange={setIsDownloadDialogOpen}
      >
        <DialogContent className="bg-[var(--card-bg)] text-[var(--text-color)] border-none max-w-md w-full rounded-[var(--radius)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--text-color)]">
              <Download className="h-6 w-6" />
              Download Marks
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2 flex flex-col gap-2">
            {marksSemesters.length === 0 ? (
              <div className="text-center text-[var(--label-color)] py-6">
                No semesters available.
              </div>
            ) : (
              marksSemesters.map((sem) => (
                <Button
                  key={sem.registration_id}
                  variant="secondary"
                  className="w-full text-[var(--text-color)] bg-[var(--primary-color)] hover:bg-[var(--accent-color)] border-[var(--border-color)] hover:border-[var(--primary-color)] rounded-[var(--radius)] px-4 h-12 text-lg font-semibold flex items-center justify-between"
                  onClick={async () => {
                    setDownloading(true);
                    setDownloadToast({
                      open: true,
                      message: `Downloading marks for ${sem.registration_code}...`,
                      type: "info",
                      progress: null,
                      total: null,
                    });
                    try {
                      await w.download_marks(sem);
                      setDownloadToast({
                        open: true,
                        message: `Downloaded marks for ${sem.registration_code}!`,
                        type: "success",
                        progress: null,
                        total: null,
                      });
                      setTimeout(
                        () => setDownloadToast((t) => ({ ...t, open: false })),
                        2500
                      );
                      setIsDownloadDialogOpen(false);
                    } catch (err) {
                      setDownloadToast({
                        open: true,
                        message: `Failed to download marks for ${sem.registration_code}.`,
                        type: "error",
                        progress: null,
                        total: null,
                      });
                      setTimeout(
                        () => setDownloadToast((t) => ({ ...t, open: false })),
                        3500
                      );
                    } finally {
                      setDownloading(false);
                    }
                  }}
                  disabled={downloading}
                >
                  <span>{sem.registration_code}</span>
                  <Download className="h-5 w-5 ml-2" />
                </Button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Targeted GPA Calculator Modal */}
      <Dialog open={isTargetModalOpen} onOpenChange={setIsTargetModalOpen}>
        <DialogContent className="bg-[var(--card-bg)] text-[var(--text-color)] border-none max-w-md w-full rounded-[var(--radius)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--text-color)]">
              <Calculator className="h-6 w-6" />
              CGPA Target Calculator
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {!useMaterialUI && (
              <label className="block text-lg mb-2 text-[var(--label-color)]">
                Target CGPA
              </label>
            )}
            <div className="flex flex-col gap-3 items-stretch">
              {useMaterialUI ? (
                <MuiTextField
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={targetCGPA}
                  onChange={(e) => setTargetCGPA(e.target.value)}
                  label="Target CGPA"
                  variant="outlined"
                  fullWidth
                  sx={{
                    width: "100%",
                    borderRadius: "var(--radius)",
                    background: "var(--card-bg)",
                    color: "var(--text-color)",
                    fontSize: "1.1rem",
                    fontWeight: 400,
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "var(--radius)",
                      background: "var(--card-bg)",
                      color: "var(--text-color)",
                      fontSize: "1.1rem",
                      fontWeight: 400,
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
                  }}
                  InputLabelProps={{ sx: { color: "var(--label-color)" } }}
                />
              ) : (
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={targetCGPA}
                  onChange={(e) => setTargetCGPA(e.target.value)}
                  placeholder="Enter target CGPA"
                  className="w-full rounded-[var(--radius)] px-4 py-3 bg-[var(--card-bg)] text-[var(--text-color)] border border-[var(--label-color)] focus:ring-2 focus:ring-[var(--accent-color)] outline-none text-lg font-normal shadow-md"
                />
              )}
              {useMaterialUI ? (
                <MuiButton
                  variant="contained"
                  sx={{
                    borderRadius: "var(--radius)",
                    px: 6,
                    height: 48,
                    fontSize: "1.1rem",
                    fontWeight: 600,
                    background: "var(--primary-color)",
                    color: "var(--text-color)",
                    "&:hover": {
                      background: "var(--accent-color)",
                      color: "var(--primary-color)",
                    },
                  }}
                  onClick={handleCalculateSGPA}
                >
                  Calculate
                </MuiButton>
              ) : (
                <Button
                  variant="secondary"
                  className="rounded-[var(--radius)] px-6 h-12 text-lg font-semibold"
                  style={{
                    background: "var(--primary-color)",
                    color: "var(--text-color)",
                  }}
                  onClick={handleCalculateSGPA}
                >
                  Calculate
                </Button>
              )}
            </div>
            {calcError && (
              <div className="text-red-500 mt-2 text-base">{calcError}</div>
            )}
            {requiredSGPA !== null && !calcError && (
              <div className="mt-6 bg-[var(--card-bg)] rounded-[var(--radius)] px-4 py-4">
                <div className="text-[var(--label-color)] text-lg mb-1">
                  Required SGPA for next semester
                </div>
                {requiredSGPA > 10 ? (
                  <div className="text-red-500 text-lg font-semibold">
                    This target cannot be achieved in the next semester
                  </div>
                ) : (
                  <div className="text-[var(--accent-color)] text-4xl font-bold">
                    {requiredSGPA >= 0
                      ? formatDecimal(requiredSGPA, getTargetGpaDecimal())
                      : "N/A"}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {downloadToast.open && (
        <Toast
          message={downloadToast.message}
          type={downloadToast.type}
          progress={downloadToast.progress}
          total={downloadToast.total}
          onClose={() => setDownloadToast((t) => ({ ...t, open: false }))}
        />
      )}
    </div>
  );
}
