import { useNavigate } from "react-router-dom";
import { ThemeSelectorDialog } from "./theme-selector-dialog";
import { Button } from "./ui/button";
import LogoutIcon from "@/../public/icons/logout.svg?react";
import { Link } from "react-router-dom";
import { ChartNoAxesCombined } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const FairyLights = () => {
  const [textMetrics, setTextMetrics] = useState(null);
  const textRef = useRef(null);

  useEffect(() => {
    if (!textRef.current) return;

    const measureText = () => {
      const element = textRef.current;
      const computedStyle = window.getComputedStyle(element);
      const fontSize = parseFloat(computedStyle.fontSize);

      // Get the parent container's padding
      const container = element.parentElement;
      const containerStyle = window.getComputedStyle(container);
      const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;

      // Use canvas to measure text accurately
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.font = `${computedStyle.fontWeight} ${fontSize}px ${computedStyle.fontFamily}`;

      const text = "JPortal";
      let totalWidth = 0;
      const charWidths = [];

      for (const char of text) {
        const metrics = ctx.measureText(char);
        charWidths.push({
          char,
          width: metrics.width,
          x: totalWidth
        });
        totalWidth += metrics.width;
      }

      const lChar = charWidths.find(c => c.char === 'l');

      setTextMetrics({
        totalWidth,
        charWidths,
        lPosition: lChar ? lChar.x + lChar.width : totalWidth,
        fontSize,
        paddingLeft
      });
    };

    // Measure after fonts are loaded
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measureText);
    } else {
      // Fallback for browsers without Font Loading API
      setTimeout(measureText, 100);
    }

    // Re-measure on font changes
    const observer = new MutationObserver(measureText);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    return () => observer.disconnect();
  }, []);

  // Generate light positions along the text width
  const generateLights = () => {
    if (!textMetrics) {
      // Fallback positions while measuring
      return Array.from({ length: 12 }, (_, i) => ({
        id: i,
        color: ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4ecdc4', '#ff8fa3', '#a8e6cf'][i % 6],
        delay: i * 0.15,
        x: -10 + (i * 11),
        y: 20 + Math.sin(i * 0.8) * 5
      }));
    }

    const { lPosition, paddingLeft } = textMetrics;
    const numLights = 14;
    const lights = [];
    const offset = paddingLeft || 0;

    for (let i = 0; i < numLights; i++) {
      let x, y;

      if (i < numLights - 3) {
        // Distribute lights along the text width
        const progress = i / (numLights - 4);
        x = offset - 10 + (progress * (lPosition + 10));
        y = 20 + Math.sin(i * 0.6) * 4;
      } else {
        // Last 3 lights dangle down from 'l'
        const dangleIndex = i - (numLights - 3);
        x = offset + lPosition + dangleIndex * 3;
        y = 20 + dangleIndex * 8;
      }

      lights.push({
        id: i,
        color: ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4ecdc4', '#ff8fa3', '#a8e6cf'][i % 6],
        delay: i * 0.15,
        x,
        y
      });
    }

    return lights;
  };

  // Generate SVG path for the wire
  const generateWirePath = () => {
    if (!textMetrics) {
      return "M -10,20 Q 30,10 60,15 T 110,18 Q 115,20 118,28";
    }

    const { lPosition, paddingLeft } = textMetrics;
    const offset = paddingLeft || 0;
    const numPoints = 8;
    let path = `M ${offset - 10},20`;

    for (let i = 1; i < numPoints; i++) {
      const progress = i / (numPoints - 1);
      const x = offset - 10 + (progress * (lPosition + 10));
      const y = 20 + Math.sin(i * 0.6) * 4;

      if (i === 1) {
        path += ` Q ${x},${y - 8} ${x},${y}`;
      } else {
        path += ` T ${x},${y}`;
      }
    }

    // Add dangle path
    const dangleStart = offset + lPosition;
    path += ` Q ${dangleStart + 2},${22} ${dangleStart + 3},${28}`;
    path += ` T ${dangleStart + 6},${36}`;
    path += ` T ${dangleStart + 9},${44}`;

    return path;
  };

  const lights = generateLights();
  const wirePath = generateWirePath();

  return (
    <>
      {/* Hidden reference element for text measurement */}
      <span
        ref={textRef}
        className="text-2xl font-bold lg:text-3xl font-sans absolute opacity-0 pointer-events-none"
        aria-hidden="true"
      >
        JPortal
      </span>

      <div className="absolute inset-0 pointer-events-none overflow-visible">
        <svg className="absolute w-full h-full" style={{ top: '-8px', overflow: 'visible' }}>
          {/* Wire path */}
          <path
            d={wirePath}
            stroke="rgba(100, 100, 100, 0.3)"
            strokeWidth="1.5"
            fill="none"
          />
          {/* Lights */}
          {lights.map((light) => (
            <g key={light.id}>
              {/* Light glow */}
              <circle
                cx={light.x}
                cy={light.y}
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
                cx={light.x}
                cy={light.y}
                r="2"
                fill={light.color}
                style={{
                  animation: `twinkle ${1 + Math.random() * 0.5}s ease-in-out infinite`,
                  animationDelay: `${light.delay}s`,
                  filter: 'brightness(1.2)',
                }}
              />
            </g>
          ))}
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
    </>
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
