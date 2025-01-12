import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import GradeCard from "./GradeCard";
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import MarksCard from "./MarksCard";
import { generate_local_name, API } from "https://cdn.jsdelivr.net/npm/jsjiit@0.0.16/dist/jsjiit.esm.js";

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
  setMarksLoading
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
        if (err.message.includes('Unexpected end of JSON input')) {
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
            setGradeCards(prev => ({
              ...prev,
              [latestSemester.registration_id]: data
            }));
          }
        } catch (err) {
          console.error("Failed to fetch grade card semesters:", err);
        }
      }
    };
    fetchGradeCardSemesters();
  }, [w, gradeCardSemesters.length, setGradeCardSemesters, selectedGradeCardSem]);

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
        const ENDPOINT = `/studentsexamview/printstudent-exammarks/${w.session.instituteid}/${selectedMarksSem.registration_id}/${selectedMarksSem.registration_code}`;
        const localname = await generate_local_name();
        const headers = await w.session.get_headers(localname);

        const pyodide = await loadPyodide();

        pyodide.globals.set('ENDPOINT', ENDPOINT);
        pyodide.globals.set('fetchOptions', { method: 'GET', headers });
        pyodide.globals.set('API', API);

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
            create_pyproxies: false
          });

          setMarksSemesterData(result);
          setMarksData(prev => ({
            ...prev,
            [selectedMarksSem.registration_id]: result
          }));
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
      const semester = gradeCardSemesters.find(sem => sem.registration_id === value);
      setSelectedGradeCardSem(semester);

      if (gradeCards[value]) {
        setGradeCard(gradeCards[value]);
      } else {
        const data = await w.get_grade_card(semester);
        data.semesterId = value;
        setGradeCard(data);
        setGradeCards(prev => ({
          ...prev,
          [value]: data
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
      'A+': 'text-green-400',
      'A': 'text-green-500',
      'B+': 'text-yellow-400',
      'B': 'text-yellow-500',
      'C+': 'text-yellow-600',
      'C': 'text-orange-400',
      'D': 'text-orange-500',
      'F': 'text-red-500'
    };
    return gradeColors[grade] || 'text-white';
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
      const semester = marksSemesters.find(sem => sem.registration_id === value);
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
    return <div className="text-white flex items-center justify-center py-4 h-[calc(100vh-<header_height>-<navbar_height>)]">Loading grades...</div>;
  }

  return (
    <div className="text-white dark:text-black pt-2 pb-4 px-3 font-sans">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 bg-[#191c20] dark:bg-white">
          <TabsTrigger
            value="overview"
            className="bg-[#191c20] dark:bg-white data-[state=active]:bg-[#1f2937] dark:data-[state=active]:bg-gray-200 data-[state=active]:text-white dark:data-[state=active]:text-black"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="semester"
            className="bg-[#191c20] dark:bg-white data-[state=active]:bg-[#1f2937] dark:data-[state=active]:bg-gray-200 data-[state=active]:text-white dark:data-[state=active]:text-black"
          >
            Semester
          </TabsTrigger>
          <TabsTrigger
            value="marks"
            className="bg-[#191c20] dark:bg-white data-[state=active]:bg-[#1f2937] dark:data-[state=active]:bg-gray-200 data-[state=active]:text-white dark:data-[state=active]:text-black"
          >
            Marks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="flex flex-col items-center">
            {gradesError ? (
              <div className="w-full max-w-4xl text-center py-8">
                <p className="text-xl">{gradesError}</p>
                <p className="text-gray-400 dark:text-gray-600 mt-2">Please check back later</p>
              </div>
            ) : (
              <>
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis
                        dataKey="stynumber"
                        stroke="#9CA3AF"
                        label={{ value: 'Semester', position: 'bottom', fill: '#9CA3AF' }}
                        tickFormatter={(value) => `${value}`}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        domain={['dataMin', 'dataMax']}
                        ticks={undefined}
                        tickCount={5}
                        padding={{ top: 20, bottom: 20 }}
                        tickFormatter={(value) => value.toFixed(1)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#374151',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff'
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        height={36}
                      />
                      <Line
                        type="monotone"
                        dataKey="sgpa"
                        stroke="#4ADE80"
                        name="SGPA"
                        strokeWidth={2}
                        dot={{ fill: '#4ADE80' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cgpa"
                        stroke="#60A5FA"
                        name="CGPA"
                        strokeWidth={2}
                        dot={{ fill: '#60A5FA' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 w-full max-w-4xl">
                  {semesterData.map((sem) => (
                    <div
                      key={sem.stynumber}
                      className="flex justify-between items-center py-1 border-b border-gray-700 dark:border-gray-300"
                    >
                      <div className="flex-1">
                        <h2 className="text-sm font-semibold">Semester {sem.stynumber}</h2>
                        <p className="text-sm text-gray-400 dark:text-gray-600">
                          GP: {sem.earnedgradepoints.toFixed(1)}/{sem.totalcoursecredit * 10}
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <div className="text-xl font-bold text-green-400 dark:text-green-600">{sem.sgpa}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-600">SGPA</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xl font-bold text-blue-400 dark:text-blue-600">{sem.cgpa}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-600">CGPA</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="semester">
          <div className="w-full max-w-4xl mx-auto">
            {gradeCardSemesters.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xl">Grade card is not available yet</p>
                <p className="text-gray-400 dark:text-gray-600 mt-2">Please check back later</p>
              </div>
            ) : (
              <>
                <Select onValueChange={handleSemesterChange} value={selectedGradeCardSem?.registration_id}>
                  <SelectTrigger className="bg-[#191c20] dark:bg-white text-white dark:text-black border-white dark:border-black">
                    <SelectValue placeholder={gradeCardLoading ? "Loading semesters..." : "Select semester"}>
                      {selectedGradeCardSem?.registration_code}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#191c20] dark:bg-white text-white dark:text-black border-white dark:border-black">
                    {gradeCardSemesters.map((sem) => (
                      <SelectItem key={sem.registration_id} value={sem.registration_id}>
                        {sem.registration_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {gradeCardLoading ? (
                  <div className="text-white dark:text-black flex items-center justify-center py-4">Loading subjects...</div>
                ) : gradeCard ? (
                  <div className="space-y-2 mt-4">
                    {gradeCard.gradecard.map((subject) => (
                      <GradeCard
                        key={subject.subjectcode}
                        subject={subject}
                        getGradeColor={getGradeColor}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p>No grade card data available for this semester</p>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="marks">
          <div className="w-full max-w-4xl mx-auto">
            {marksSemesters.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xl">Marks data is not available yet</p>
                <p className="text-gray-400 dark:text-gray-600 mt-2">Please check back later</p>
              </div>
            ) : (
              <>
                <Select onValueChange={handleMarksSemesterChange} value={selectedMarksSem?.registration_id}>
                  <SelectTrigger className="bg-[#191c20] dark:bg-white text-white dark:text-black border-white dark:border-black">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#191c20] dark:bg-white text-white dark:text-black border-white dark:border-black">
                    {marksSemesters.map((sem) => (
                      <SelectItem key={sem.registration_id} value={sem.registration_id}>
                        {sem.registration_code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {marksLoading ? (
                  <div className="text-center mt-4 text-white dark:text-black">
                    Loading marks data...
                  </div>
                ) : marksSemesterData && marksSemesterData.courses ? (
                  <div className="space-y-4 mt-4">
                    {marksSemesterData.courses.map((course) => (
                      <MarksCard key={course.code} course={course} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center mt-4 text-gray-400 dark:text-gray-600">
                    Select a semester to view marks
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="w-full flex justify-end my-4 max-w-4xl">
        <Button
          variant="secondary"
          className="flex items-center gap-2 text-gray-300 dark:text-gray-700 hover:text-white dark:hover:text-black border-gray-600 dark:border-gray-400 hover:border-gray-400 dark:hover:border-gray-600 bg-[#191c20] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-gray-200 px-0"
          onClick={() => setIsDownloadDialogOpen(true)}
        >
          <Download className="h-4 w-4" />
          Download Marks
        </Button>
      </div>

      <Dialog open={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen}>
        <DialogContent className="bg-[#191c20] dark:bg-white text-white dark:text-black border-none">
          <DialogHeader>
            <DialogTitle className="text-gray-200 dark:text-gray-800">Download Marks</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {marksSemesters.map((sem) => (
              <Button
                key={sem.registration_id}
                variant="outline"
                className="w-full text-gray-300 dark:text-gray-700 hover:text-white dark:hover:text-black bg-[#191c20] dark:bg-white hover:bg-[#1f2937] dark:hover:bg-gray-200 border-none"
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