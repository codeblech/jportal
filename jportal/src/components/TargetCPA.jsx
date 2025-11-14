import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calculator, Loader2 } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatDecimal, getGpaDecimal } from "../lib/utils"

export default function CGPATargetCalculator({ 
  w,
  semesterData: sd = [],
  guest = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("sgpa");
  
  const [subjectSemesters, setSubjectSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [subjectData, setSubjectData] = useState({});
  const [semesterCreditsMap, setSemesterCreditsMap] = useState({});
  const [isLoadingSemesters, setIsLoadingSemesters] = useState(false);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);

  // Target GPA states
  const [targetCGPA, setTargetCGPA] = useState("");
  const [targetSemester, setTargetSemester] = useState(null);
  const [requiredSGPA, setRequiredSGPA] = useState(null);
  const [targetError, setTargetError] = useState("");

  const formatGPA = (value) => formatDecimal(value, getGpaDecimal());
  
  const [sgpaSubjects, setSgpaSubjects] = useState([]);

  useEffect(() => {
    if (!selectedSemester) return;
    const semesterId = selectedSemester.registration_id;
    if (!semesterId) return;
    if (subjectData[semesterId]) return;
    if (guest || w) {
      fetchSubjectsForSemester(selectedSemester, { updateSgpaSubjects: true });
    }
  }, [selectedSemester, subjectData, guest, w]);

  useEffect(() => {
    if (!isOpen || subjectSemesters.length > 0) return;
    if (guest || w) {
      fetchSubjectSemesters();
    }
  }, [isOpen, subjectSemesters.length, guest, w]);

  const fetchSubjectSemesters = async () => {
    setIsLoadingSemesters(true);
    try {
      let semesters = [];
      semesters = await w.get_registered_semesters();

      semesters = Array.isArray(semesters) ? semesters : [];
      setSubjectSemesters(semesters);

      if (semesters && semesters.length > 0) {
        const defaultSemester = semesters[0];
        setSelectedSemester(prev => prev || defaultSemester);
        setTargetSemester(prev => prev || defaultSemester);
      } else {
        setSelectedSemester(null);
        setTargetSemester(null);
      }
    } catch (error) {
      console.error('Failed to fetch semesters:', error);
    } finally {
      setIsLoadingSemesters(false);
    }
  };

  const fetchSubjectsForSemester = async (semester, { updateSgpaSubjects = true } = {}) => {
    if (!semester) return;
    setIsLoadingSubjects(true);
    try {
      const semesterId = semester.registration_id;

        const subjectsResponse = await w.get_registered_subjects_and_faculties(semester);

        setSubjectData((prev) => ({
          ...prev,
          [semesterId]: subjectsResponse,
        }));

        const subjectList = Array.isArray(subjectsResponse?.subjects)
          ? subjectsResponse.subjects
          : [];

        if (subjectList.length > 0) {
          const processedSubjects = processSubjectsForSGPA(subjectList);
          const totalCredits = processedSubjects.reduce((sum, subject) => sum + (subject.credits || 0), 0);
          const derivedCredits = !isNaN(parseFloat(subjectsResponse?.total_credits))
            ? parseFloat(subjectsResponse.total_credits)
            : totalCredits;

          setSemesterCreditsMap((prev) => ({
            ...prev,
            [semesterId]: derivedCredits,
          }));

          if (updateSgpaSubjects) {
            setSgpaSubjects(processedSubjects);
          }
        } else {
          const derivedCredits = !isNaN(parseFloat(subjectsResponse?.total_credits))
            ? parseFloat(subjectsResponse.total_credits)
            : 0;

          setSemesterCreditsMap((prev) => ({
            ...prev,
            [semesterId]: derivedCredits,
          }));

          if (updateSgpaSubjects) {
            setSgpaSubjects([]);
          }
        }
    } catch (error) {
      console.error('Failed to fetch subjects:', error);
    } finally {
      setIsLoadingSubjects(false);
    }
  };

  const processSubjectsForSGPA = (subjects) => {
    const groupedSubjects = subjects.reduce((acc, subject) => {
      const baseCode = subject.subject_code;
      if (!acc[baseCode] && subject.audtsubject !== "Y") {
        acc[baseCode] = {
          name: subject.subject_desc,
          code: baseCode,
          credits: parseInt(subject.credits) || 0,
          grade: "A",
          gradePoints: 9
        };
      }
      return acc;
    }, {});
    
    return Object.values(groupedSubjects);
  };

  const gradePointMap = {
    "A+": 10, "A": 9, "B+": 8, "B": 7, "C+": 6, "C": 5, "D": 4, "F": 0
  };

  const gradeOptions = ["A+", "A", "B+", "B", "C+", "C", "D", "F"];

  const handleGradeChange = (index, grade) => {
    setSgpaSubjects(prev => prev.map((subject, i) => 
      i === index 
        ? { ...subject, grade, gradePoints: gradePointMap[grade] || 0 }
        : subject
    ));
  };

  const calculateSGPA = () => {
    let totalPoints = 0;
    let totalCredits = 0;
    
    sgpaSubjects.forEach(subject => {
      if (subject.grade && subject.credits > 0) {
        totalPoints += subject.gradePoints * subject.credits;
        totalCredits += subject.credits;
      }
    });
    
    if (totalCredits === 0) return "-";
    return formatGPA(totalPoints / totalCredits);
  };

  const handleSemesterChange = (semesterId) => {
    const semester = subjectSemesters.find(sem => sem.registration_id === semesterId);
    setSelectedSemester(semester);
    
    if (semester) {
      fetchSubjectsForSemester(semester, { updateSgpaSubjects: true });
    }
  };

  const handleTargetSemesterChange = (semesterId) => {
    const semester = subjectSemesters.find((sem) => sem.registration_id === semesterId) || null;
    setTargetSemester(semester);
    setRequiredSGPA(null);
    setTargetError("");

    if (!semester) return;

    const hasCachedCredits = Object.prototype.hasOwnProperty.call(
      semesterCreditsMap,
      semester.registration_id,
    );

    if (!hasCachedCredits) {
      fetchSubjectsForSemester(semester, { updateSgpaSubjects: false });
    }
  };

  const isSameSemester = (gradeSemester, semester) => {
    if (!gradeSemester || !semester) return false;

    if (
      gradeSemester.registration_id &&
      semester.registration_id &&
      gradeSemester.registration_id === semester.registration_id
    ) {
      return true;
    }

    if (
      gradeSemester.registration_code &&
      semester.registration_code &&
      gradeSemester.registration_code === semester.registration_code
    ) {
      return true;
    }

    if (
      gradeSemester.stynumber !== undefined &&
      semester.stynumber !== undefined &&
      String(gradeSemester.stynumber) === String(semester.stynumber)
    ) {
      return true;
    }

    if (
      gradeSemester.coursename &&
      semester.coursename &&
      gradeSemester.coursename === semester.coursename
    ) {
      return true;
    }

    return false;
  };

  const findGradeDataForSemester = (semester) => {
    if (!semester || !Array.isArray(sd)) return null;
    return sd.find((gradeSemester) => isSameSemester(gradeSemester, semester)) || null;
  };

  const getSemesterCredits = (semester) => {
    if (!semester) return 0;

    const cached = semesterCreditsMap[semester.registration_id];
    const cachedValue = parseFloat(cached);
    if (!isNaN(cachedValue) && cachedValue > 0) {
      return cachedValue;
    }

    const directCredits = parseFloat(semester.totalcoursecredit);
    if (!isNaN(directCredits) && directCredits > 0) {
      return directCredits;
    }

    const gradeData = findGradeDataForSemester(semester);
    const gradeCredits = parseFloat(gradeData?.totalcoursecredit);
    if (!isNaN(gradeCredits) && gradeCredits > 0) {
      return gradeCredits;
    }

    const storedSubjects = subjectData[semester.registration_id];
    const rawSubjects = Array.isArray(storedSubjects?.subjects)
      ? storedSubjects.subjects
      : Array.isArray(storedSubjects)
        ? storedSubjects
        : [];

    if (rawSubjects.length > 0) {
      const processedSubjects = processSubjectsForSGPA(rawSubjects);
      const derivedCredits = processedSubjects.reduce(
        (sum, subject) => sum + (subject.credits || 0),
        0,
      );
      return derivedCredits;
    }

    const fallbackCredits = parseFloat(storedSubjects?.total_credits);
    if (!isNaN(fallbackCredits) && fallbackCredits > 0) {
      return fallbackCredits;
    }

    return 0;
  };

  const calculateProjectedCGPA = () => {
    const currentSgpa = parseFloat(calculateSGPA());
    if (isNaN(currentSgpa) || currentSgpa === 0) return "-";
    
    let currentCredits = 0;
    sgpaSubjects.forEach(subject => {
      if (subject.credits > 0) {
        currentCredits += subject.credits;
      }
    });
    
    if (currentCredits === 0) return "-";
    
    let previousGradePoints = 0;
    let previousCredits = 0;
    
    if (sd && Array.isArray(sd)) {
      sd.forEach(sem => {
        const sgpa = parseFloat(sem.sgpa);
        const credits = parseFloat(sem.totalcoursecredit);
        if (!isNaN(sgpa) && !isNaN(credits)) {
          previousGradePoints += sgpa * credits;
          previousCredits += credits;
        }
      });
    }
    
    const totalGradePoints = previousGradePoints + (currentSgpa * currentCredits);
    const totalCredits = previousCredits + currentCredits;
    
    if (totalCredits === 0) return "-";
    return formatGPA(totalGradePoints / totalCredits);
  };

  const calculateRequiredSGPA = () => {
    setTargetError("");
    setRequiredSGPA(null);
    
    if (!targetCGPA || isNaN(targetCGPA)) {
      setTargetError("Please enter a valid target CGPA");
      return;
    }
    
    const target = parseFloat(targetCGPA);
    if (target < 0 || target > 10) {
      setTargetError("Target CGPA must be between 0 and 10");
      return;
    }
    
    if (!targetSemester) {
      setTargetError("Please select a semester");
      return;
    }
    
    const currentSemCredits = getSemesterCredits(targetSemester);

    if (!currentSemCredits || currentSemCredits <= 0) {
      setTargetError("Unable to determine credits for the selected semester. Try loading it once in the SGPA tab.");
      return;
    }
    
    // Calculate previous semesters totals
    let previousGradePoints = 0;
    let previousCredits = 0;
    
    if (Array.isArray(sd) && sd.length > 0) {
      sd.forEach((sem) => {
        const sgpa = parseFloat(sem.sgpa);
        const credits = parseFloat(sem.totalcoursecredit);
        if (!isNaN(sgpa) && !isNaN(credits)) {
          previousGradePoints += sgpa * credits;
          previousCredits += credits;
        }
      });
    }
    
    // Required SGPA = (targetCGPA * (totalCredits + currentCredits) - previousGradePoints) / currentCredits
    const totalCreditsAfter = previousCredits + currentSemCredits;
    const required = (target * totalCreditsAfter - previousGradePoints) / currentSemCredits;
    
    setRequiredSGPA(required);
  };

  return (
    <>
      <Button
        variant="secondary"
        className="flex items-center gap-3 text-popover-foreground hover:text-accent-foreground border-border bg-background hover:bg-accent px-6 py-3 rounded-lg shadow-md cursor-pointer"
        onClick={() => setIsOpen(true)}
        aria-label="Open GPA Calculator"
      >
        <Calculator className="h-4 w-4 mr-1 sm:h-6 sm:w-6 sm:mr-2" />
        <span className="hidden sm:inline">GPA Calculator</span>
        <span className="sm:hidden">Calculator</span>
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl w-full rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            GPA Calculator
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full bg-muted/50 p-1 rounded-lg h-auto">
            <TabsTrigger 
              value="sgpa" 
              className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm py-2"
            >
              SGPA
            </TabsTrigger>
            <TabsTrigger 
              value="target"
              className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm py-2"
            >
              Target GPA
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sgpa" className="space-y-4 py-4">
            <div className="space-y-3">
              <Select onValueChange={handleSemesterChange} value={selectedSemester?.registration_id || ""}>
                <SelectTrigger className="rounded-lg">
                  <SelectValue placeholder={isLoadingSemesters ? "Loading..." : "Choose semester"} />
                </SelectTrigger>
                <SelectContent>
                  {subjectSemesters.map((semester) => (
                    <SelectItem
                      key={semester.registration_id}
                      value={semester.registration_id}
                    >
                      {semester.registration_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {isLoadingSemesters && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading semesters...</span>
                </div>
              )}
            </div>

            {selectedSemester && (
              <>
                {isLoadingSubjects ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading subjects...</span>
                  </div>
                ) : sgpaSubjects.length > 0 ? (
                  <>
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {sgpaSubjects.map((subject, index) => (
                        <div key={index} className="bg-muted rounded-lg p-2 sm:p-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs sm:text-sm font-medium truncate">
                              {subject.name}
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 text-xs text-muted-foreground flex-wrap">
                              <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-primary/10 rounded text-xs">{subject.code}</span>
                              <span className="whitespace-nowrap">{subject.credits} credits</span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 w-full sm:w-24">
                            <label className="text-xs text-muted-foreground block mb-1 sm:hidden">Grade</label>
                            <Select 
                              value={subject.grade} 
                              onValueChange={(grade) => handleGradeChange(index, grade)}
                            >
                              <SelectTrigger className="h-8 sm:h-10 text-xs sm:text-sm rounded-lg">
                                <SelectValue placeholder="Grade" />
                              </SelectTrigger>
                              <SelectContent>
                                {gradeOptions.map(grade => (
                                  <SelectItem key={grade} value={grade}>
                                    {grade}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2 mt-3 sm:space-y-3 sm:mt-4">
                      <div className="bg-muted rounded-lg p-2 sm:p-4 flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground font-medium truncate">Calculated SGPA</span>
                        <span className="text-lg sm:text-2xl font-bold text-primary flex-shrink-0">
                          {calculateSGPA()}
                        </span>
                      </div>
                      <div className="bg-muted rounded-lg p-2 sm:p-4 flex items-center justify-between gap-2">
                        <span className="text-xs sm:text-sm text-muted-foreground font-medium truncate">Projected CGPA</span>
                        <span className="text-lg sm:text-2xl font-bold text-primary flex-shrink-0">
                          {calculateProjectedCGPA()}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      No subjects found for this semester
                    </p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="target" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Enter your desired final CGPA, and we'll calculate the SGPA you need to achieve in the selected semester.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Select Semester
                    </label>
                    <Select
                      value={targetSemester?.registration_id || ""}
                      onValueChange={handleTargetSemesterChange}
                    >
                      <SelectTrigger className="rounded-lg">
                        <SelectValue placeholder={isLoadingSemesters ? "Loading semesters..." : "Select a semester"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        {subjectSemesters.map((sem) => {
                          const credits = getSemesterCredits(sem);
                          return (
                            <SelectItem
                              key={sem.registration_id || sem.stynumber}
                              value={sem.registration_id}
                            >
                              {sem.registration_code || sem.coursename || sem.stynumber}
                              {credits > 0 && (
                                <span className="ml-2 text-muted-foreground text-sm">
                                  ({credits} credits)
                                </span>
                              )}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Target CGPA (by end of semester)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      step="0.01"
                      value={targetCGPA}
                      onChange={(e) => setTargetCGPA(e.target.value)}
                      placeholder="Enter target CGPA (e.g., 9.0)"
                      className="rounded-lg"
                    />
                  </div>

                  <Button
                    variant="default"
                    className="w-full rounded-lg h-12 text-base font-semibold"
                    onClick={calculateRequiredSGPA}
                    disabled={isLoadingSubjects}
                  >
                    Calculate Required SGPA
                  </Button>
                </div>

                {targetError && (
                  <div className="mt-3 text-destructive text-sm">
                    {targetError}
                  </div>
                )}

                {requiredSGPA !== null && !targetError && (
                  <div className="mt-6 space-y-4">
                    <div className="bg-card border rounded-lg p-4">
                      <div className="text-center space-y-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          {targetSemester?.registration_code || targetSemester?.coursename || targetSemester?.stynumber || "Selected Semester"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Required SGPA
                        </p>
                        {requiredSGPA > 10 ? (
                          <div>
                            <p className="text-3xl font-bold text-destructive">
                              Not Achievable
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Target CGPA of {formatGPA(parseFloat(targetCGPA))} cannot be achieved this semester.
                              The required SGPA ({formatGPA(requiredSGPA)}) exceeds the maximum possible (10.0).
                            </p>
                          </div>
                        ) : requiredSGPA < 0 ? (
                          <div>
                            <p className="text-3xl font-bold text-primary">
                              Already Achieved!
                            </p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Your current CGPA already meets or exceeds your target of {formatGPA(parseFloat(targetCGPA))}.
                            </p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-5xl font-bold text-primary">
                              {formatGPA(requiredSGPA)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-3">
                              Achieve an SGPA of {formatGPA(requiredSGPA)} this semester to reach your target CGPA of {formatGPA(parseFloat(targetCGPA))}.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {sd && sd.length > 0 && (
                      <div className="bg-card border rounded-lg p-4">
                        <p className="text-xs text-muted-foreground space-y-1">
                          <span className="block">Current Stats:</span>
                          <span className="block">• Previous semesters: {sd.length}</span>
                          <span className="block">• Current CGPA: {
                            formatGPA(
                              sd.reduce((sum, sem) => sum + (parseFloat(sem.sgpa) * parseFloat(sem.totalcoursecredit)), 0) /
                              sd.reduce((sum, sem) => sum + parseFloat(sem.totalcoursecredit), 0)
                            )
                          }</span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
    </>
  );
}
