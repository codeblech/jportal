import { useState, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Header from "./components/Header";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Attendance from "./components/Attendance";
import Grades from "./components/Grades";
import Exams from "./components/Exams";
import Subjects from "./components/Subjects";
import Profile from "./components/Profile";
import ThemeSwitcher from "./components/ThemeSwitcher";
import GeneralSettings from "./components/GeneralSettings";
import "./App.css";

import {
  WebPortal,
  LoginError,
} from "https://cdn.jsdelivr.net/npm/jsjiit@0.0.20/dist/jsjiit.esm.js";

import { useSwipeable } from "react-swipeable";

// Create WebPortal instance at the top level
const w = new WebPortal();

// Create a wrapper component to use the useNavigate hook
function AuthenticatedApp({ w, setIsAuthenticated, guest }) {
  const [activeAttendanceTab, setActiveAttendanceTab] = useState("overview");
  const [attendanceData, setAttendanceData] = useState({});
  const [attendanceSemestersData, setAttendanceSemestersData] = useState(null);

  const [subjectData, setSubjectData] = useState({});
  const [subjectSemestersData, setSubjectSemestersData] = useState(null);

  const [gradesData, setGradesData] = useState({});
  const [gradesSemesterData, setGradesSemesterData] = useState(null);

  const [selectedAttendanceSem, setSelectedAttendanceSem] = useState(null);
  const [selectedGradesSem, setSelectedGradesSem] = useState(null);
  const [selectedSubjectsSem, setSelectedSubjectsSem] = useState(null);

  const [attendanceDailyDate, setAttendanceDailyDate] = useState(new Date());
  const [isAttendanceCalendarOpen, setIsAttendanceCalendarOpen] =
    useState(false);
  const [isAttendanceTrackerOpen, setIsAttendanceTrackerOpen] = useState(false);
  const [attendanceSubjectCacheStatus, setAttendanceSubjectCacheStatus] =
    useState({});

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

  return (
    <div className="min-h-screen pb-14 select-none">
      <div className="sticky top-0 z-30 bg-[var(--bg-color)] -mt-[2px]">
        <Header setIsAuthenticated={setIsAuthenticated} />
      </div>
      <div className="md:ml-56 transition-all duration-300">
        <Routes>
          <Route path="/" element={<Navigate to={getEntryPoint()} />} />
          <Route path="/login" element={<Navigate to={getEntryPoint()} />} />
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
                activeTab={activeAttendanceTab || getAttendanceEntryTab()}
                setActiveTab={setActiveAttendanceTab}
                dailyDate={attendanceDailyDate}
                setDailyDate={setAttendanceDailyDate}
                calendarOpen={isAttendanceCalendarOpen}
                setCalendarOpen={setIsAttendanceCalendarOpen}
                isTrackerOpen={isAttendanceTrackerOpen}
                setIsTrackerOpen={setIsAttendanceTrackerOpen}
                subjectCacheStatus={attendanceSubjectCacheStatus}
                setSubjectCacheStatus={setAttendanceSubjectCacheStatus}
                guest={guest}
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
                activeTab={activeGradesTab || getGradesEntryTab()}
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
                guest={guest}
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
              />
            }
          />
          <Route
            path="/profile"
            element={
              <Profile
                w={w}
                profileData={profileData}
                setProfileData={setProfileData}
                guest={guest}
              />
            }
          />
          <Route path="/settings" element={<ThemeSwitcher />} />
          <Route path="/general-settings" element={<GeneralSettings />} />
        </Routes>
      </div>
      <Navbar />
    </div>
  );
}

function LoginWrapper({ setIsAuthenticated, setCurrentW, setIsGuest }) {
  const navigate = useNavigate();

  const handleLoginSuccess = (maybeW, opts) => {
    if (maybeW) {
      setCurrentW(maybeW);
      setIsGuest(opts?.guest || false);
    } else {
      setCurrentW(w);
      setIsGuest(false);
    }
    setIsAuthenticated(true);
    setTimeout(() => {
      navigate(getEntryPoint());
    }, 100);
  };

  return <Login onLoginSuccess={handleLoginSuccess} w={w} />;
}

function AppWithGlobalSwipe({ children }) {
  const location = useLocation();
  const globalSwipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (location.pathname === "/attendance") {
        window.dispatchEvent(
          new CustomEvent("attendanceSwipe", { detail: { direction: "left" } })
        );
      } else if (location.pathname === "/grades") {
        window.dispatchEvent(
          new CustomEvent("gradesSwipe", { detail: { direction: "left" } })
        );
      }
    },
    onSwipedRight: () => {
      if (location.pathname === "/attendance") {
        window.dispatchEvent(
          new CustomEvent("attendanceSwipe", { detail: { direction: "right" } })
        );
      } else if (location.pathname === "/grades") {
        window.dispatchEvent(
          new CustomEvent("gradesSwipe", { detail: { direction: "right" } })
        );
      }
    },
    delta: 50,
    swipeDuration: 500,
    trackTouch: true,
    trackMouse: true,
    preventDefaultTouchmoveEvent: false,
  });
  return (
    <div
      className="min-h-screen bg-[var(--bg-color)] select-none"
      {...globalSwipeHandlers}
    >
      {children}
    </div>
  );
}

function getEntryPoint() {
  return localStorage.getItem("entryPoint") || "/attendance";
}

function getAttendanceEntryTab() {
  return localStorage.getItem("attendanceEntryTab") || "overview";
}

function getGradesEntryTab() {
  return localStorage.getItem("gradesEntryTab") || "overview";
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentW, setCurrentW] = useState(w);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const username = localStorage.getItem("username");
    const password = localStorage.getItem("password");

    const performLogin = async () => {
      try {
        if (username && password) {
          await w.student_login(username, password);
          if (w.session) {
            setCurrentW(w);
            setIsGuest(false);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        if (
          error instanceof LoginError &&
          error.message.includes(
            "JIIT Web Portal server is temporarily unavailable"
          )
        ) {
          setError(
            "JIIT Web Portal server is temporarily unavailable. Please try again later."
          );
        } else if (
          error instanceof LoginError &&
          error.message.includes("Failed to fetch")
        ) {
          setError(
            "Please check your internet connection. If connected, JIIT Web Portal server is unavailable."
          );
        } else {
          console.error("Auto-login failed:", error);
          setError("Auto-login failed. Please login again.");
        }
        localStorage.removeItem("username");
        localStorage.removeItem("password");
        setIsAuthenticated(false);
        setCurrentW(w);
        setIsGuest(false);
      } finally {
        setIsLoading(false);
      }
    };

    performLogin();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-color)] text-[var(--text-color)]">
        Signing in...
      </div>
    );
  }

  return (
    <Router>
      <AppWithGlobalSwipe>
        {!isAuthenticated || !currentW.session ? (
          <Routes>
            <Route
              path="*"
              element={
                <>
                  {error && (
                    <div className="text-red-500 text-center pt-4">{error}</div>
                  )}
                  <LoginWrapper
                    setIsAuthenticated={setIsAuthenticated}
                    setCurrentW={setCurrentW}
                    setIsGuest={setIsGuest}
                  />
                </>
              }
            />
          </Routes>
        ) : (
          <AuthenticatedApp
            w={currentW}
            setIsAuthenticated={setIsAuthenticated}
            guest={isGuest}
          />
        )}
      </AppWithGlobalSwipe>
    </Router>
  );
}

export default App;
