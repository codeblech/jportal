import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GradeCard from "./GradeCard";
import InteractiveGPAChart from "./InteractiveGPAChart";
import { Button } from "@/components/ui/button";
import { Download, ListFilter, SortAsc, SortDesc, Play, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ButtonGroup } from "@/components/ui/button-group";
import MarksCard from "./MarksCard";
import { generate_local_name, API } from "https://cdn.jsdelivr.net/npm/jsjiit@0.0.16/dist/jsjiit.esm.js";
import MockWebPortal from "./MockWebPortal";

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
}) {
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
  }, [w, gradeCardSemesters.length, setGradeCardSemesters, selectedGradeCardSem]);

    // sorting state for grade card list
    const [creditSort, setCreditSort] = useState("default"); // default, asc, desc
    const [gradeSort, setGradeSort] = useState("default"); // default, asc, desc

    // interactive chart state
    const [isInteractiveMode, setIsInteractiveMode] = useState(false);
    const [modifiedSemesterData, setModifiedSemesterData] = useState(null);

    // Custom tooltip component
    const CustomTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
        return (
          <div
            className="max-[400px]:text-[0.65rem] max-[540px]:text-xs text-sm"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              padding: "4px 8px",
              color: "var(--card-foreground)",
            }}
          >
            <p style={{ margin: 0, color: "var(--chart-1)" }}>SGPA: {payload[0]?.value?.toFixed(1)}</p>
            <p style={{ margin: 0, color: "var(--chart-2)" }}>CGPA: {payload[1]?.value?.toFixed(1)}</p>
          </div>
        );
      }
      return null;
    };

    const nextSortState = (current) => (current === "default" ? "asc" : current === "asc" ? "desc" : "default");

    const toggleCreditSort = () => {
      const nextState = nextSortState(creditSort);
      setCreditSort(nextState);
      // Reset grade sort when switching to credit sort
      if (nextState !== "default") {
        setGradeSort("default");
      }
    };
    
    const toggleGradeSort = () => {
      const nextState = nextSortState(gradeSort);
      setGradeSort(nextState);
      // Reset credit sort when switching to grade sort
      if (nextState !== "default") {
        setCreditSort("default");
      }
    };

    // persist sort preferences
    useEffect(() => {
      try {
        const saved = localStorage.getItem("grades_credit_sort");
        if (saved === "asc" || saved === "desc" || saved === "default") setCreditSort(saved);
      } catch (e) {}
    }, []);
    useEffect(() => {
      try {
        const saved = localStorage.getItem("grades_grade_sort");
        if (saved === "asc" || saved === "desc" || saved === "default") setGradeSort(saved);
      } catch (e) {}
    }, []);
    useEffect(() => {
      try {
        localStorage.setItem("grades_credit_sort", creditSort);
      } catch (e) {}
    }, [creditSort]);
    useEffect(() => {
      try {
        localStorage.setItem("grades_grade_sort", gradeSort);
      } catch (e) {}
    }, [gradeSort]);

  useEffect(() => {
    const fetchMarksSemesters = async () => {
      if (marksSemesters.length === 0) {
        try {
          const sems = await w.get_semesters_for_marks();
          setMarksSemesters(sems);
        } catch (err) {
          console.error("Failed to fetch marks semesters:", err);
        }
      }
    };
    fetchMarksSemesters();
  }, [w, marksSemesters.length]);

  useEffect(() => {
    let mounted = true;

    const processPdfMarks = async () => {
      if (!selectedMarksSem || marksData[selectedMarksSem.registration_id]) {
        return;
      }

      setMarksLoading(true);
      try {
        // Check if we're in demo mode by checking the instance type
        if (w instanceof MockWebPortal) {
          // Demo mode: Use the download_marks method which returns the fake data
          const result = await w.download_marks(selectedMarksSem);

          if (mounted) {
            setMarksSemesterData(result);
            setMarksData((prev) => ({
              ...prev,
              [selectedMarksSem.registration_id]: result,
            }));
          }
        } else {
          // Real mode: process PDF using Pyodide
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
        }
      } catch (error) {
        console.error("Failed to load marks:", error);
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
  }, [selectedMarksSem, w.session, marksData]);

  const handleSemesterChange = async (value) => {
    setGradeCardLoading(true);
    try {
      const semester = gradeCardSemesters.find((sem) => sem.registration_id === value);
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
    const gradeColors = {
      "A+": "text-grade-aa",
      A: "text-grade-a",
      "B+": "text-grade-bb",
      B: "text-grade-b",
      "C+": "text-grade-cc",
      C: "text-grade-c",
      D: "text-grade-d",
      F: "text-grade-f",
    };
    return gradeColors[grade] || "text-foreground";
  };

  const handleDownloadMarks = async (semester) => {
    try {
      await w.download_marks(semester);
      setIsDownloadDialogOpen(false);
    } catch (err) {
      console.error("Failed to download marks:", err);
    }
  };

  const handleMarksSemesterChange = async (value) => {
    try {
      const semester = marksSemesters.find((sem) => sem.registration_id === value);
      setSelectedMarksSem(semester);

      // If we have cached data, use it immediately
      if (marksData[value]) {
        setMarksSemesterData(marksData[value]);
      }
    } catch (error) {
      console.error("Failed to change marks semester:", error);
    }
  };

  if (gradesLoading) {
    return (
      <div className="text-foreground flex items-center justify-center py-4 h-[calc(100vh_-_<header_height>-<navbar_height>)]">
        Loading grades...
      </div>
    );
  }

  return (
    <div className="text-foreground pt-2 pb-4 px-3 font-sans">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 bg-background gap-3">
          <TabsTrigger
            value="overview"
            className="cursor-pointer text-muted-foreground bg-background data-[state=active]:bg-muted data-[state=active]:text-foreground"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="semester"
            className="cursor-pointer text-muted-foreground bg-background data-[state=active]:bg-muted data-[state=active]:text-foreground"
          >
            Semester
          </TabsTrigger>
          <TabsTrigger
            value="marks"
            className="cursor-pointer text-muted-foreground bg-background data-[state=active]:bg-muted data-[state=active]:text-foreground"
          >
            Marks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="flex flex-col items-center">
            {gradesError ? (
              <div className="w-full max-w-4xl text-center py-8">
                <p className="text-xl">{gradesError}</p>
                <p className="text-muted-foreground mt-2">Please check back later</p>
              </div>
            ) : isInteractiveMode ? (
              <>
                <div className="w-full flex justify-between items-center gap-2 mb-2 max-w-4xl">
                  <div className="text-sm text-muted-foreground">
                    Drag the SGPA dots vertically to see how CGPA changes
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="cursor-pointer flex-shrink-0"
                    onClick={() => {
                      setIsInteractiveMode(false);
                      setModifiedSemesterData(null);
                    }}
                    title="Exit interactive mode"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <InteractiveGPAChart
                  semesterData={modifiedSemesterData || semesterData}
                  onDataChange={setModifiedSemesterData}
                />
              </>
            ) : (
              <>
                <div className="w-full flex justify-end mb-2 max-w-4xl">
                  <Button
                    variant="outline"
                    size="icon"
                    className="cursor-pointer"
                    onClick={() => {
                      setIsInteractiveMode(true);
                      setModifiedSemesterData(semesterData.map(sem => ({ ...sem })));
                    }}
                    title="Enter interactive mode"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mb-4 rounded-lg pb-2 w-full max-w-4xl ">
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
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="stynumber"
                        stroke="var(--muted-foreground)"
                        label={{ value: "Semester", position: "bottom", fill: "var(--muted-foreground)" }}
                        tickFormatter={(value) => `${value}`}
                      />
                      <YAxis
                        stroke="var(--muted-foreground)"
                        domain={["dataMin", "dataMax"]}
                        ticks={undefined}
                        tickCount={5}
                        padding={{ top: 20, bottom: 20 }}
                        tickFormatter={(value) => value.toFixed(1)}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="top" height={36} />

                      {/* CGPA Line - rendered first so it appears behind */}
                      <Line
                        type="monotone"
                        dataKey="cgpa"
                        stroke="var(--chart-2)"
                        name="CGPA"
                        strokeWidth={2}
                        dot={{ fill: "var(--chart-2)" }}
                      />

                      {/* SGPA Line - rendered last so it appears on top */}
                      <Line
                        type="monotone"
                        dataKey="sgpa"
                        stroke="var(--chart-1)"
                        name="SGPA"
                        strokeWidth={2}
                        dot={{ fill: "var(--chart-1)" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 w-full max-w-4xl">
                  {semesterData.map((sem) => (
                    <div key={sem.stynumber} className="flex justify-between items-center py-1 border-b border-border">
                      <div className="flex-1">
                        <h2 className="text-sm font-semibold">Semester {sem.stynumber}</h2>
                        <p className="text-sm text-muted-foreground">
                          GP: {sem.earnedgradepoints.toFixed(1)}/{sem.totalcoursecredit * 10}
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-xl font-bold text-chart-1">{sem.sgpa}</div>
                          <div className="text-xs text-muted-foreground">SGPA</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-chart-2">{sem.cgpa}</div>
                          <div className="text-xs text-muted-foreground">CGPA</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="w-full flex justify-end my-4 max-w-4xl">
              <Button
                variant="secondary"
                className="flex items-center gap-2 text-popover-foreground hover:text-accent-foreground border-border bg-background hover:bg-accent px-2 cursor-pointer"
                onClick={() => setIsDownloadDialogOpen(true)}
              >
                <Download className="h-4 w-4" />
                Download Marks
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="semester">
          <div className="w-full max-w-4xl mx-auto">
            {gradeCardSemesters.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xl">Grade card is not available yet</p>
                <p className="text-muted-foreground mt-2">Please check back later</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Select onValueChange={handleSemesterChange} value={selectedGradeCardSem?.registration_id}>
                    <SelectTrigger className="bg-background text-foreground border-foreground cursor-pointer hover:bg-accent hover:text-accent-foreground">
                      <SelectValue placeholder={gradeCardLoading ? "Loading semesters..." : "Select semester"}>
                        {selectedGradeCardSem?.registration_code}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-background text-foreground border-foreground">
                      {gradeCardSemesters.map((sem) => (
                        <SelectItem key={sem.registration_id} value={sem.registration_id}>
                          {sem.registration_code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <ButtonGroup>
                    <Button
                      variant="outline"
                      onClick={toggleGradeSort}
                      title={`Sort by grade (${gradeSort})`}
                      className="cursor-pointer px-2"
                    >
                      <span className="text-xs">Grade</span>
                      {gradeSort === "default" && <ListFilter className="w-3.5 h-3.5" />}
                      {gradeSort === "asc" && <SortAsc className="w-3.5 h-3.5" />}
                      {gradeSort === "desc" && <SortDesc className="w-3.5 h-3.5" />}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={toggleCreditSort}
                      title={`Sort by credit (${creditSort})`}
                      className="cursor-pointer px-2"
                    >
                      <span className="text-xs">Credit</span>
                      {creditSort === "default" && <ListFilter className="w-3.5 h-3.5" />}
                      {creditSort === "asc" && <SortAsc className="w-3.5 h-3.5" />}
                      {creditSort === "desc" && <SortDesc className="w-3.5 h-3.5" />}
                    </Button>
                  </ButtonGroup>
                </div>

                {gradeCardLoading ? (
                  <div className="text-foreground flex items-center justify-center py-4">Loading subjects...</div>
                ) : gradeCard ? (
                  <div className="space-y-2 mt-4">
                    {(() => {
                      const list = Array.isArray(gradeCard.gradecard) ? [...gradeCard.gradecard] : [];

                      // helper to map grade to numeric value
                      const gradeToValue = (g) => {
                        if (!g) return -1;
                        const order = ["F", "D", "C", "C+", "B", "B+", "A", "A+"];
                        // give higher number to better grades
                        const idx = order.indexOf(g);
                        return idx === -1 ? -1 : idx;
                      };

                      if (gradeSort !== "default") {
                        list.sort((a, b) => {
                          const va = gradeToValue(a.grade);
                          const vb = gradeToValue(b.grade);
                          return gradeSort === "asc" ? va - vb : vb - va;
                        });
                      } else if (creditSort !== "default") {
                        list.sort((a, b) => {
                          const ca = parseFloat(a.coursecreditpoint) || 0;
                          const cb = parseFloat(b.coursecreditpoint) || 0;
                          return creditSort === "asc" ? ca - cb : cb - ca;
                        });
                      }

                      return list.map((subject) => (
                        <GradeCard key={subject.subjectcode} subject={subject} getGradeColor={getGradeColor} />
                      ));
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p>No grade card data available for this semester</p>
                  </div>
                )}
              </>
            )}
            <div className="w-full flex justify-end my-4 max-w-4xl">
              <Button
                variant="secondary"
                className="flex items-center gap-2 text-popover-foreground hover:text-accent-foreground border-border bg-background hover:bg-accent px-2 cursor-pointer"
                onClick={() => setIsDownloadDialogOpen(true)}
              >
                <Download className="h-4 w-4" />
                Download Marks
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="marks">
          <div className="w-full max-w-4xl mx-auto">
            {marksSemesters.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xl">Marks data is not available yet</p>
                <p className="text-muted-foreground mt-2">Please check back later</p>
              </div>
            ) : (
              <>
                <Select onValueChange={handleMarksSemesterChange} value={selectedMarksSem?.registration_id}>
                  <SelectTrigger className="bg-background text-foreground border-foreground cursor-pointer hover:bg-accent hover:text-accent-foreground">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent className="bg-background text-foreground border-foreground">
                    {marksSemesters.map((sem) => (
                      <SelectItem key={sem.registration_id} value={sem.registration_id}>
                        {sem.registration_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {marksLoading ? (
                  <div className="text-center mt-4">Loading marks data...</div>
                ) : marksSemesterData && marksSemesterData.courses ? (
                  <div className="space-y-4 mt-4">
                    {marksSemesterData.courses.map((course) => (
                      <MarksCard key={course.code} course={course} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center mt-4 text-muted-foreground">Select a semester to view marks</div>
                )}
              </>
            )}
            <div className="w-full flex justify-end my-4 max-w-4xl">
              <Button
                variant="secondary"
                className="flex items-center gap-2 text-popover-foreground hover:text-accent-foreground border-border bg-background hover:bg-accent px-2 cursor-pointer"
                onClick={() => setIsDownloadDialogOpen(true)}
              >
                <Download className="h-4 w-4" />
                Download Marks
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen}>
        <DialogContent className="bg-background text-foreground border-none">
          <DialogHeader>
            <DialogTitle className="text-popover-foreground">Download Marks</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {marksSemesters.map((sem) => (
              <Button
                key={sem.registration_id}
                variant="outline"
                className="w-full text-popover-foreground hover:text-accent-foreground bg-background hover:bg-accent border-none"
                onClick={() => handleDownloadMarks(sem)}
              >
                {sem.registration_code}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
