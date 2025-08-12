import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
  CssBaseline,
} from "@mui/material";

const themes = {
  darkBlue: {
    "--bg-color": "#191c20", // main background color (from App.jsx, Attendance.jsx, etc.)
    "--primary-color": "#232e39", // used for cards, tabs, and primary UI elements
    "--accent-color": "#7ec3f0", // accent (matches previous, could be #60A5FA or #3182ce for blue highlights)
    "--text-color": "#ffffff", // main text color (text-white)
    "--card-bg": "#1b232b", // card background (close to #191c20, but slightly lighter for contrast)
    "--label-color": "#9CA3AF", // label/secondary text (text-gray-400 from Grades, etc.)
    "--radius": "8px", // border radius
  },
  white: {
    "--bg-color": "#ffffff",
    "--primary-color": "#f1f5f9",
    "--accent-color": "#3182ce",
    "--text-color": "#191c20",
    "--card-bg": "#f8fafc",
    "--label-color": "#555",
    "--radius": "8px",
  },
  cream: {
    "--bg-color": "#fdf6e3",
    "--primary-color": "#f5e9da",
    "--accent-color": "#A47551",
    "--text-color": "#3b2f1e",
    "--card-bg": "#f7f1e1",
    "--label-color": "#555",
    "--radius": "8px",
  },
  amoled: {
    "--bg-color": "#000000",
    "--primary-color": "#111111",
    "--accent-color": "#00bcd4",
    "--text-color": "#e0e6ed",
    "--card-bg": "#181818",
    "--label-color": "#b0b3b8",
    "--radius": "8px",
  },
};

const defaultCustomTheme = {
  label: "Orange Dark",
  colors: {
    "--bg-color": "#000",
    "--primary-color": "#ff8c42",
    "--accent-color": "#fb923c",
    "--text-color": "#fef7ed",
    "--card-bg": "#23201c",
    "--label-color": "#fed7aa",
    "--radius": "8px",
  },
};

const ThemeContext = createContext({
  theme: "darkBlue",
  setTheme: () => {},
  radius: 8,
  setRadius: () => {},
  useMaterialUI: false,
  setUseMaterialUI: () => {},
  useCardBackgrounds: true,
  setUseCardBackgrounds: () => {},
  customThemes: [defaultCustomTheme],
  setCustomThemes: () => {},
  selectedCustomTheme: 0,
  setSelectedCustomTheme: () => {},
  setCustomThemeColors: () => {},
  setCustomThemeLabel: () => {},
  deleteCustomTheme: () => {},
  addCustomTheme: () => {},
});

const SystemColorModeContext = createContext({
  systemColorMode: "dark", // "dark" or "light"
});

export const useTheme = () => useContext(ThemeContext);
export const useSystemColorMode = () => useContext(SystemColorModeContext);

export const ThemeProvider = ({ children }) => {
  // System color mode detection
  const getSystemColorMode = () =>
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  const [systemColorMode, setSystemColorMode] = useState(getSystemColorMode());

  // Track if user has chosen a theme (not just default)
  const userHasChosenThemeRef = useRef(false);

  // --- Theme state ---
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved && (themes[saved] || saved === "custom")) {
      userHasChosenThemeRef.current = true;
      return saved;
    }
    // No saved theme: use system color mode
    return getSystemColorMode() === "dark" ? "darkBlue" : "cream";
  });
  const [radius, setRadius] = useState(() => {
    const saved = localStorage.getItem("radius");
    return saved ? Number(saved) : 8;
  });
  const [useMaterialUI, setUseMaterialUI] = useState(() => {
    const saved = localStorage.getItem("useMaterialUI");
    return saved === "true";
  });
  const [useCardBackgrounds, setUseCardBackgrounds] = useState(() => {
    const saved = localStorage.getItem("useCardBackgrounds");
    return saved === null ? true : saved === "true";
  });
  const [customThemes, setCustomThemes] = useState(() => {
    const saved = localStorage.getItem("customThemes");
    return saved ? JSON.parse(saved) : [defaultCustomTheme];
  });
  const [selectedCustomTheme, setSelectedCustomTheme] = useState(() => {
    const saved = localStorage.getItem("selectedCustomTheme");
    return saved ? Number(saved) : 0;
  });

  // Helper to update colors of a custom theme
  const setCustomThemeColors = (colors) => {
    setCustomThemes((themes) => {
      const updated = [...themes];
      updated[selectedCustomTheme] = {
        ...updated[selectedCustomTheme],
        colors: { ...updated[selectedCustomTheme].colors, ...colors },
      };
      return updated;
    });
  };

  // Helper to update label of a custom theme
  const setCustomThemeLabel = (label) => {
    setCustomThemes((themes) => {
      const updated = [...themes];
      updated[selectedCustomTheme] = {
        ...updated[selectedCustomTheme],
        label,
      };
      return updated;
    });
  };

  // Helper to delete a custom theme
  const deleteCustomTheme = (idx) => {
    setCustomThemes((themes) => {
      const updated = themes.filter((_, i) => i !== idx);
      // If deleted theme is selected, select first or previous
      if (selectedCustomTheme >= updated.length) {
        setSelectedCustomTheme(Math.max(0, updated.length - 1));
      }
      return updated.length ? updated : [defaultCustomTheme];
    });
  };

  // Helper to add a new custom theme
  const addCustomTheme = (label = "New Custom Theme") => {
    setCustomThemes((themes) => {
      const updated = [
        ...themes,
        { label, colors: { ...defaultCustomTheme.colors } },
      ];
      setSelectedCustomTheme(updated.length - 1);
      return updated;
    });
    setTheme("custom");
  };

  // Patch setTheme to mark user choice
  const setTheme = (val) => {
    userHasChosenThemeRef.current = true;
    setThemeState(val);
  };

  // Listen for system color mode changes
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => {
      const newMode = e.matches ? "dark" : "light";
      setSystemColorMode(newMode);
      // Only auto-switch if user hasn't chosen a theme (not custom)
      const saved = localStorage.getItem("theme");
      if (
        !userHasChosenThemeRef.current &&
        (!saved || saved === "darkBlue" || saved === "cream")
      ) {
        setThemeState(newMode === "dark" ? "darkBlue" : "cream");
      }
    };
    mql.addEventListener
      ? mql.addEventListener("change", handleChange)
      : mql.addListener(handleChange);
    return () => {
      mql.removeEventListener
        ? mql.removeEventListener("change", handleChange)
        : mql.removeListener(handleChange);
    };
  }, []);

  useEffect(() => {
    let themeVars;
    let isLightTheme = false;
    if (theme === "custom") {
      const custom = customThemes[selectedCustomTheme] || defaultCustomTheme;
      isLightTheme = !!custom.isLightTheme;
      themeVars = { ...custom.colors, "--radius": radius + "px" };
    } else {
      isLightTheme = theme === "cream" || theme === "white";
      themeVars = { ...themes[theme], "--radius": radius + "px" };
    }
    Object.entries(themeVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
    localStorage.setItem("theme", theme);
    localStorage.setItem("radius", radius);
    localStorage.setItem("useMaterialUI", useMaterialUI);
    localStorage.setItem("useCardBackgrounds", useCardBackgrounds);
    localStorage.setItem("customThemes", JSON.stringify(customThemes));
    localStorage.setItem("selectedCustomTheme", selectedCustomTheme);
  }, [
    theme,
    radius,
    useMaterialUI,
    customThemes,
    selectedCustomTheme,
    useCardBackgrounds,
  ]);

  // Helper: Convert CSS variable theme to MUI theme
  const getMuiTheme = () => {
    let themeVars;
    if (theme === "custom") {
      const custom = customThemes[selectedCustomTheme] || defaultCustomTheme;
      themeVars = { ...custom.colors, "--radius": radius + "px" };
    } else {
      themeVars = { ...themes[theme], "--radius": radius + "px" };
    }
    // Parse colors for MUI palette
    return createTheme({
      palette: {
        mode:
          theme === "white" ||
          theme === "cream" ||
          (theme === "custom" &&
            customThemes[selectedCustomTheme]?.isLightTheme)
            ? "light"
            : "dark",
        background: {
          default: themeVars["--bg-color"],
          paper: themeVars["--card-bg"],
        },
        primary: {
          main: themeVars["--accent-color"],
          contrastText: themeVars["--bg-color"],
        },
        secondary: {
          main: themeVars["--primary-color"],
        },
        text: {
          primary: themeVars["--text-color"],
          secondary: themeVars["--label-color"],
        },
      },
      shape: {
        borderRadius: parseInt(themeVars["--radius"]),
      },
      components: {
        MuiPaper: {
          styleOverrides: {
            root: {
              background: themeVars["--card-bg"],
              color: themeVars["--text-color"],
            },
          },
        },
        MuiInputBase: {
          styleOverrides: {
            root: {
              background: themeVars["--card-bg"],
              color: themeVars["--text-color"],
              borderRadius: themeVars["--radius"],
            },
            input: {
              color: themeVars["--text-color"],
            },
          },
        },
        MuiOutlinedInput: {
          styleOverrides: {
            root: {
              background: themeVars["--card-bg"],
              color: themeVars["--text-color"],
              borderRadius: themeVars["--radius"],
            },
            notchedOutline: {
              borderColor: themeVars["--label-color"],
            },
          },
        },
        MuiInputLabel: {
          styleOverrides: {
            root: {
              color: themeVars["--label-color"],
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              borderRadius: themeVars["--radius"],
              fontWeight: 500,
            },
          },
        },
        MuiMenu: {
          styleOverrides: {
            paper: {
              background: themeVars["--card-bg"],
              color: themeVars["--text-color"],
              borderRadius: themeVars["--radius"],
            },
          },
        },
        MuiMenuItem: {
          styleOverrides: {
            root: {
              color: themeVars["--text-color"],
              borderRadius: themeVars["--radius"],
            },
          },
        },
        MuiSelect: {
          styleOverrides: {
            select: {
              background: themeVars["--card-bg"],
              color: themeVars["--text-color"],
              borderRadius: themeVars["--radius"],
            },
            icon: {
              color: themeVars["--label-color"],
            },
          },
        },
        MuiSwitch: {
          styleOverrides: {
            switchBase: {
              color: themeVars["--accent-color"],
            },
            colorPrimary: {
              color: themeVars["--accent-color"],
            },
            track: {
              backgroundColor: themeVars["--accent-color"],
            },
          },
        },
      },
    });
  };

  const muiTheme = getMuiTheme();

  return (
    <SystemColorModeContext.Provider value={{ systemColorMode }}>
      <ThemeContext.Provider
        value={{
          theme,
          setTheme,
          radius,
          setRadius,
          useMaterialUI,
          setUseMaterialUI,
          useCardBackgrounds,
          setUseCardBackgrounds,
          customThemes,
          setCustomThemes,
          selectedCustomTheme,
          setSelectedCustomTheme,
          setCustomThemeColors,
          setCustomThemeLabel,
          deleteCustomTheme,
          addCustomTheme,
          isLightTheme:
            theme === "custom"
              ? !!(
                  customThemes[selectedCustomTheme] &&
                  customThemes[selectedCustomTheme].isLightTheme
                )
              : theme === "cream" || theme === "white",
          systemColorMode,
        }}
      >
        <MuiThemeProvider theme={muiTheme}>
          <CssBaseline />
          {children}
        </MuiThemeProvider>
      </ThemeContext.Provider>
    </SystemColorModeContext.Provider>
  );
};
