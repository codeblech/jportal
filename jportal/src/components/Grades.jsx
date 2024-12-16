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
  setMarksSemesterData
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gradeCardLoading, setGradeCardLoading] = useState(false);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (semesterData) {
          setLoading(false);
          return;
        }

        const data = await w.get_sgpa_cgpa();
        setGradesData(data);
        setSemesterData(data.semesterList);
      } catch (err) {
        setError("Failed to fetch grade data");
        console.error(err);
      } finally {
        setLoading(false);
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

      // Sample data - in a real app this would come from an API
      const sampleData = {
      "student_info": {
        "name": "YASH MALIK",
        "enrollment_no": "22103171",
        "program": "B.T",
        "branch": "CSE",
        "semester": "5",
        "registration_code": "2023EVESEM"
      },
      "meta": {
        "exams": ["ENDTERM-23EVENSEM", "T1-2023 EVEN SEM", "T-2 OF EVEN SEM 2023", "LAB-MID VIVA", "LAB-END VIVA"],
        "cols": 5,
        "rows": 9
      },
      "courses": [
        {
          "code": "15B11CI211",
          "name": "SOFTWARE DEVELOPMENT FUNDAMENTALS-2",
          "exams": {
            "ENDTERM-23EVENSEM": { "remarks": "none", "OM": 29.5, "FM": 35.0, "OW": 29.5, "WT": 35.0 },
            "T1-2023 EVEN SEM": { "remarks": "none", "OM": 12.5, "FM": 20.0, "OW": 12.5, "WT": 20.0 },
            "T-2 OF EVEN SEM 2023": { "remarks": "none", "OM": 14.5, "FM": 20.0, "OW": 14.5, "WT": 20.0 }
          }
        },
        {
          "code": "15B11EC111",
          "name": "ELECTRICAL SCIENCE-1",
          "exams": {
            "ENDTERM-23EVENSEM": { "remarks": "none", "OM": 24.0, "FM": 35.0, "OW": 24.0, "WT": 35.0 },
            "T1-2023 EVEN SEM": { "remarks": "none", "OM": 16.0, "FM": 20.0, "OW": 16.0, "WT": 20.0 },
            "T-2 OF EVEN SEM 2023": { "remarks": "none", "OM": 10.0, "FM": 20.0, "OW": 10.0, "WT": 20.0 }
          }
        },
        {
          "code": "15B11MA211",
          "name": "MATHEMATICS-2",
          "exams": {
            "ENDTERM-23EVENSEM": { "remarks": "none", "OM": 9.0, "FM": 35.0, "OW": 9.0, "WT": 35.0 },
            "T1-2023 EVEN SEM": { "remarks": "none", "OM": 5.0, "FM": 20.0, "OW": 5.0, "WT": 20.0 },
            "T-2 OF EVEN SEM 2023": { "remarks": "none", "OM": 7.0, "FM": 20.0, "OW": 7.0, "WT": 20.0 }
          }
        },
        {
          "code": "15B11PH211",
          "name": "PHYSICS-2",
          "exams": {
            "ENDTERM-23EVENSEM": { "remarks": "none", "OM": 34.0, "FM": 35.0, "OW": 34.0, "WT": 35.0 },
            "T1-2023 EVEN SEM": { "remarks": "none", "OM": 12.0, "FM": 20.0, "OW": 12.0, "WT": 20.0 },
            "T-2 OF EVEN SEM 2023": { "remarks": "none", "OM": 15.0, "FM": 20.0, "OW": 15.0, "WT": 20.0 }
          }
        },
        {
          "code": "15B17CI271",
          "name": "SOFTWARE DEVELOPMENT LAB-2",
          "exams": {
            "LAB-MID VIVA": { "remarks": "none", "OM": 19.0, "FM": 20.0, "OW": 19.0, "WT": 20.0 },
            "LAB-END VIVA": { "remarks": "none", "OM": 17.0, "FM": 20.0, "OW": 17.0, "WT": 20.0 }
          }
        },
        {
          "code": "15B17EC171",
          "name": "ELECTRICAL SCIENCE LAB -1",
          "exams": {
            "LAB-MID VIVA": { "remarks": "none", "OM": 16.0, "FM": 20.0, "OW": 16.0, "WT": 20.0 },
            "LAB-END VIVA": { "remarks": "none", "OM": 14.0, "FM": 20.0, "OW": 14.0, "WT": 20.0 }
          }
        },
        {
          "code": "15B17PH271",
          "name": "PHYSICS LAB-2",
          "exams": {
            "LAB-MID VIVA": { "remarks": "none", "OM": 14.0, "FM": 20.0, "OW": 14.0, "WT": 20.0 },
            "LAB-END VIVA": { "remarks": "none", "OM": 14.0, "FM": 20.0, "OW": 14.0, "WT": 20.0 }
          }
        },
        {
          "code": "18B15GE112",
          "name": "WORKSHOP",
          "exams": {
            "LAB-MID VIVA": { "remarks": "none", "OM": 8.0, "FM": 20.0, "OW": 8.0, "WT": 20.0 },
            "LAB-END VIVA": { "remarks": "none", "OM": 16.0, "FM": 20.0, "OW": 16.0, "WT": 20.0 }
          }
        },
        {
          "code": "22B12HS111",
          "name": "LIFE SKILLS AND EFFECTIVE COMMUNICATION",
          "exams": {
            "ENDTERM-23EVENSEM": { "remarks": "none", "OM": 25.0, "FM": 35.0, "OW": 25.0, "WT": 35.0 },
            "T1-2023 EVEN SEM": { "remarks": "none", "OM": 13.5, "FM": 20.0, "OW": 13.5, "WT": 20.0 },
            "T-2 OF EVEN SEM 2023": { "remarks": "none", "OM": 16.0, "FM": 20.0, "OW": 16.0, "WT": 20.0 }
          }
        }
      ],
      "legend": { "FM": "FullMarks", "OM": "ObtainedMarks", "OW": "ObtainedWeightage", "WT": "Weightage" }
    };

      // Check if we already have the data in cache
      if (marksData[value]) {
        setMarksSemesterData(marksData[value]);
      } else {
        // Use sample data instead of API call
        setMarksSemesterData(sampleData);
        setMarksData(prev => ({
          ...prev,
          [value]: sampleData
        }));
      }
    } catch (error) {
      console.error("Failed to load marks:", error);
    }
  };

  if (loading) {
    return <div className="text-white flex items-center justify-center py-4 h-[calc(100vh-<header_height>-<navbar_height>)]">Loading grades...</div>;
  }

  if (error) {
    return <div className="bg-[#191c20] text-white p-6">{error}</div>;
  }

  return (
    <div className="text-white pt-2 pb-4 px-3 font-sans">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 bg-[#191c20]">
          <TabsTrigger
            value="overview"
            className="bg-[#191c20] data-[state=active]:bg-[#1f2937] data-[state=active]:text-white"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="semester"
            className="bg-[#191c20] data-[state=active]:bg-[#1f2937] data-[state=active]:text-white"
          >
            Semester
          </TabsTrigger>
          <TabsTrigger
            value="marks"
            className="bg-[#191c20] data-[state=active]:bg-[#1f2937] data-[state=active]:text-white"
          >
            Marks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="flex flex-col items-center">
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
                  className="flex justify-between items-center py-1 border-b border-gray-700"
                >
                  <div className="flex-1">
                    <h2 className="text-sm font-semibold">Semester {sem.stynumber}</h2>
                    <p className="text-sm text-gray-400">
                      GP: {sem.earnedgradepoints.toFixed(1)}/{sem.totalcoursecredit * 10}
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-400">{sem.sgpa}</div>
                      <div className="text-xs text-gray-400">SGPA</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-blue-400">{sem.cgpa}</div>
                      <div className="text-xs text-gray-400">CGPA</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="semester">
          <div className="w-full max-w-4xl mx-auto">
            <Select onValueChange={handleSemesterChange} value={selectedGradeCardSem?.registration_id}>
              <SelectTrigger className="bg-[#191c20] text-white border-white">
                <SelectValue placeholder={gradeCardLoading ? "Loading semesters..." : "Select semester"}>
                  {selectedGradeCardSem?.registration_code}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#191c20] text-white border-white">
                {gradeCardSemesters.map((sem) => (
                  <SelectItem key={sem.registration_id} value={sem.registration_id}>
                    {sem.registration_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {gradeCardLoading ? (
              <div className="text-white flex items-center justify-center py-4 h-[calc(100vh-<header_height>-<navbar_height>)]">Loading subjects...</div>
            ) : gradeCard && (
              <div className="space-y-2 mt-4">
                {gradeCard.gradecard.map((subject) => (
                  <GradeCard
                    key={subject.subjectcode}
                    subject={subject}
                    getGradeColor={getGradeColor}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="marks">
          <div className="w-full max-w-4xl mx-auto">
            <Select onValueChange={handleMarksSemesterChange} value={selectedMarksSem?.registration_id}>
              <SelectTrigger className="bg-[#191c20] text-white border-white">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent className="bg-[#191c20] text-white border-white">
                {marksSemesters.map((sem) => (
                  <SelectItem key={sem.registration_id} value={sem.registration_id}>
                    {sem.registration_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {marksSemesterData && (
              <div className="space-y-4 mt-4">
                {marksSemesterData.courses.map((course) => (
                  <MarksCard key={course.code} course={course} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="w-full flex justify-end my-4 max-w-4xl">
        <Button
          variant="secondary"
          className="flex items-center gap-2 text-gray-300 hover:text-white border-gray-600 hover:border-gray-400 bg-[#191c20] hover:bg-[#1f2937] px-0"
          onClick={() => setIsDownloadDialogOpen(true)}
        >
          <Download className="h-4 w-4" />
          Download Marks
        </Button>
      </div>

      <Dialog open={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen}>
        <DialogContent className="bg-[#191c20] text-white border-none">
          <DialogHeader>
            <DialogTitle className="text-gray-200">Download Marks</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {marksSemesters.map((sem) => (
              <Button
                key={sem.registration_id}
                variant="outline"
                className="w-full text-gray-300 hover:text-white  bg-[#191c20] hover:bg-[#1f2937] border-none"
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