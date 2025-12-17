import fakeData from "../assets/fakedata.json";

export default class MockWebPortal {
  constructor() {
    this.session = { get_headers: async () => ({}) };
  }

  async student_login() {
    return true;
  }

  async get_attendance_meta() {
    // Reorder semesters based on current month for better demo UX
    // Jan-July: Even semester first (EVESEM)
    // Aug-Dec: Odd semester first (ODDSEM)
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const isEvenSemesterPeriod = currentMonth >= 1 && currentMonth <= 7;

    let orderedSemesters = [...fakeData.attendance.semestersData.semesters];

    // Sort semesters to put the current academic semester first
    orderedSemesters.sort((a, b) => {
      const aIsEven = a.registration_code.includes("EVESEM");
      const bIsEven = b.registration_code.includes("EVESEM");

      if (isEvenSemesterPeriod) {
        // Even semester period: EVESEM should come first
        if (aIsEven && !bIsEven) return -1;
        if (!aIsEven && bIsEven) return 1;
      } else {
        // Odd semester period: ODDSEM should come first
        if (!aIsEven && bIsEven) return -1;
        if (aIsEven && !bIsEven) return 1;
      }
      return 0;
    });

    // Set the first semester as the latest (default selected)
    const latestSemester = orderedSemesters[0];

    return {
      semesters: orderedSemesters,
      latest_header: () => fakeData.attendance.semestersData.latest_header,
      latest_semester: () => latestSemester,
    };
  }

  async get_attendance(header, semester) {
    const semKey = semester.registration_code || semester;
    return fakeData.attendance.attendanceData[semKey] || { studentattendancelist: [] };
  }

  async get_subject_daily_attendance(semester, subjectid, individualsubjectcode, subjectcomponentids) {
    return {
      studentAttdsummarylist: fakeData.attendance.subjectAttendanceData[individualsubjectcode] || [],
    };
  }

  async get_sgpa_cgpa() {
    return fakeData.grades.gradesData;
  }

  async get_semesters_for_grade_card() {
    return fakeData.grades.gradeCardSemesters;
  }

  async get_grade_card(semester) {
    const semKey = semester.registration_code || semester;
    return fakeData.grades.gradeCards[semKey] || { gradecard: [] };
  }

  async get_semesters_for_marks() {
    return fakeData.grades.marksSemesters;
  }

  async download_marks(semester) {
    const semKey = semester.registration_code || semester;
    return fakeData.grades.marksData[semKey] || { courses: [] };
  }

  async get_registered_subjects_and_faculties(semester) {
    const semKey = semester.registration_code || semester;
    const data = fakeData.subjects.subjectData[semKey];
    if (data) {
      return {
        subjects: data.subjects,
        registered_subject_faculty: data.subjects,
      };
    }
    return { subjects: [], registered_subject_faculty: [] };
  }

  async get_personal_info() {
    return fakeData.profile;
  }

  async get_fee_summary() {
    return fakeData.fees.fee_summary || [];
  }

  async get_fines_msc_charges() {
    return fakeData.fees.fines_msc_charges || [];
  }

  async get_subject_choices(semester) {
    let semKey = null;
    if (!semester) semKey = null;
    else if (typeof semester === "string") semKey = semester;
    else semKey = semester.registration_code || semester.registration_id || null;

    const choiceSubjects = fakeData.subjects && fakeData.subjects.choiceSubjects;
    if (choiceSubjects && semKey && choiceSubjects[semKey]) {
      // Return the response object which contains the subjectpreferencegrid
      return choiceSubjects[semKey].response || {};
    }
    return { subjectpreferencegrid: [] };
  }

  async get_semesters_for_exam_events() {
    return fakeData.exams.examSemesters || [];
  }

  async get_exam_events(semester) {
    const semKey = semester.registration_code || semester;
    return fakeData.exams.examEvents[semKey] || [];
  }

  async get_exam_schedule(event) {
    const eventKey = event.exameventid || event.exam_event_id || event;
    return { subjectinfo: fakeData.exams.examSchedule[eventKey] || [] };
  }

  async get_registered_semesters() {
    return fakeData.subjects.semestersData.semesters;
  }
}
