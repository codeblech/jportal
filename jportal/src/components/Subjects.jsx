import React, { useEffect } from "react";
import SubjectInfoCard from "./SubjectInfoCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function Subjects({
  w,
  subjectData,
  setSubjectData,
  semestersData,
  setSemestersData,
  selectedSem,
  setSelectedSem,
  subjectChoices,
  setSubjectChoices,
  activeTab,
  setActiveTab,
  loading,
  setLoading,
  subjectsLoading,
  setSubjectsLoading,
  choicesLoading,
  setChoicesLoading
}) {
  const displayedSemesters = activeTab === "choices"
    ? semestersData?.choice_semesters
    : semestersData?.registered_semesters || semestersData?.semesters;

  useEffect(() => {
    let cancelled = false;

    const fetchSubjectsForTab = async () => {
      const isChoicesTab = activeTab === "choices";

      try {
        let semesterList = isChoicesTab
          ? semestersData?.choice_semesters
          : semestersData?.registered_semesters || semestersData?.semesters;

        if (!semesterList) {
          setLoading(true);
          semesterList = isChoicesTab && w.get_semesters_for_grade_card
            ? await w.get_semesters_for_grade_card()
            : await w.get_registered_semesters();

          if (cancelled) return;

          setSemestersData(prev => ({
            ...prev,
            semesters: prev?.semesters || (!isChoicesTab ? semesterList : undefined),
            latest_semester: prev?.latest_semester || (!isChoicesTab ? semesterList[0] : undefined),
            registered_semesters: !isChoicesTab ? semesterList : prev?.registered_semesters,
            latest_registered_semester: !isChoicesTab ? semesterList[0] : prev?.latest_registered_semester,
            choice_semesters: isChoicesTab ? semesterList : prev?.choice_semesters,
            latest_choice_semester: isChoicesTab ? semesterList[0] : prev?.latest_choice_semester,
          }));
        }

        const selectedInTab = semesterList?.find(sem => sem.registration_id === selectedSem?.registration_id);
        const semester = selectedInTab || semesterList?.[0];

        if (!semester) return;

        if (!selectedInTab) {
          setSelectedSem(semester);
        }

        if (isChoicesTab) {
          if (!subjectChoices?.[semester.registration_id]) {
            setChoicesLoading(true);
            const choicesData = await w.get_subject_choices(semester);
            if (cancelled) return;
            setSubjectChoices(prev => ({
              ...prev,
              [semester.registration_id]: choicesData
            }));
          }
        } else if (!subjectData?.[semester.registration_id]) {
          setSubjectsLoading(true);
          const data = await w.get_registered_subjects_and_faculties(semester);
          if (cancelled) return;
          setSubjectData(prev => ({
            ...prev,
            [semester.registration_id]: data
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setSubjectsLoading(false);
          setChoicesLoading(false);
        }
      }
    };

    fetchSubjectsForTab();

    return () => {
      cancelled = true;
    };
  }, [
    w,
    activeTab,
    semestersData,
    selectedSem,
    subjectData,
    subjectChoices,
    setLoading,
    setSubjectsLoading,
    setChoicesLoading,
    setSelectedSem,
    setSemestersData,
    setSubjectData,
    setSubjectChoices,
  ]);

  const handleSemesterChange = async (value) => {
    const isChoicesTab = activeTab === "choices";

    if (isChoicesTab) {
      setChoicesLoading(true);
    } else {
      setSubjectsLoading(true);
    }

    try {
      const semester = displayedSemesters?.find(sem => sem.registration_id === value);

      if (!semester) return;

      setSelectedSem(semester);

      if (isChoicesTab) {
        if (!subjectChoices?.[semester.registration_id]) {
          try {
            const choicesData = await w.get_subject_choices(semester);
            setSubjectChoices(prev => ({
              ...prev,
              [semester.registration_id]: choicesData
            }));
          } catch (err) {
            console.error("Error fetching subject choices:", err);
          }
        }
        return;
      }

      if (!subjectData?.[semester.registration_id]) {
        const data = await w.get_registered_subjects_and_faculties(semester);
        setSubjectData(prev => ({
          ...prev,
          [semester.registration_id]: data
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubjectsLoading(false);
      setChoicesLoading(false);
    }
  };

  const currentSubjects = selectedSem && subjectData?.[selectedSem.registration_id];
  const currentChoices = selectedSem && subjectChoices?.[selectedSem.registration_id];
  const groupedSubjects = currentSubjects?.subjects?.reduce((acc, subject) => {
    const baseCode = subject.subject_code;
    if (!acc[baseCode]) {
      acc[baseCode] = {
        name: subject.subject_desc,
        code: baseCode,
        credits: subject.credits,
        components: [],
        isAudit: subject.audtsubject === "Y"
      };
    }
    acc[baseCode].components.push({
      type: subject.subject_component_code,
      teacher: subject.employee_name
    });
    return acc;
  }, {}) || {};

  return (
    <div className="text-foreground font-sans max-w-7xl mx-auto">
      <div className="sticky top-[var(--header-height)] bg-background/95 backdrop-blur-sm z-20">
        <div className="py-2 px-3">
          <Select onValueChange={handleSemesterChange} value={selectedSem?.registration_id} disabled={loading}>
            <SelectTrigger className="bg-background text-foreground border-foreground cursor-pointer hover:bg-accent hover:text-accent-foreground">
              <SelectValue placeholder={loading ? "Loading..." : "Select semester"}>
                {selectedSem?.registration_code}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-background text-foreground border-foreground">
              {displayedSemesters?.map((sem) => (
                <SelectItem key={sem.registration_id} value={sem.registration_id}>
                  {sem.registration_code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="px-3 pb-4">
        <TabsList className="grid grid-cols-2 bg-background gap-3">
          <TabsTrigger
            value="registered"
            className="cursor-pointer text-muted-foreground bg-background data-[state=active]:bg-muted data-[state=active]:text-foreground"
          >
            Registered
          </TabsTrigger>
          <TabsTrigger
            value="choices"
            className="cursor-pointer text-muted-foreground bg-background data-[state=active]:bg-muted data-[state=active]:text-foreground"
          >
            Choices
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registered">
          <div className="flex items-center justify-end mt-3 mb-2">
            <div className="text-sm font-medium tabular-nums bg-accent/5 text-primary px-3 py-1 rounded-md border border-border">
              <span className="text-muted-foreground mr-2">Total Credits</span>
              <span>{currentSubjects?.total_credits || 0}</span>
            </div>
          </div>
          {subjectsLoading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Loading subjects...
            </div>
          ) : Object.keys(groupedSubjects).length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              No subjects found for this semester
            </div>
          ) : (
            <div className="mt-4 space-y-4 pb-4">
              {Object.values(groupedSubjects).map((subject) => (
                <SubjectInfoCard key={subject.code} subject={subject} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="choices">
            {choicesLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                Loading subject choices...
              </div>
            ) : currentChoices?.subjectpreferencegrid?.length > 0 ? (
              <div className="mt-4 space-y-6 pb-4">
                {/* Group subjects by basket */}
                {Object.entries(
                  currentChoices.subjectpreferencegrid.reduce((acc, subject) => {
                    const basket = subject.basketcode;
                    if (!acc[basket]) {
                      acc[basket] = {
                        name: subject.basketdesc,
                        code: basket,
                        subjects: []
                      };
                    }
                    acc[basket].subjects.push(subject);
                    return acc;
                  }, {})
                ).map(([basketCode, basket]) => (
                  <div key={basketCode} className="border border-border rounded-lg p-4 shadow-lg">
                    <h3 className="text-sm font-semibold text-foreground mb-4">
                      {basket.name}
                    </h3>

                    <div className="space-y-3">
                      {basket.subjects
                        .sort((a, b) => a.preference - b.preference)
                        .map((subject) => {
                          const showNumbering = basket.code !== "CORE" && basket.code !== "CORE-AUDIT";
                          return (
                            <div
                              key={subject.subjectid}
                              className={`flex items-start gap-3 p-3 rounded-lg border ${
                                subject.running === "Y"
                                  ? "border-accent bg-accent/5"
                                  : "border-border bg-background"
                              }`}
                            >
                              {showNumbering && (
                                <div
                                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                    subject.running === "Y"
                                      ? "bg-accent text-accent-foreground"
                                      : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {subject.preference}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-sm text-foreground">
                                      {subject.subjectdesc}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {subject.subjectcode} • {subject.credits} Credits
                                    </p>
                                  </div>
                                  {subject.running === "Y" && (
                                    <span className="flex-shrink-0 text-xs font-semibold px-2 py-1 rounded-full bg-accent text-accent-foreground">
                                      Allotted
                                    </span>
                                  )}
                                </div>
                                {subject.electivetype === "Y" && (
                                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                    <span className="px-2 py-0.5 rounded bg-muted">
                                      {subject.subjecttypedesc}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                No subject choices available for this semester
              </div>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
