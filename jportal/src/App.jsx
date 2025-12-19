import { useState, useEffect, useRef } from "react";
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Attendance from "./components/Attendance";
import Grades from "./components/Grades";
import Exams from "./components/Exams";
import Subjects from "./components/Subjects";
import Profile from "./components/Profile";
import Cloudflare from "@/components/Cloudflare";
import { ThemeProvider } from "./components/theme-provider";
import { ThemeScript } from "./components/theme-script";
import { DynamicFontLoader } from "./components/DynamicFontLoader";
import { Toaster } from "./components/ui/sonner";
import "./App.css";

import { WebPortal, LoginError } from "https://cdn.jsdelivr.net/npm/jsjiit@0.0.23/dist/jsjiit.esm.js";

import MockWebPortal from "./components/MockWebPortal";
import { TriangleAlert } from "lucide-react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

// Create both portal instances at the top level
const realPortal = new WebPortal();
const mockPortal = new MockWebPortal();

// Create a wrapper component to use the useNavigate hook
function AuthenticatedApp({ w, setIsAuthenticated, setIsDemoMode }) {
  const [activeAttendanceTab, setActiveAttendanceTab] = useState("overview");
  const [attendanceData, setAttendanceData] = useState({});
  const [attendanceSemestersData, setAttendanceSemestersData] = useState(null);

  const [subjectData, setSubjectData] = useState({});
  const [subjectSemestersData, setSubjectSemestersData] = useState(null);
  const [subjectChoices, setSubjectChoices] = useState({});
  const [activeSubjectsTab, setActiveSubjectsTab] = useState("registered");
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsDataLoading, setSubjectsDataLoading] = useState(true);
  const [subjectChoicesLoading, setSubjectChoicesLoading] = useState(false);

  const [gradesData, setGradesData] = useState({});
  const [gradesSemesterData, setGradesSemesterData] = useState(null);

  const [selectedAttendanceSem, setSelectedAttendanceSem] = useState(null);
  const [selectedGradesSem, setSelectedGradesSem] = useState(null);
  const [selectedSubjectsSem, setSelectedSubjectsSem] = useState(null);

  const [attendanceDailyDate, setAttendanceDailyDate] = useState(new Date());
  const [isAttendanceCalendarOpen, setIsAttendanceCalendarOpen] = useState(false);
  const [isAttendanceTrackerOpen, setIsAttendanceTrackerOpen] = useState(false);
  const [attendanceSubjectCacheStatus, setAttendanceSubjectCacheStatus] = useState({});

  // Add attendance goal state
  const [attendanceGoal, setAttendanceGoal] = useState(() => {
    const savedGoal = localStorage.getItem("attendanceGoal");
    return savedGoal ? parseInt(savedGoal) : 75; // Default to 75% if not set
  });

  // Add effect to save goal to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("attendanceGoal", attendanceGoal.toString());
  }, [attendanceGoal]);

  // Add new profile data state
  const [profileData, setProfileData] = useState(null);

  // Add new state for grades component
  const [activeGradesTab, setActiveGradesTab] = useState("overview");
  const [gradeCardSemesters, setGradeCardSemesters] = useState([]);
  const [selectedGradeCardSem, setSelectedGradeCardSem] = useState(null);
  const [gradeCard, setGradeCard] = useState(null);

  // Add new state for storing grade cards
  const [gradeCards, setGradeCards] = useState({});

  // Add new states for subject attendance
  const [subjectAttendanceData, setSubjectAttendanceData] = useState({});
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Add new state for exams
  const [examSchedule, setExamSchedule] = useState({});
  const [examSemesters, setExamSemesters] = useState([]);
  const [selectedExamSem, setSelectedExamSem] = useState(null);
  const [selectedExamEvent, setSelectedExamEvent] = useState(null);

  // Add new state for marks
  const [marksSemesters, setMarksSemesters] = useState([]);
  const [selectedMarksSem, setSelectedMarksSem] = useState(null);
  const [marksSemesterData, setMarksSemesterData] = useState(null);
  const [marksData, setMarksData] = useState({});

  // Add these new states lifted from Grades.jsx
  const [gradesLoading, setGradesLoading] = useState(true);
  const [gradesError, setGradesError] = useState(null);
  const [gradeCardLoading, setGradeCardLoading] = useState(false);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [marksLoading, setMarksLoading] = useState(false);

  // Add these new states lifted from Attendance.jsx
  const [isAttendanceMetaLoading, setIsAttendanceMetaLoading] = useState(true);
  const [isAttendanceDataLoading, setIsAttendanceDataLoading] = useState(true);

  // Ref to measure header height
  const headerRef = useRef(null);

  // Measure header height and set CSS variable
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty('--header-height', `${height}px`);
      }
    };

    // Update on mount and when window resizes
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);

    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, []);

  return (
    <div className="min-h-screen pb-14 select-none">
      <div ref={headerRef} className="sticky top-0 z-30 bg-background">
        <Header setIsAuthenticated={setIsAuthenticated} setIsDemoMode={setIsDemoMode} />
      </div>
      <Routes>
        <Route path="/" element={<Navigate to="/attendance" />} />
        <Route path="/login" element={<Navigate to="/attendance" />} />
        <Route
          path="/attendance"
          element={
            <Attendance
              w={w}
              attendanceData={attendanceData}
              setAttendanceData={setAttendanceData}
              semestersData={attendanceSemestersData}
              setSemestersData={setAttendanceSemestersData}
              selectedSem={selectedAttendanceSem}
              setSelectedSem={setSelectedAttendanceSem}
              attendanceGoal={attendanceGoal}
              setAttendanceGoal={setAttendanceGoal}
              subjectAttendanceData={subjectAttendanceData}
              setSubjectAttendanceData={setSubjectAttendanceData}
              selectedSubject={selectedSubject}
              setSelectedSubject={setSelectedSubject}
              isAttendanceMetaLoading={isAttendanceMetaLoading}
              setIsAttendanceMetaLoading={setIsAttendanceMetaLoading}
              isAttendanceDataLoading={isAttendanceDataLoading}
              setIsAttendanceDataLoading={setIsAttendanceDataLoading}
              activeTab={activeAttendanceTab}
              setActiveTab={setActiveAttendanceTab}
              dailyDate={attendanceDailyDate}
              setDailyDate={setAttendanceDailyDate}
              calendarOpen={isAttendanceCalendarOpen}
              setCalendarOpen={setIsAttendanceCalendarOpen}
              isTrackerOpen={isAttendanceTrackerOpen}
              setIsTrackerOpen={setIsAttendanceTrackerOpen}
              subjectCacheStatus={attendanceSubjectCacheStatus}
              setSubjectCacheStatus={setAttendanceSubjectCacheStatus}
            />
          }
        />
        <Route
          path="/grades"
          element={
            <Grades
              w={w}
              gradesData={gradesData}
              setGradesData={setGradesData}
              semesterData={gradesSemesterData}
              setSemesterData={setGradesSemesterData}
              activeTab={activeGradesTab}
              setActiveTab={setActiveGradesTab}
              gradeCardSemesters={gradeCardSemesters}
              setGradeCardSemesters={setGradeCardSemesters}
              selectedGradeCardSem={selectedGradeCardSem}
              setSelectedGradeCardSem={setSelectedGradeCardSem}
              gradeCard={gradeCard}
              setGradeCard={setGradeCard}
              gradeCards={gradeCards}
              setGradeCards={setGradeCards}
              marksSemesters={marksSemesters}
              setMarksSemesters={setMarksSemesters}
              selectedMarksSem={selectedMarksSem}
              setSelectedMarksSem={setSelectedMarksSem}
              marksSemesterData={marksSemesterData}
              setMarksSemesterData={setMarksSemesterData}
              marksData={marksData}
              setMarksData={setMarksData}
              gradesLoading={gradesLoading}
              setGradesLoading={setGradesLoading}
              gradesError={gradesError}
              setGradesError={setGradesError}
              gradeCardLoading={gradeCardLoading}
              setGradeCardLoading={setGradeCardLoading}
              isDownloadDialogOpen={isDownloadDialogOpen}
              setIsDownloadDialogOpen={setIsDownloadDialogOpen}
              marksLoading={marksLoading}
              setMarksLoading={setMarksLoading}
            />
          }
        />
        <Route
          path="/exams"
          element={
            <Exams
              w={w}
              examSchedule={examSchedule}
              setExamSchedule={setExamSchedule}
              examSemesters={examSemesters}
              setExamSemesters={setExamSemesters}
              selectedExamSem={selectedExamSem}
              setSelectedExamSem={setSelectedExamSem}
              selectedExamEvent={selectedExamEvent}
              setSelectedExamEvent={setSelectedExamEvent}
            />
          }
        />
        <Route
          path="/subjects"
          element={
            <Subjects
              w={w}
              subjectData={subjectData}
              setSubjectData={setSubjectData}
              semestersData={subjectSemestersData}
              setSemestersData={setSubjectSemestersData}
              selectedSem={selectedSubjectsSem}
              setSelectedSem={setSelectedSubjectsSem}
              subjectChoices={subjectChoices}
              setSubjectChoices={setSubjectChoices}
              activeTab={activeSubjectsTab}
              setActiveTab={setActiveSubjectsTab}
              loading={subjectsLoading}
              setLoading={setSubjectsLoading}
              subjectsLoading={subjectsDataLoading}
              setSubjectsLoading={setSubjectsDataLoading}
              choicesLoading={subjectChoicesLoading}
              setChoicesLoading={setSubjectChoicesLoading}
            />
          }
        />
        <Route path="/profile" element={<Profile w={w} profileData={profileData} setProfileData={setProfileData} />} />
      </Routes>
      <Navbar />
    </div>
  );
}

function LoginWrapper({ onLoginSuccess, onDemoLogin, w }) {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    onLoginSuccess();
    // Add a small delay to ensure state updates before navigation
    setTimeout(() => {
      navigate("/attendance");
    }, 100);
  };

  const handleDemoLogin = () => {
    onDemoLogin();
    // Add a small delay to ensure state updates before navigation
    setTimeout(() => {
      navigate("/attendance");
    }, 100);
  };

  return <Login onLoginSuccess={handleLoginSuccess} onDemoLogin={handleDemoLogin} w={w} />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine which portal to use based on demo mode
  const activePortal = isDemoMode ? mockPortal : realPortal;

  useEffect(() => {
    const username = localStorage.getItem("username");
    const password = localStorage.getItem("password");

    const performLogin = async () => {
      try {
        if (username && password) {
          await realPortal.student_login(username, password);
          if (realPortal.session) {
            setIsAuthenticated(true);
            setIsDemoMode(false);
          }
        }
      } catch (error) {
        if (
          error instanceof LoginError &&
          error.message.includes("JIIT Web Portal server is temporarily unavailable")
        ) {
          setError("JIIT Web Portal server is temporarily unavailable. Please try again later.");
        } else if (error instanceof LoginError && error.message.includes("Failed to fetch")) {
          setError(
            "Please check your internet connection. If connected, JIIT Web Portal server is temporarily unavailable."
          );
        } else {
          console.error("Auto-login failed:", error);
          setError("Auto-login failed. Please login again.");
        }
        localStorage.removeItem("username");
        localStorage.removeItem("password");
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    performLogin();
  }, []);

  const handleRealLogin = () => {
    setIsAuthenticated(true);
    setIsDemoMode(false);
  };

  const handleDemoLogin = () => {
    setIsAuthenticated(true);
    setIsDemoMode(true);
  };

  if (isLoading) {
    return (
      <>
        <ThemeScript />
        <ThemeProvider>
          <DynamicFontLoader />
          <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
            Signing in...
          </div>
        </ThemeProvider>
      </>
    );
  }

  return (
    <>
      <ThemeScript />
      <ThemeProvider>
        <DynamicFontLoader />
        <QueryClientProvider client={queryClient}>
          <Toaster
            richColors
            icons={{
              error: <TriangleAlert className="h-4 w-4" />,
            }}
            toastOptions={{
              style: {
                background: "var(--popover)",
                color: "var(--popover-foreground)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-lg)",
              },
            }}
          />
          <Router>
            <div className="min-h-screen bg-background select-none">
              <Routes>
                {/* Public route - accessible without authentication */}
                <Route path="/stats" element={<Cloudflare />} />

                {/* Protected routes - require authentication */}
                {!isAuthenticated ? (
                  <Route
                    path="*"
                    element={
                      <>
                        {error && <div className="text-destructive text-center pt-4">{error}</div>}
                        <LoginWrapper
                          onLoginSuccess={handleRealLogin}
                          onDemoLogin={handleDemoLogin}
                          w={realPortal}
                        />
                      </>
                    }
                  />
                ) : (
                  <Route
                    path="/*"
                    element={
                      <AuthenticatedApp
                        w={activePortal}
                        setIsAuthenticated={setIsAuthenticated}
                        setIsDemoMode={setIsDemoMode}
                      />
                    }
                  />
                )}
              </Routes>
            </div>
          </Router>
        </QueryClientProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
