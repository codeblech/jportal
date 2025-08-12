import { useEffect, useState } from "react";
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
  FormControl,
  InputLabel,
} from "@mui/material";

export default function Exams({
  w,
  examSchedule,
  setExamSchedule,
  examSemesters,
  setExamSemesters,
  selectedExamSem,
  setSelectedExamSem,
  selectedExamEvent,
  setSelectedExamEvent,
}) {
  const [examEvents, setExamEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const { useMaterialUI } = useTheme();

  useEffect(() => {
    // Fetch semesters on component mount
    const fetchSemesters = async () => {
      if (examSemesters.length === 0) {
        const examSems = await w.get_semesters_for_exam_events();
        setExamSemesters(examSems);
      }
    };
    fetchSemesters();
  }, []);

  // Fetch exam events when semester is selected
  const handleSemesterChange = async (value) => {
    setLoading(true);
    try {
      const semester = examSemesters.find(
        (sem) => sem.registration_id === value
      );
      setSelectedExamSem(semester);
      const events = await w.get_exam_events(semester);
      setExamEvents(events);
      setSelectedExamEvent(null);
      setExamSchedule({}); // Clear the exam schedule when changing semester
    } finally {
      setLoading(false);
    }
  };

  // Fetch exam schedule when event is selected
  const handleEventChange = async (value) => {
    setLoading(true);
    try {
      const event = examEvents.find((evt) => evt.exam_event_id === value);
      setSelectedExamEvent(event);

      if (!examSchedule[value]) {
        const response = await w.get_exam_schedule(event);
        setExamSchedule((prev) => ({
          ...prev,
          [value]: response.subjectinfo,
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const currentSchedule =
    selectedExamEvent && examSchedule[selectedExamEvent.exam_event_id];

  // Format date string to a more readable format
  const formatDate = (dateStr) => {
    const [day, month, year] = dateStr.split("/");
    return new Date(`${month}/${day}/${year}`).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading && !examSemesters.length) {
    return <Loader message="Loading exams..." />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto min-h-screen bg-[var(--bg-color)] text-[var(--text-color)] font-sans px-2 pb-32 pt-2">
      <div className="bg-[var(--bg-color)] z-20">
        <div className="pb-4 px-3">
          {useMaterialUI ? (
            <FormControl fullWidth variant="outlined">
              <InputLabel
                id="exam-semester-label"
                sx={{ color: "var(--label-color)" }}
                shrink={true}
              >
                Semester
              </InputLabel>
              <MuiSelect
                labelId="exam-semester-label"
                label="Semester"
                value={selectedExamSem?.registration_id || ""}
                onChange={(e) => handleSemesterChange(e.target.value)}
                displayEmpty
                variant="outlined"
                fullWidth
                renderValue={(selected) =>
                  selected
                    ? examSemesters.find(
                        (sem) => sem.registration_id === selected
                      )?.registration_code
                    : "Select semester"
                }
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
                {examSemesters.map((sem) => (
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
              value={selectedExamSem?.registration_id || ""}
            >
              <SelectTrigger className="bg-[var(--card-bg)] text-[var(--text-color)] border border-[var(--border-color)] rounded-[var(--radius)] px-4 py-2 shadow-md">
                <SelectValue placeholder="Select semester">
                  {selectedExamSem?.registration_code || "Select semester"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[var(--card-bg)] text-[var(--text-color)] border-[var(--border-color)] rounded-[var(--radius)] shadow-lg">
                {examSemesters.map((sem) => (
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

          {/* Only show Exam Event select if a semester is selected */}
          {selectedExamSem && (
            <div className="mt-2">
              {useMaterialUI ? (
                <FormControl fullWidth variant="outlined">
                  <InputLabel
                    id="exam-event-label"
                    sx={{ color: "var(--label-color)" }}
                    shrink={true}
                  >
                    Exam Event
                  </InputLabel>
                  <MuiSelect
                    labelId="exam-event-label"
                    label="Exam Event"
                    value={selectedExamEvent?.exam_event_id || ""}
                    onChange={(e) => handleEventChange(e.target.value)}
                    displayEmpty
                    variant="outlined"
                    fullWidth
                    renderValue={(selected) =>
                      selected
                        ? examEvents.find(
                            (evt) => evt.exam_event_id === selected
                          )?.exam_event_desc
                        : "Select exam event"
                    }
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
                      Select exam event
                    </MuiMenuItem>
                    {examEvents.map((event) => (
                      <MuiMenuItem
                        key={event.exam_event_id}
                        value={event.exam_event_id}
                      >
                        {event.exam_event_desc}
                      </MuiMenuItem>
                    ))}
                  </MuiSelect>
                </FormControl>
              ) : (
                <Select
                  onValueChange={handleEventChange}
                  value={selectedExamEvent?.exam_event_id || ""}
                >
                  <SelectTrigger className="bg-[var(--card-bg)] text-[var(--text-color)] border border-[var(--border-color)] rounded-[var(--radius)] px-4 py-2 shadow-md">
                    <SelectValue placeholder="Select exam event">
                      {selectedExamEvent?.exam_event_desc ||
                        "Select exam event"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--card-bg)] text-[var(--text-color)] border-[var(--border-color)] rounded-[var(--radius)] shadow-lg">
                    {examEvents.map((event) => (
                      <SelectItem
                        key={event.exam_event_id}
                        value={event.exam_event_id}
                      >
                        {event.exam_event_desc}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-3 pb-4">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            Loading...
          </div>
        ) : currentSchedule?.length > 0 ? (
          <div className="space-y-2">
            {currentSchedule.map((exam) => (
              <div
                key={`${exam.subjectcode}-${exam.datetime}-${exam.datetimefrom}`}
                className="w-full max-w-2xl mx-auto bg-[var(--card-bg)] rounded-[var(--radius)] shadow-sm px-6 py-5 flex flex-col gap-2 mb-2"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-light truncate mb-1 text-[var(--text-color)]">
                      {exam.subjectdesc.split("(")[0].trim()}
                    </h3>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-normal text-[var(--label-color)]">
                        {exam.subjectcode}
                      </span>
                    </div>
                  </div>
                  {(exam.roomcode || exam.seatno) && (
                    <div className="flex flex-col items-center justify-center min-w-[48px]">
                      <div className="text-2xl font-mono font-bold text-[var(--accent-color)] leading-none">
                        {exam.roomcode && exam.seatno
                          ? `${exam.roomcode}-${exam.seatno}`
                          : exam.roomcode || exam.seatno}
                      </div>
                      <div className="text-xs text-[var(--label-color)] font-light mt-1">
                        Room/Seat
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex flex-row gap-6 mt-2 text-sm text-[var(--label-color)]">
                  <div>{formatDate(exam.datetime)}</div>
                  <div>{exam.datetimeupto}</div>
                </div>
              </div>
            ))}
          </div>
        ) : selectedExamEvent ? (
          <div className="flex items-center justify-center py-4">
            No exam schedule available
          </div>
        ) : null}
      </div>
    </div>
  );
}
