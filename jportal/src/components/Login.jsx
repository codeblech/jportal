import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LoginError } from "https://cdn.jsdelivr.net/npm/jsjiit@0.0.20/dist/jsjiit.esm.js";
import Loader from "./Loader";
import { useTheme } from "./ThemeProvider";
import { useRef } from "react";
import {
  TextField as MuiTextField,
  Button as MuiButton,
  FormControl as MuiFormControl,
  InputLabel as MuiInputLabel,
} from "@mui/material";
import fakedata from "../../fakedata.json";

// Define the form schema
const formSchema = z.object({
  enrollmentNumber: z.string({
    required_error: "Enrollment number is required",
  }),
  password: z.string({
    required_error: "Password is required",
  }),
});

export default function Login({ onLoginSuccess, w }) {
  const [loginStatus, setLoginStatus] = useState({
    isLoading: false,
    error: null,
    credentials: null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showError, setShowError] = useState(true); // New state for error visibility
  const errorRef = useRef(null);
  const { useMaterialUI } = useTheme();
  const [useMock, setUseMock] = useState(false);
  // Add guest mode state
  const [isGuest, setIsGuest] = useState(false);

  // Mock API implementation
  function getMockW() {
    return {
      // Attendance
      get_attendance_meta: async () => ({
        semesters: fakedata.attendance.semestersData.semesters,
        latest_header: () => fakedata.attendance.semestersData.latest_header,
        latest_semester: () =>
          fakedata.attendance.semestersData.latest_semester,
      }),
      get_attendance: async (header, sem) => {
        const id = sem.registration_id || sem;
        return fakedata.attendance.attendanceData[id];
      },
      get_subject_daily_attendance: async (
        sem,
        subjectid,
        individualsubjectcode,
        subjectcomponentids
      ) => {
        // Return mock subject attendance data
        const subj = Object.keys(fakedata.attendance.subjectAttendanceData)[0];
        return {
          studentAttdsummarylist:
            fakedata.attendance.subjectAttendanceData[subj],
        };
      },
      // Grades
      get_sgpa_cgpa: async () => fakedata.grades.gradesData,
      get_semesters_for_grade_card: async () =>
        fakedata.grades.gradeCardSemesters,
      get_grade_card: async (sem) => {
        const id = sem.registration_id || sem;
        return fakedata.grades.gradeCards[id];
      },
      get_semesters_for_marks: async () => fakedata.grades.marksSemesters,
      // Simulate PDF marks parsing
      download_marks: async (sem) => {},
      // For marks page
      session: {
        instituteid: "JIIT",
        get_headers: async () => ({}),
      },
      // For marks data
      // (simulate pyodide result)
      // ...
      // Subjects
      get_registered_semesters: async () =>
        fakedata.subjects.semestersData.semesters,
      get_registered_subjects_and_faculties: async (sem) => {
        const id = sem.registration_id || sem;
        return fakedata.subjects.subjectData[id];
      },
      // Profile
      get_personal_info: async () => fakedata.profile,
      // Exams
      get_semesters_for_exam_events: async () => fakedata.exams.examSemesters,
      get_exam_events: async (sem) => fakedata.exams.examEvents,
      get_exam_schedule: async (event) => ({
        subjectinfo: fakedata.exams.examSchedule[event.exam_event_id || event],
      }),
      // Login
      student_login: async (enrollmentNumber, password) => {
        // Always succeed for mock
        return true;
      },
    };
  }

  // Initialize form
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      enrollmentNumber: "",
      password: "",
    },
  });

  // Handle side effects in useEffect
  useEffect(() => {
    if (!loginStatus.credentials) return;

    const performLogin = async () => {
      try {
        await w.student_login(
          loginStatus.credentials.enrollmentNumber,
          loginStatus.credentials.password
        );

        // Store credentials in localStorage
        localStorage.setItem(
          "username",
          loginStatus.credentials.enrollmentNumber
        );
        localStorage.setItem("password", loginStatus.credentials.password);

        console.log("Login successful");
        setLoginStatus((prev) => ({
          ...prev,
          isLoading: false,
          credentials: null,
        }));
        onLoginSuccess();
      } catch (error) {
        if (
          error instanceof LoginError &&
          error.message.includes(
            "JIIT Web Portal server is temporarily unavailable"
          )
        ) {
          console.error("JIIT Web Portal server is temporarily unavailable");
          setLoginStatus((prev) => ({
            ...prev,
            isLoading: false,
            error:
              "JIIT Web Portal server is temporarily unavailable. Please try again later.",
            credentials: null,
          }));
        } else if (
          error instanceof LoginError &&
          error.message.includes("Failed to fetch")
        ) {
          setLoginStatus((prev) => ({
            ...prev,
            isLoading: false,
            error:
              "Please check your internet connection. If connected, JIIT Web Portal server is unavailable.",
            credentials: null,
          }));
        } else {
          console.error("Login failed:", error);
          setLoginStatus((prev) => ({
            ...prev,
            isLoading: false,
            error: "Login failed. Please check your credentials.",
            credentials: null,
          }));
        }
      }
    };

    setLoginStatus((prev) => ({ ...prev, isLoading: true }));
    performLogin();
  }, [loginStatus.credentials, onLoginSuccess, w]);

  useEffect(() => {
    if (loginStatus.error) setShowError(true);
  }, [loginStatus.error]);

  // Clean form submission
  function onSubmit(values) {
    setLoginStatus((prev) => ({
      ...prev,
      credentials: values,
      error: null,
    }));
  }

  if (loginStatus.isLoading) {
    return <Loader message="Logging in..." />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg-color)]">
      <style>{`
        .fade-in-error {
          animation: fadeIn 0.4s;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="w-full max-w-md space-y-6 p-6 rounded-[var(--radius)] shadow-lg bg-[var(--card-bg)]">
        <div className="space-y-2 text-center text-[var(--text-color)]">
          <h1 className="text-2xl font-bold">Login</h1>
          <p>Enter your credentials to sign in</p>
        </div>
        {loginStatus.error && showError && (
          <div
            ref={errorRef}
            role="alert"
            className="fade-in-error mb-4 flex items-center justify-between bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            style={{ fontWeight: 500 }}
          >
            <span>{loginStatus.error}</span>
            <button
              onClick={() => setShowError(false)}
              className="ml-4 text-red-700 hover:text-red-900 focus:outline-none"
              aria-label="Dismiss error"
              tabIndex={0}
              type="button"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              onSubmit(values);
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="enrollmentNumber"
              render={({ field }) => {
                // Remove placeholder/label when typing
                const isFilled = !!field.value;
                return (
                  <FormItem>
                    {!useMaterialUI && !loginStatus.isLoading && (
                      <FormLabel className="text-[var(--label-color)]">
                        Enrollment Number
                      </FormLabel>
                    )}
                    <FormControl>
                      {useMaterialUI ? (
                        <MuiFormControl fullWidth variant="outlined">
                          {!loginStatus.isLoading && (
                            <MuiInputLabel
                              id="login-enrollment-label"
                              sx={{ color: "var(--label-color)" }}
                              shrink={isFilled ? true : undefined}
                            >
                              {!isFilled ? "Enrollment Number" : ""}
                            </MuiInputLabel>
                          )}
                          <MuiTextField
                            {...field}
                            labelId="login-enrollment-label"
                            label={
                              !loginStatus.isLoading && !isFilled
                                ? "Enrollment Number"
                                : ""
                            }
                            variant="outlined"
                            fullWidth
                            sx={{
                              background: "var(--card-bg)",
                              color: "var(--text-color)",
                              borderRadius: "var(--radius)",
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
                              "& .MuiInputBase-input": {
                                color: "var(--text-color)",
                              },
                            }}
                            InputProps={{
                              style: { color: "var(--text-color)" },
                            }}
                          />
                        </MuiFormControl>
                      ) : (
                        <Input
                          {...field}
                          placeholder={!field.value ? "Enrollment Number" : ""}
                          className="bg-[var(--card-bg)] border border-[var(--label-color)] text-[var(--text-color)] placeholder:text-[var(--label-color)] focus:border-[var(--accent-color)] focus:ring-[var(--accent-color)] rounded-[var(--radius)]"
                          style={{ color: "var(--text-color)" }}
                        />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => {
                const isFilled = !!field.value;
                return (
                  <FormItem>
                    {!useMaterialUI && !loginStatus.isLoading && (
                      <FormLabel className="text-[var(--label-color)]">
                        Password
                      </FormLabel>
                    )}
                    <FormControl>
                      {useMaterialUI ? (
                        <MuiFormControl fullWidth variant="outlined">
                          {!loginStatus.isLoading && (
                            <MuiInputLabel
                              id="login-password-label"
                              sx={{ color: "var(--label-color)" }}
                              shrink={isFilled ? true : undefined}
                            >
                              {!isFilled ? "Password" : ""}
                            </MuiInputLabel>
                          )}
                          <MuiTextField
                            {...field}
                            type={showPassword ? "text" : "password"}
                            labelId="login-password-label"
                            label={
                              !loginStatus.isLoading && !isFilled
                                ? "Password"
                                : ""
                            }
                            variant="outlined"
                            fullWidth
                            sx={{
                              background: "var(--card-bg)",
                              color: "var(--text-color)",
                              borderRadius: "var(--radius)",
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
                              "& .MuiInputBase-input": {
                                color: "var(--text-color)",
                              },
                            }}
                            InputProps={{
                              style: { color: "var(--text-color)" },
                              endAdornment: (
                                <button
                                  type="button"
                                  tabIndex={-1}
                                  onClick={() => setShowPassword((v) => !v)}
                                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--label-color)] hover:text-[var(--accent-color)] focus:outline-none"
                                  aria-label={
                                    showPassword
                                      ? "Hide password"
                                      : "Show password"
                                  }
                                >
                                  {showPassword ? (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="20"
                                      height="20"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5.05 0-9.29-3.14-11-8 1.21-3.06 3.62-5.5 6.58-6.47" />
                                      <path d="M1 1l22 22" />
                                      <path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c.98 0 1.87-.39 2.53-1.03" />
                                      <path d="M14.47 14.47A3.5 3.5 0 0 0 12 8.5c-.98 0-1.87.39-2.53 1.03" />
                                    </svg>
                                  ) : (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="20"
                                      height="20"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                      <circle cx="12" cy="12" r="3" />
                                    </svg>
                                  )}
                                </button>
                              ),
                            }}
                          />
                        </MuiFormControl>
                      ) : (
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            {...field}
                            placeholder={!field.value ? "Password" : ""}
                            className="bg-[var(--card-bg)] border border-[var(--label-color)] text-[var(--text-color)] placeholder:text-[var(--label-color)] pr-10 focus:border-[var(--accent-color)] focus:ring-[var(--accent-color)] rounded-[var(--radius)]"
                            style={{ color: "var(--text-color)" }}
                          />
                          <button
                            type="button"
                            tabIndex={-1}
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--label-color)] hover:text-[var(--accent-color)] focus:outline-none"
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            {showPassword ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M17.94 17.94A10.06 10.06 0 0 1 12 20c-5.05 0-9.29-3.14-11-8 1.21-3.06 3.62-5.5 6.58-6.47" />
                                <path d="M1 1l22 22" />
                                <path d="M9.53 9.53A3.5 3.5 0 0 0 12 15.5c.98 0 1.87-.39 2.53-1.03" />
                                <path d="M14.47 14.47A3.5 3.5 0 0 0 12 8.5c-.98 0-1.87.39-2.53 1.03" />
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            {useMaterialUI ? (
              <MuiButton
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  background: "var(--accent-color)",
                  color: "var(--bg-color)",
                  borderRadius: "var(--radius)",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  "&:hover": {
                    background: "var(--primary-color)",
                    color: "var(--accent-color)",
                  },
                }}
                disabled={loginStatus.isLoading}
              >
                {loginStatus.isLoading ? "Signing in..." : "Sign in"}
              </MuiButton>
            ) : (
              <Button
                type="submit"
                variant="outline"
                className="w-full bg-[var(--accent-color)] text-[var(--bg-color)] border-none hover:bg-[var(--primary-color)] hover:text-[var(--accent-color)]"
                disabled={loginStatus.isLoading}
              >
                {loginStatus.isLoading ? "Signing in..." : "Sign in"}
              </Button>
            )}
          </form>
        </Form>
        {/* Guest Demo Button */}
        <div className="absolute top-0 right-0 mt-4 mr-4 z-10">
          <button
            type="button"
            className="px-4 py-2 rounded-[var(--radius)] font-bold shadow-lg bg-[var(--accent-color)] text-[var(--bg-color)] hover:bg-[var(--primary-color)] hover:text-[var(--accent-color)] border border-[var(--accent-color)] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--primary-color)] text-base"
            style={{ minWidth: 180 }}
            onClick={() => {
              setIsGuest(true);
              onLoginSuccess(getMockW(), { guest: true });
            }}
            aria-label="Try Guest Demo"
          >
            <span role="img" aria-label="party"></span> Guest Demo
          </button>
        </div>
      </div>
    </div>
  );
}
