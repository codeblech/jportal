import React, { useState, useEffect } from "react";
import AttendanceCard from "./AttendanceCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"

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
  setIsAttendanceDataLoading
}) => {
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
          latest_semester: latestSem
        });

        try {
          const data = await w.get_attendance(header, latestSem);
          setAttendanceData(prev => ({
            ...prev,
            [latestSem.registration_id]: data
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
              setAttendanceData(prev => ({
                ...prev,
                [previousSem.registration_id]: data
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
    const semester = semestersData.semesters.find(sem => sem.registration_id === value);
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
      setAttendanceData(prev => ({
        ...prev,
        [value]: data
      }));
    } catch (error) {
      if (error.message.includes("NO Attendance Found")) {
        // Show message that attendance is not available for this semester
        setAttendanceData(prev => ({
          ...prev,
          [value]: { error: "Attendance not available for this semester" }
        }));
      } else {
        console.error("Failed to fetch attendance:", error);
      }
    } finally {
      setIsAttendanceDataLoading(false);
    }
  };

  const handleGoalChange = (e) => {
    const value = e.target.value === '' ? '' : parseInt(e.target.value);
    if (value === '' || (!isNaN(value) && value > 0 && value <= 100)) {
      setAttendanceGoal(value);
    }
  };

  const subjects = selectedSem && attendanceData[selectedSem.registration_id]?.studentattendancelist?.map((item) => {
    const { subjectcode, Ltotalclass, Ltotalpres, Lpercentage, Ttotalclass, Ttotalpres, Tpercentage, Ptotalclass, Ptotalpres, Ppercentage, LTpercantage } = item;

    const { attended, total } = {
      attended: (Ltotalpres || 0) + (Ttotalpres || 0) + (Ptotalpres || 0),
      total: (Ltotalclass || 0) + (Ttotalclass || 0) + (Ptotalclass || 0)
    };

    const currentPercentage = (attended / total) * 100;
    const classesNeeded = attendanceGoal ? Math.ceil((attendanceGoal * total - 100 * attended) / (100 - attendanceGoal)) : null;
    const classesCanMiss = attendanceGoal ? Math.floor((100 * attended - attendanceGoal * total) / attendanceGoal) : null;

    return {
      name: subjectcode,
      attendance: {
        attended,
        total
      },
      combined: LTpercantage,
      lecture: Lpercentage,
      tutorial: Tpercentage,
      practical: Ppercentage,
      classesNeeded: classesNeeded > 0 ? classesNeeded : 0,
      classesCanMiss: classesCanMiss > 0 ? classesCanMiss : 0
    };
  }) || [];

  const fetchSubjectAttendance = async (subject) => {
    try {
      const attendance = attendanceData[selectedSem.registration_id];
      const subjectData = attendance.studentattendancelist.find(
        s => s.subjectcode === subject.name
      );

      if (!subjectData) return;

      const subjectcomponentids = ['Lsubjectcomponentid', 'Psubjectcomponentid', 'Tsubjectcomponentid']
        .filter(id => subjectData[id])
        .map(id => subjectData[id]);

      const data = await w.get_subject_daily_attendance(
        selectedSem,
        subjectData.subjectid,
        subjectData.individualsubjectcode,
        subjectcomponentids
      );

      setSubjectAttendanceData(prev => ({
        ...prev,
        [subject.name]: data.studentAttdsummarylist
      }));
    } catch (error) {
      console.error("Failed to fetch subject attendance:", error);
    }
  };

  return (
    <div className="text-white dark:text-black font-sans">
      <div className="sticky top-14 bg-[#191c20] dark:bg-white z-20">
        <div className="flex gap-2 py-2 px-3">
          <Select
            onValueChange={handleSemesterChange}
            value={selectedSem?.registration_id}
          >
            <SelectTrigger className="bg-[#191c20] dark:bg-[#f9f9f9] text-white dark:text-black border-white dark:border-black">
              <SelectValue placeholder={isAttendanceMetaLoading ? "Loading semesters..." : "Select semester"}>
                {selectedSem?.registration_code}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-[#191c20] dark:bg-[#f9f9f9] text-white dark:text-black border-white dark:border-black">
              {semestersData?.semesters?.map((sem) => (
                <SelectItem key={sem.registration_id} value={sem.registration_id}>
                  {sem.registration_code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            value={attendanceGoal}
            onChange={handleGoalChange}
            min="-1"
            max="100"
            className="w-32 bg-[#191c20] dark:bg-[#f9f9f9] text-white dark:text-black border-white dark:border-black"
            placeholder="Goal %"
          />
        </div>
      </div>

      <div className="px-3 pb-4">
        {isAttendanceMetaLoading || isAttendanceDataLoading ? (
          <div className="flex items-center justify-center py-4 h-[calc(100vh-<header_height>-<navbar_height>)]">
            Loading attendance...
          </div>
        ) : selectedSem && attendanceData[selectedSem.registration_id]?.error ? (
          <div className="flex items-center justify-center py-4">
            {attendanceData[selectedSem.registration_id].error}
          </div>
        ) : (
          subjects.map((subject) => (
            <AttendanceCard
              key={subject.name}
              subject={subject}
              selectedSubject={selectedSubject}
              setSelectedSubject={setSelectedSubject}
              subjectAttendanceData={subjectAttendanceData}
              fetchSubjectAttendance={fetchSubjectAttendance}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Attendance;
