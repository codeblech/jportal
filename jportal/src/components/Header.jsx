import React from 'react';
import { useNavigate } from 'react-router-dom';
import ThemeBtn from "./ui/ThemeBtn";

const Header = ({ setIsAuthenticated }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('password');
    localStorage.removeItem('attendanceData');
    setIsAuthenticated(false);
    navigate('/login');
  };

    return (
      <header className="bg-[#191c20] mx-auto px-3 pt-4 pb-2 dark:bg-white shadow-md">
        <div className="container-fluid flex justify-between items-center">
          <h1 className="text-white text-2xl font-bold lg:text-3xl font-sans dark:text-black">
            JPortal
          </h1>
          <div className="flex items-center space-x-4">
            <ThemeBtn />
            <div className='hover:bg-gray-700 rounded-full p-2 dark:hover:bg-gray-300'>
              <img
                src='/jportal/icons/logout.svg' // hardcoded path, fix later
                alt="Logout"
                onClick={handleLogout}
                className="w-6 h-6 cursor-pointer hover:opacity-80 transition-opacity dark:filter dark:invert"
              />
            </div>
          </div>
        </div>
      </header>
    );

};

export default Header;
