/**
 * Recalculates CGPA for all semesters based on a modified SGPA value
 * @param {Array} semesterData - Array of semester objects
 * @param {number} modifiedIndex - Index of the semester that was modified
 * @param {number} newSGPA - New SGPA value for the modified semester
 * @returns {Array} Updated semester data with recalculated CGPAs
 */
export const recalculateCGPA = (semesterData, modifiedIndex, newSGPA) => {
  const updatedData = semesterData.map((sem, idx) => ({ ...sem }));

  // Update the SGPA and earnedgradepoints for the modified semester
  updatedData[modifiedIndex] = {
    ...updatedData[modifiedIndex],
    sgpa: newSGPA,
    earnedgradepoints: newSGPA * updatedData[modifiedIndex].totalcoursecredit
  };

  // Recalculate CGPA for all semesters from the modified one onwards
  for (let i = 0; i < updatedData.length; i++) {
    let totalGradePoints = 0;
    let totalCredits = 0;

    // Sum up all grade points and credits from semester 1 to current semester
    for (let j = 0; j <= i; j++) {
      totalGradePoints += updatedData[j].earnedgradepoints;
      totalCredits += updatedData[j].totalcoursecredit;
    }

    // Calculate CGPA
    updatedData[i].cgpa = totalCredits > 0 ? totalGradePoints / totalCredits : 0;
  }

  return updatedData;
};

/**
 * Recalculates CGPAs for all semesters in the array
 * @param {Array} semesterData - Array of semester objects with sgpa and earnedgradepoints
 * @returns {Array} Updated semester data with recalculated CGPAs
 */
export const recalculateAllCGPAs = (semesterData) => {
  return semesterData.map((sem, i) => {
    let totalGradePoints = 0;
    let totalCredits = 0;

    for (let j = 0; j <= i; j++) {
      totalGradePoints += semesterData[j].earnedgradepoints;
      totalCredits += semesterData[j].totalcoursecredit;
    }

    return {
      ...sem,
      cgpa: totalCredits > 0 ? totalGradePoints / totalCredits : 0
    };
  });
};
