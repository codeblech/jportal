import { NavLink } from 'react-router-dom'
const BASE_NAME = 'jportal'

function Navbar() {
  const navItems = [
    { name: 'ATTENDANCE', path: '/attendance', icon: `/${BASE_NAME}/icons/attendance.svg` },
    { name: '  GRADES  ', path: '/grades', icon: `/${BASE_NAME}/icons/grades.svg` },
    { name: '  EXAMS', path: '/exams', icon: `/${BASE_NAME}/icons/exams.svg` },
    { name: ' SUBJECTS ', path: '/subjects', icon: `/${BASE_NAME}/icons/subjects1.svg` },
    { name: ' PROFILE ', path: '/profile', icon: `/${BASE_NAME}/icons/profile.svg` },
  ];
  return (
    <div className='flex items-center justify-between sm:gap-0 gap-2 w-screen fixed bottom-0 left-0 bg-[#242a32] dark:bg-white py-4 px-4'>
      {navItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          className={({ isActive }) => `
            flex-1 text-md text-white dark:text-black text-clip overflow-hidden whitespace-nowrap
            ${isActive ? 'opacity-100' : 'opacity-70'}
          `}
        >
          <div className='flex flex-col items-center'>
            <div className='hover:bg-gray-700 dark:hover:bg-gray-300 rounded-xl w-full p-1 flex items-center justify-center'>
              <img src={item.icon} alt={item.name} className="w-5 h-5" />
            </div>
            <p className='max-[370px]:text-[0.6rem] max-[390px]:text-[0.7rem] text-xs text-left'>{item.name}</p>
          </div>
        </NavLink>
      ))}
    </div>
  )
}

export default Navbar
