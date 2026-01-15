in the interactive graph page (not the @src/components/Grades.jsx page), below the actual chart, there are semester cards with progress bars. below them
i want to show a button that says grades simulation. clicking that button should do a transition, the semester cards move out of the left edge of the
screen, and a new ui comes in from the right edge.
the new ui has tabs for each semester that we're showing in the interactive chart (including projected semesters). by default the semester that is just
after the semester for which we have actual sgpa/cgpa data would be open. in each of the tab, at the left we would list down subjects, one in each row.
against the subject, would be a progress bar which has `block of progress`, each block represents a grade for that subject. each grade corresponds to a
grade point according to this table:
A+ 10 Outstanding
A 9 Excellent
B+ 8 Very Good
B 7 Good
C+ 6 Average
C 5 Below Average
D 4 Marginal
F 0 Very Poor

---
user can select any grade for the subjects. user can go to different semester tabs, and the data should be preserved for calculation - the calculation to
get the sgpa and cgpa of the semesters according to the user's selected semesters. by default all the subjects in all semester tabs should have the correct
 grades selected in the progress bars. for the semesters for which the actual data is not out yet and we're projecting, for them by default, it'll be B+
grade for all subjects.
now, the selection of grades here will change the interactive gpa chart.
