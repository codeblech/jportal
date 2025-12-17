import { useNavigate } from "react-router-dom";
import { ThemeSelectorDialog } from "./theme-selector-dialog";
import { Button } from "./ui/button";
import LogoutIcon from "@/../public/icons/logout.svg?react";
import { Link } from "react-router-dom";
import { ChartNoAxesCombined } from "lucide-react";

const FairyLights = () => {
  const lights = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    color: ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4ecdc4', '#ff8fa3', '#a8e6cf'][i % 6],
    delay: i * 0.15,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      <svg className="absolute w-full h-full" style={{ top: '-8px', overflow: 'visible' }}>
        {/* Wire path - now dangles down at the end */}
        <path
          d="M -10,20 Q 30,10 60,15 T 110,18 Q 115,20 118,28"
          stroke="rgba(100, 100, 100, 0.3)"
          strokeWidth="1.5"
          fill="none"
        />
        {/* Lights */}
        {lights.map((light) => {
          let x, y;
          if (light.id < 10) {
            // Regular horizontal distribution for first 10 lights
            x = -10 + (light.id * 11);
            y = 20 + Math.sin(light.id * 0.8) * 5;
          } else {
            // Last 2 lights dangle down
            x = 110 + (light.id - 10) * 4;
            y = 18 + (light.id - 9) * 5;
          }

          return (
            <g key={light.id}>
              {/* Light glow */}
              <circle
                cx={x}
                cy={y}
                r="3"
                fill={light.color}
                opacity="0.6"
                style={{
                  animation: `twinkle ${1 + Math.random() * 0.5}s ease-in-out infinite`,
                  animationDelay: `${light.delay}s`,
                }}
              />
              {/* Light bulb */}
              <circle
                cx={x}
                cy={y}
                r="2"
                fill={light.color}
                style={{
                  animation: `twinkle ${1 + Math.random() * 0.5}s ease-in-out infinite`,
                  animationDelay: `${light.delay}s`,
                  filter: 'brightness(1.2)',
                }}
              />
            </g>
          );
        })}
      </svg>
      <style>
        {`
          @keyframes twinkle {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}
      </style>
    </div>
  );
};

const Header = ({ setIsAuthenticated, setIsDemoMode }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("password");
    localStorage.removeItem("attendanceData");
    setIsAuthenticated(false);
    if (setIsDemoMode) {
      setIsDemoMode(false);
    }
    navigate("/login");
  };

  return (
    <header className="bg-background mx-auto pr-3 pt-4 pb-2">
      <div className="container-fluid flex justify-between items-center">
        <div className="relative inline-block pl-3">
          <FairyLights />
          <h1 className="text-foreground text-2xl font-bold lg:text-3xl font-sans relative z-10">JPortal</h1>
        </div>
        <div className="flex items-center gap-1">
          <Link to="/stats">
            <Button variant="ghost" size="icon" className="cursor-pointer rounded-full">
              <ChartNoAxesCombined />
            </Button>
          </Link>
          <ThemeSelectorDialog />
          <Button variant="ghost" size="icon" onClick={handleLogout} className="cursor-pointer rounded-full">
            <LogoutIcon className="w-7 h-7 stroke-2 stroke-foreground" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
