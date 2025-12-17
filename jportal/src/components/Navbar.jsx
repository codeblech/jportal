import { NavLink } from "react-router-dom";
import AttendanceIcon from "@/../public/icons/attendance.svg?react";
import GradesIcon from "@/../public/icons/grades.svg?react";
import ExamsIcon from "@/../public/icons/exams.svg?react";
import SubjectsIcon from "@/../public/icons/subjects1.svg?react";
import ProfileIcon from "@/../public/icons/profile.svg?react";

function Navbar() {
  const navItems = [
    { name: "ATTENDANCE", path: "/attendance", IconComponent: AttendanceIcon },
    { name: "  GRADES  ", path: "/grades", IconComponent: GradesIcon },
    { name: "  EXAMS", path: "/exams", IconComponent: ExamsIcon },
    { name: " SUBJECTS ", path: "/subjects", IconComponent: SubjectsIcon },
    { name: " PROFILE ", path: "/profile", IconComponent: ProfileIcon },
  ];

  return (
    <div className="flex items-center justify-between gap-0 w-screen fixed bottom-0 left-0 bg-muted py-4 px-2">
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) => `
            flex-1 text-md text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground text-clip overflow-hidden whitespace-nowrap
            ${isActive ? "opacity-100" : "opacity-70"}
          `}
        >
          {({ isActive }) => (
            <div className="flex flex-col items-center">
              <div
                className={`hover:bg-primary rounded-xl w-4/5 p-1 flex items-center justify-center ${
                  isActive ? "bg-primary" : ""
                }`}
              >
                <item.IconComponent
                  className={`w-5 h-5 ${isActive ? "fill-primary-foreground" : "fill-muted-foreground"}`}
                />
              </div>
              <p className="max-[400px]:text-[0.55rem] max-[460px]:text-[0.65rem] max-[540px]:text-[0.7rem] text-xs text-left">
                {item.name}
              </p>
            </div>
          )}
        </NavLink>
      ))}
    </div>
  );
}

export default Navbar;
