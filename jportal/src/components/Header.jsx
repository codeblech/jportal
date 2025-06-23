import React from "react";
import { useNavigate } from "react-router-dom";
import ThemeSwitcher from "./ThemeSwitcher";
import { Palette } from "lucide-react";

const Header = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("password");
    localStorage.removeItem("attendanceData");
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <header className="bg-[var(--bg-color)] mx-auto px-3 pt-4 pb-2">
      <div className="container-fluid flex justify-between items-center">
        <h1 className="text-[var(--text-color)] text-2xl font-bold lg:text-3xl font-sans">
          JPortal
        </h1>
        <div className="flex items-center gap-2">
          <ThemeSwitcher Icon={Palette} />
          <div className="hover:bg-[var(--card-bg)] rounded-xl p-1">
            <img
              src="/jportal/icons/logout.svg" // hardcoded path, fix later
              alt="Logout"
              onClick={handleLogout}
              className="w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
