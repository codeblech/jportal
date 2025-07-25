import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Palette, LogOut, Settings as SettingsIcon } from "lucide-react";

const Header = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("password");
    localStorage.removeItem("attendanceData");
    setIsAuthenticated(false);
    navigate("/login");
  };

  useEffect(() => {
    function handleClick(e) {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setSettingsOpen(false);
      }
    }
    if (settingsOpen) {
      document.addEventListener("mousedown", handleClick);
    } else {
      document.removeEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [settingsOpen]);

  return (
    <header className="bg-[var(--bg-color)] mx-auto px-3 pt-4 pb-2">
      <div className="container-fluid flex justify-between md:justify-end items-center">
        <h1 className="text-[var(--text-color)] text-2xl font-bold lg:text-3xl font-sans block md:hidden">
          JPortal
        </h1>
        <div className="flex items-center gap-2">
          <button
            aria-label="Theme Settings"
            onClick={() => navigate("/settings")}
            className="p-2 rounded-full hover:bg-[var(--card-bg)] focus:bg-[var(--card-bg)] transition flex items-center justify-center border border-transparent focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"
          >
            <Palette className="w-6 h-6 text-[var(--text-color)]" />
          </button>
          <button
            aria-label="General Settings"
            onClick={() => navigate("/general-settings")}
            className="p-2 rounded-full hover:bg-[var(--card-bg)] focus:bg-[var(--card-bg)] transition flex items-center justify-center border border-transparent focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"
          >
            <SettingsIcon className="w-6 h-6 text-[var(--text-color)]" />
          </button>
          <button
            aria-label="Log out"
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-[var(--card-bg)] focus:bg-[var(--card-bg)] transition flex items-center justify-center border border-transparent focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"
          >
            <LogOut className="w-6 h-6 text-[var(--text-color)]" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
