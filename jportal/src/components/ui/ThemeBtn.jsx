import useTheme from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

function ThemeBtn() {
    const { themeMode, darkTheme, lightTheme } = useTheme();

    function handleClick() {
        if (themeMode === 'dark') {
            lightTheme();
        } else {
            darkTheme();
        }
    }

    return (
        <button
            onClick={handleClick}
            className="p-2 rounded-full focus:outline-none focus:ring-2 transition-colors duration-300 ease-in-out
                        dark:text-gray-700 dark:hover:bg-gray-200 text-gray-300 hover:bg-gray-600"
            aria-label={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {themeMode === 'dark' ? (
                <Moon className="w-5 h-5" />
            ) : (
                <Sun className="w-5 h-5" />
            )}
        </button>
    );
}

export default ThemeBtn;
