import React, { useState, useEffect } from "react";
import SubjectInfoCard from "./SubjectInfoCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Loader from "./Loader";
import { useTheme } from "./ThemeProvider";
import {
  Select as MuiSelect,
  MenuItem as MuiMenuItem,
  Button as MuiButton,
  FormControl,
  InputLabel,
} from "@mui/material";

export default function Subjects({
  w,
  subjectData,
  setSubjectData,
  semestersData,
  setSemestersData,
  selectedSem,
  setSelectedSem,
}) {
  const [loading, setLoading] = useState(!semestersData);
  const [subjectsLoading, setSubjectsLoading] = useState(!subjectData);
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

  useEffect(() => {
    const fetchSemesters = async () => {
      if (semestersData) {
        if (semestersData.semesters.length > 0 && !selectedSem) {
          setSelectedSem(semestersData.latest_semester);

          if (!subjectData?.[semestersData.latest_semester.registration_id]) {
            const data = await w.get_registered_subjects_and_faculties(
              semestersData.latest_semester
            );
            setSubjectData((prev) => ({
              ...prev,
              [semestersData.latest_semester.registration_id]: data,
            }));
          }
        }
        return;
      }

      setLoading(true);
      setSubjectsLoading(true);
      try {
        const registeredSems = await w.get_registered_semesters();
        const latestSem = registeredSems[0];

        setSemestersData({
          semesters: registeredSems,
          latest_semester: latestSem,
        });

        setSelectedSem(latestSem);

        if (!subjectData?.[latestSem.registration_id]) {
          const data = await w.get_registered_subjects_and_faculties(latestSem);
          setSubjectData((prev) => ({
            ...prev,
            [latestSem.registration_id]: data,
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setSubjectsLoading(false);
      }
    };

    fetchSemesters();
  }, [w, setSubjectData, semestersData, setSemestersData]);

  const handleSemesterChange = async (value) => {
    setSubjectsLoading(true);
    try {
      const semester = semestersData?.semesters?.find(
        (sem) => sem.registration_id === value
      );
      setSelectedSem(semester);

      if (subjectData?.[semester.registration_id]) {
        setSubjectsLoading(false);
        return;
      }

      const data = await w.get_registered_subjects_and_faculties(semester);
      setSubjectData((prev) => ({
        ...prev,
        [semester.registration_id]: data,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const currentSubjects =
    selectedSem && subjectData?.[selectedSem.registration_id];
  const groupedSubjects =
    currentSubjects?.subjects?.reduce((acc, subject) => {
      const baseCode = subject.subject_code;
      if (!acc[baseCode]) {
        acc[baseCode] = {
          name: subject.subject_desc,
          code: baseCode,
          credits: subject.credits,
          components: [],
          isAudit: subject.audtsubject === "Y",
        };
      }
      acc[baseCode].components.push({
        type: subject.subject_component_code,
        teacher: subject.employee_name,
      });
      return acc;
    }, {}) || {};

  if (loading) {
    return <Loader message="Loading subjects..." />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] font-sans px-2 pb-32">
      <div className="w-full max-w-2xl mx-auto flex justify-center mb-2">
        <div className="py-2 px-3 w-full">
          {useMaterialUI ? (
            <FormControl
              fullWidth
              variant="outlined"
              sx={{ maxWidth: 600, margin: "0 auto" }}
            >
              <InputLabel
                id="subjects-semester-label"
                sx={{ color: "var(--label-color)" }}
              >
                Semester
              </InputLabel>
              <MuiSelect
                labelId="subjects-semester-label"
                label="Semester"
                value={selectedSem?.registration_id || ""}
                onChange={(e) => handleSemesterChange(e.target.value)}
                displayEmpty
                variant="outlined"
                fullWidth
                sx={{
                  minWidth: 120,
                  maxWidth: 600,
                  background: "var(--card-bg)",
                  color: "var(--text-color)",
                  borderRadius: "var(--radius)",
                  fontSize: "1.1rem",
                  fontWeight: 300,
                  margin: "0 auto",
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
                  {loading ? "Loading semesters..." : "Select semester"}
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
              disabled={loading}
            >
              <SelectTrigger className="bg-[var(--card-bg)] text-[var(--text-color)] border border-[var(--border-color)] rounded-xl px-4 py-2 shadow-md w-full h-[44px] max-w-2xl mx-auto">
                <SelectValue
                  placeholder={
                    loading ? "Loading semesters..." : "Select semester"
                  }
                >
                  {selectedSem?.registration_code}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[var(--card-bg)] text-[var(--text-color)] border-[var(--border-color)] rounded-xl shadow-lg w-full max-w-2xl mx-auto">
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
        </div>
      </div>

      <div className="px-3 pb-4">
        <div
          className={`w-full max-w-2xl mx-auto ${
            useCardBackgrounds
              ? "bg-[var(--card-bg)] rounded-2xl shadow-sm"
              : ""
          } px-6 py-4 flex items-center justify-between mb-4`}
        >
          <span className="text-lg font-semibold text-[var(--label-color)]">
            Total Credits
          </span>
          <span className="text-2xl font-bold text-[var(--accent-color)]">
            {currentSubjects?.total_credits || 0}
          </span>
        </div>

        {subjectsLoading ? (
          <div className="flex items-center justify-center py-4 h-[calc(100vh-200px)]">
            Loading subjects...
          </div>
        ) : (
          <div className={useCardBackgrounds ? "lg:space-y-4" : "lg:space-y-1"}>
            {Object.values(groupedSubjects).map((subject, idx, arr) => (
              <React.Fragment key={subject.code}>
                <SubjectInfoCard
                  subject={subject}
                  useCardBackgrounds={useCardBackgrounds}
                />
                {!useCardBackgrounds && idx < arr.length - 1 && (
                  <div
                    className="w-full max-w-2xl mx-auto"
                    style={{
                      borderBottom: `1px solid ${accentSeparator}66`,
                      margin: "2px 0",
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
