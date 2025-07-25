import React, { useState, useEffect } from "react";
import { useTheme } from "./ThemeProvider";
import { useSystemColorMode } from "./ThemeProvider";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Check,
  Palette,
  Download,
  Upload,
  Plus,
  X,
  Settings,
  Users,
  RefreshCw,
  Star,
} from "lucide-react";
import { useSwipeable } from "react-swipeable";
import MuiSwitch from "@mui/material/Switch";
import { useNavigate, useLocation } from "react-router-dom";

const options = [
  { value: "darkBlue", label: "Dark Blue", color: "#141c23", text: "#eaf6fb" },
  { value: "white", label: "White", color: "#fff", text: "#191c20" },
  { value: "cream", label: "Cream", color: "#fdf6e3", text: "#3b2f1e" },
  { value: "amoled", label: "AMOLED Black", color: "#000", text: "#e0e6ed" },
  { value: "custom", label: "Custom", color: null, text: null },
];

const customColorFields = [
  { key: "--bg-color", label: "Background" },
  { key: "--primary-color", label: "Primary" },
  { key: "--accent-color", label: "Accent" },
  { key: "--text-color", label: "Text" },
  { key: "--card-bg", label: "Card" },
  { key: "--label-color", label: "Label" },
];

const configKeyMap = {
  theme: "THEME",
  radius: "RADIUS",
  useMaterialUI: "USE_MATERIAL_UI",
  "--bg-color": "BG_COLOR",
  "--primary-color": "PRIMARY_COLOR",
  "--accent-color": "ACCENT_COLOR",
  "--text-color": "TEXT_COLOR",
  "--card-bg": "CARD_BG",
  "--label-color": "LABEL_COLOR",
  isLightTheme: "LIGHT_THEME",
};

const reverseConfigKeyMap = Object.fromEntries(
  Object.entries(configKeyMap).map(([k, v]) => [v, k])
);

function getContrastColor(bg) {
  if (!bg) return "#222";
  const c = bg.charAt(0) === "#" ? bg.substring(1) : bg;
  const rgb = parseInt(
    c.length === 3
      ? c
          .split("")
          .map((x) => x + x)
          .join("")
      : c,
    16
  );
  const r = (rgb >> 16) & 255,
    g = (rgb >> 8) & 255,
    b = rgb & 255;
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  return luminance > 180 ? "#222" : "#fff";
}

function exportThemeConfig({
  theme,
  customColors,
  radius,
  useMaterialUI,
  isLightTheme,
}) {
  const lines = [];
  lines.push(`${configKeyMap.theme}=${theme}`);
  lines.push(`${configKeyMap.radius}=${radius}`);
  lines.push(`${configKeyMap.useMaterialUI}=${useMaterialUI}`);
  if (typeof isLightTheme !== "undefined") {
    lines.push(`${configKeyMap.isLightTheme}=${isLightTheme}`);
  }
  if (theme === "custom") {
    Object.entries(customColors).forEach(([cssVar, value]) => {
      if (configKeyMap[cssVar]) {
        lines.push(`${configKeyMap[cssVar]}=${value}`);
      }
    });
  }
  return lines.join("\n");
}

// Export all custom themes in a sectioned format
function exportAllCustomThemes(customThemes) {
  const lines = [];
  customThemes.forEach((theme) => {
    lines.push(`[THEME ${theme.label}]`);
    if (typeof theme.isLightTheme !== "undefined") {
      lines.push(`${configKeyMap.isLightTheme}=${theme.isLightTheme}`);
    }
    Object.entries(theme.colors).forEach(([cssVar, value]) => {
      if (configKeyMap[cssVar]) {
        lines.push(`${configKeyMap[cssVar]}=${value}`);
      }
    });
    lines.push("");
  });
  return lines.join("\n");
}

function importThemeConfig(configText) {
  const lines = configText.split(/\r?\n/);
  const result = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    if (!key || rest.length === 0) continue;
    const value = rest.join("=");
    const mapped = reverseConfigKeyMap[key];
    if (mapped) {
      result[mapped] = value;
    }
  }
  // If isLightTheme is missing, default to false (dark)
  if (typeof result.isLightTheme === "undefined") {
    result.isLightTheme = false;
  } else {
    result.isLightTheme = result.isLightTheme === "true";
  }
  return result;
}

// Import multiple custom themes from sectioned config
function importAllCustomThemes(configText) {
  const lines = configText.split(/\r?\n/);
  const themes = [];
  let current = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("[THEME ") && trimmed.endsWith("]")) {
      if (current) themes.push(current);
      const label = trimmed.slice(7, -1).trim();
      current = { label, colors: {}, isLightTheme: false };
    } else if (current && trimmed.includes("=")) {
      const [key, ...rest] = trimmed.split("=");
      const value = rest.join("=");
      const mapped = reverseConfigKeyMap[key];
      if (mapped && mapped.startsWith("--")) {
        current.colors[mapped] = value;
      } else if (mapped === "isLightTheme") {
        current.isLightTheme = value === "true";
      }
    }
  }
  if (current) themes.push(current);
  return themes;
}

// Function to fetch user-contributed themes
async function fetchUserThemes() {
  try {
    console.log("Fetching theme list from /jportal/api/themes.json...");

    // Fetch the list of available theme files from the static manifest
    const response = await fetch("/jportal/api/themes.json");
    if (!response.ok) {
      throw new Error(
        `Failed to fetch theme list: ${response.status} ${response.statusText}`
      );
    }

    const { themes } = await response.json();
    console.log("Available theme files:", themes);

    const allThemes = [];

    // Fetch each theme file
    for (const themeFile of themes) {
      try {
        console.log(`Fetching theme file: ${themeFile.url}`);
        const fileResponse = await fetch(themeFile.url);

        if (!fileResponse.ok) {
          console.error(
            `Failed to fetch ${themeFile.filename}: ${fileResponse.status} ${fileResponse.statusText}`
          );
          continue;
        }

        const text = await fileResponse.text();
        console.log(
          `Content of ${themeFile.filename}:`,
          text.substring(0, 200) + "..."
        );

        const parsedThemes = importAllCustomThemes(text);
        console.log(
          `Parsed ${parsedThemes.length} themes from ${themeFile.filename}:`,
          parsedThemes
        );

        // Add metadata to each theme
        parsedThemes.forEach((theme) => {
          allThemes.push({
            ...theme,
            author: themeFile.author,
            source: themeFile.filename,
            isCommunity: true,
          });
        });
      } catch (error) {
        console.error(`Error fetching ${themeFile.filename}:`, error);
      }
    }

    console.log("Total themes loaded:", allThemes.length);
    return allThemes;
  } catch (error) {
    console.error("Error fetching user themes:", error);
    return [];
  }
}

// Function to fetch all available theme files
async function fetchAllUserThemeFiles() {
  return await fetchUserThemes();
}

export default function ThemeSwitcher() {
  const {
    theme,
    setTheme,
    radius,
    setRadius,
    useMaterialUI,
    setUseMaterialUI,
    customThemes,
    setCustomThemes,
    selectedCustomTheme,
    setSelectedCustomTheme,
    setCustomThemeColors,
    setCustomThemeLabel,
    deleteCustomTheme,
    addCustomTheme,
    useCardBackgrounds,
    setUseCardBackgrounds,
  } = useTheme();
  const { systemColorMode } = useSystemColorMode();
  const [renamingIdx, setRenamingIdx] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [userThemes, setUserThemes] = useState([]);
  const [isLoadingUserThemes, setIsLoadingUserThemes] = useState(false);
  const [activeTab, setActiveTab] = useState("builtin"); // "builtin", "custom", "community"
  const [showAddThemeInput, setShowAddThemeInput] = useState(false);
  const [newThemeName, setNewThemeName] = useState("");
  const radiusOptions = [0, 4, 8, 12, 16, 24];
  const navigate = useNavigate();
  const location = useLocation();

  // Tab order for swiping
  const tabOrder = ["builtin", "custom", "community"];

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      const currentIndex = tabOrder.indexOf(activeTab);
      if (currentIndex < tabOrder.length - 1) {
        setActiveTab(tabOrder[currentIndex + 1]);
      }
    },
    onSwipedRight: () => {
      const currentIndex = tabOrder.indexOf(activeTab);
      if (currentIndex > 0) {
        setActiveTab(tabOrder[currentIndex - 1]);
      }
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
    delta: 50, // Minimum swipe distance
    swipeDuration: 500, // Maximum swipe duration
  });

  // Load user themes on component mount
  useEffect(() => {
    loadUserThemes();
  }, []);

  const loadUserThemes = async () => {
    setIsLoadingUserThemes(true);
    try {
      const themes = await fetchAllUserThemeFiles();
      setUserThemes(themes);
    } catch (error) {
      console.error("Error loading user themes:", error);
    } finally {
      setIsLoadingUserThemes(false);
    }
  };

  // Helper for color picker contrast
  const getPickerBorder = (color) => {
    const contrast = getContrastColor(color);
    return contrast === "#fff" ? "#222" : "#fff";
  };

  // Helper for current custom theme
  const currentCustom = customThemes[selectedCustomTheme] || customThemes[0];

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 w-full">
      {/* Back Button */}
      <div className="flex items-center mb-2">
        {location.pathname === "/settings" && (
          <button
            onClick={() => navigate(-1)}
            className="mr-2 p-2 rounded-full hover:bg-[var(--card-bg)] focus:bg-[var(--card-bg)] transition border border-transparent focus-visible:ring-2 focus-visible:ring-[var(--accent-color)]"
            aria-label="Back"
          >
            <svg
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-arrow-left w-5 h-5 text-[var(--text-color)]"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
        )}
        <h1 className="text-2xl font-semibold text-[var(--text-color)] text-center flex-1 mb-1">
          Theme Settings
        </h1>
      </div>
      <div className="px-0 pb-0 space-y-6">
        <div className="text-xs text-center mt-1 text-[var(--label-color)]">
          System color mode:{" "}
          <span className="font-semibold">{systemColorMode}</span>
        </div>
        <div className="px-6 pb-6 space-y-6" {...swipeHandlers}>
          {/* Tab Navigation */}
          <div className="flex gap-1 p-1 rounded-lg bg-[var(--card-bg)]/50">
            <button
              onClick={() => setActiveTab("builtin")}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
                activeTab === "builtin"
                  ? "bg-[var(--accent-color)] text-[var(--bg-color)]"
                  : "text-[var(--text-color)] hover:bg-[var(--card-bg)]"
              }`}
            >
              Built-in
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
                activeTab === "custom"
                  ? "bg-[var(--accent-color)] text-[var(--bg-color)]"
                  : "text-[var(--text-color)] hover:bg-[var(--card-bg)]"
              }`}
            >
              Custom
            </button>
            <button
              onClick={() => setActiveTab("community")}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
                activeTab === "community"
                  ? "bg-[var(--accent-color)] text-[var(--bg-color)]"
                  : "text-[var(--text-color)] hover:bg-[var(--card-bg)]"
              }`}
            >
              <Users className="w-3 h-3 mr-1 inline" />
              Community
            </button>
          </div>

          {/* Swipe indicator */}
          <div className="flex justify-center gap-1">
            {tabOrder.map((tab, index) => (
              <div
                key={tab}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-[var(--accent-color)]"
                    : "bg-[var(--border-color)]"
                }`}
              />
            ))}
          </div>

          {/* Built-in Themes */}
          {activeTab === "builtin" && (
            <div className="space-y-3 max-h-[70vh] pr-1">
              <Label className="text-sm font-medium text-[var(--label-color)]">
                Choose Theme
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {options.map((opt) => {
                  if (opt.value === "custom" && theme !== "custom") {
                    return null;
                  }
                  const isSelected = theme === opt.value;
                  const labelColor = getContrastColor(opt.color);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setTheme(opt.value);
                        if (location.pathname !== "/settings") {
                          navigate("/settings");
                        }
                      }}
                      className={`relative group flex flex-col items-center p-3 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2 ${
                        isSelected
                          ? "bg-[var(--card-bg)] ring-2 ring-[var(--accent-color)] ring-offset-2"
                          : "hover:bg-[var(--card-bg)]/50"
                      }`}
                      aria-label={opt.label}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl mb-2 flex items-center justify-center transition-all duration-200 border-2 ${
                          isSelected
                            ? "border-[var(--accent-color)]"
                            : "border-transparent"
                        }`}
                        style={{ background: opt.color }}
                      >
                        {isSelected && (
                          <Check
                            className="w-5 h-5"
                            style={{
                              color: labelColor,
                              filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.3))",
                            }}
                          />
                        )}
                      </div>
                      <span
                        className={`text-xs font-medium transition-colors duration-200 ${
                          isSelected
                            ? "text-[var(--accent-color)]"
                            : "text-[var(--text-color)]"
                        }`}
                      >
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Themes Management */}
          {activeTab === "custom" && (
            <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-1">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-[var(--label-color)]">
                  Custom Themes
                </Label>
                {showAddThemeInput ? (
                  <div className="flex gap-2 items-center">
                    <Input
                      className="h-8 text-xs px-2 py-1 bg-[var(--bg-color)] border-[var(--accent-color)] text-[var(--text-color)]"
                      value={newThemeName}
                      autoFocus
                      placeholder="Theme name"
                      onChange={(e) => setNewThemeName(e.target.value)}
                      onBlur={() => setShowAddThemeInput(false)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newThemeName.trim()) {
                          addCustomTheme(newThemeName.trim());
                          setShowAddThemeInput(false);
                          setNewThemeName("");
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (newThemeName.trim()) {
                          addCustomTheme(newThemeName.trim());
                        }
                        setShowAddThemeInput(false);
                        setNewThemeName("");
                      }}
                      className="h-8 w-8"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddThemeInput(true)}
                    className="h-8 px-3 text-xs border-[var(--accent-color)] text-[var(--accent-color)] hover:bg-[var(--accent-color)] hover:text-[var(--bg-color)]"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add
                  </Button>
                )}
              </div>

              <div className="space-y-2 max-h-32 overflow-y-auto">
                {customThemes.map((ct, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ${
                      selectedCustomTheme === idx
                        ? "bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20"
                        : "hover:bg-[var(--card-bg)]/50"
                    }`}
                  >
                    <button
                      className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all duration-200 ${
                        selectedCustomTheme === idx
                          ? "border-[var(--accent-color)] bg-[var(--accent-color)]"
                          : "border-[var(--border-color)] bg-[var(--card-bg)]"
                      }`}
                      style={{
                        background:
                          selectedCustomTheme === idx
                            ? "var(--accent-color)"
                            : ct.colors["--bg-color"],
                      }}
                      onClick={() => {
                        setSelectedCustomTheme(idx);
                        setTheme("custom");
                      }}
                      aria-label={`Select ${ct.label}`}
                    />

                    {renamingIdx === idx ? (
                      <Input
                        className="flex-1 h-7 text-xs px-2 py-1 bg-[var(--bg-color)] border-[var(--accent-color)] text-[var(--text-color)]"
                        value={renameValue}
                        autoFocus
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => {
                          setCustomThemeLabel(renameValue);
                          setRenamingIdx(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            setCustomThemeLabel(renameValue);
                            setRenamingIdx(null);
                          }
                        }}
                      />
                    ) : (
                      <span
                        className={`flex-1 text-sm truncate cursor-pointer transition-colors duration-200 ${
                          selectedCustomTheme === idx
                            ? "font-medium text-[var(--accent-color)]"
                            : "text-[var(--text-color)]"
                        }`}
                        onDoubleClick={() => {
                          setRenamingIdx(idx);
                          setRenameValue(ct.label);
                        }}
                        title="Double click to rename"
                      >
                        {ct.label}
                      </span>
                    )}

                    <button
                      className="p-1 rounded hover:bg-red-500/10 text-red-400 transition-colors duration-200"
                      style={{
                        visibility:
                          customThemes.length > 1 ? "visible" : "hidden",
                      }}
                      onClick={() => deleteCustomTheme(idx)}
                      title="Delete theme"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Color Customization */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-[var(--label-color)]">
                  Customize Colors
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {customColorFields.map(({ key, label }) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-xs text-[var(--label-color)]">
                        {label}
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={currentCustom.colors[key] || "#000000"}
                          onChange={(e) => {
                            setCustomThemeColors({ [key]: e.target.value });
                          }}
                          className="w-8 h-8 rounded-lg border-2 border-[var(--border-color)] cursor-pointer transition-all duration-200 hover:border-[var(--accent-color)] focus:border-[var(--accent-color)] focus:outline-none"
                          style={{
                            background: "none",
                          }}
                          aria-label={`Pick ${label} color`}
                        />
                        <span className="text-xs font-mono text-[var(--text-color)] bg-[var(--card-bg)] px-2 py-1 rounded">
                          {currentCustom.colors[key]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Theme Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-[var(--label-color)]">
                  Theme Type
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={currentCustom.isLightTheme || false}
                    onChange={(e) => {
                      setCustomThemes((themes) => {
                        const updated = [...themes];
                        updated[selectedCustomTheme] = {
                          ...updated[selectedCustomTheme],
                          isLightTheme: e.target.checked,
                        };
                        return updated;
                      });
                    }}
                    className="w-4 h-4 accent-[var(--accent-color)] rounded border-[var(--border-color)] focus:ring-2 focus:ring-[var(--accent-color)] focus:ring-offset-2"
                    id="light-theme-toggle"
                  />
                  <Label
                    htmlFor="light-theme-toggle"
                    className="text-sm text-[var(--text-color)] cursor-pointer select-none"
                  >
                    Light Theme
                  </Label>
                </div>
              </div>

              {/* Import/Export */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const config = exportThemeConfig({
                      theme,
                      customColors: currentCustom.colors,
                      radius,
                      useMaterialUI,
                      isLightTheme: currentCustom.isLightTheme || false,
                    });
                    const blob = new Blob([config], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `jportal-theme-${currentCustom.label
                      .replace(/\s+/g, "-")
                      .toLowerCase()}.config`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex-1 h-8 text-xs border-[var(--accent-color)] text-[var(--accent-color)] hover:bg-[var(--accent-color)] hover:text-[var(--bg-color)]"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const config = exportAllCustomThemes(customThemes);
                    const blob = new Blob([config], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `jportal-all-custom-themes.config`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex-1 h-8 text-xs border-[var(--accent-color)] text-[var(--accent-color)] hover:bg-[var(--accent-color)] hover:text-[var(--bg-color)]"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const fileInput = document.createElement("input");
                    fileInput.type = "file";
                    fileInput.accept = ".config,text/plain";
                    fileInput.style.display = "none";
                    fileInput.onchange = async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      try {
                        const text = await file.text();
                        // Try to extract author from file name if possible
                        let author = "";
                        if (file.name) {
                          // e.g. taf-jportal-themes.config or taf-jportal-theme.config
                          const match = file.name.match(
                            /^([^-]+)-jportal-theme/
                          );
                          if (match) author = match[1];
                        }
                        const importedThemes = importAllCustomThemes(text);
                        if (importedThemes.length > 0) {
                          setCustomThemes((prev) => [
                            ...prev,
                            ...importedThemes.map((theme) => ({
                              ...theme,
                              label: author
                                ? `${theme.label} (Community - ${author})`
                                : `${theme.label} (Community)`,
                            })),
                          ]);
                          setSelectedCustomTheme(customThemes.length); // select first of new
                          setTheme("custom");
                          return;
                        }
                        const parsed = importThemeConfig(text);
                        if (parsed["--bg-color"] || parsed["--primary-color"]) {
                          setCustomThemes((prev) => [
                            ...prev,
                            {
                              label: author
                                ? `${
                                    parsed.label ||
                                    `Imported Theme ${customThemes.length + 1}`
                                  } (Community - ${author})`
                                : `${
                                    parsed.label ||
                                    `Imported Theme ${customThemes.length + 1}`
                                  } (Community)`,
                              colors: Object.fromEntries(
                                Object.entries(parsed).filter(([k]) =>
                                  k.startsWith("--")
                                )
                              ),
                              isLightTheme: parsed.isLightTheme,
                            },
                          ]);
                          setSelectedCustomTheme(customThemes.length);
                          setTheme("custom");
                        }
                        if (parsed.radius) setRadius(Number(parsed.radius));
                        if (parsed.useMaterialUI)
                          setUseMaterialUI(parsed.useMaterialUI === "true");
                      } catch (error) {
                        console.error("Error importing theme:", error);
                      }
                      document.body.removeChild(fileInput);
                    };
                    document.body.appendChild(fileInput);
                    fileInput.click();
                  }}
                  className="flex-1 h-8 text-xs border-[var(--accent-color)] text-[var(--accent-color)] hover:bg-[var(--accent-color)] hover:text-[var(--bg-color)]"
                >
                  <Upload className="w-3 h-3 mr-1" />
                  Import
                </Button>
              </div>
            </div>
          )}

          {/* Community Themes */}
          {activeTab === "community" && (
            <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-1">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-[var(--label-color)]">
                  Community Themes
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadUserThemes}
                  disabled={isLoadingUserThemes}
                  className="h-8 px-3 text-xs border-[var(--accent-color)] text-[var(--accent-color)] hover:bg-[var(--accent-color)] hover:text-[var(--bg-color)]"
                >
                  <RefreshCw
                    className={`w-3 h-3 mr-1 ${
                      isLoadingUserThemes ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
              </div>

              {isLoadingUserThemes ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-[var(--accent-color)]" />
                  <span className="ml-2 text-sm text-[var(--text-color)]">
                    Loading themes...
                  </span>
                </div>
              ) : userThemes.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {userThemes.map((userTheme, idx) => (
                    <div
                      key={`${userTheme.source}-${idx}`}
                      className="p-3 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)]/30 hover:bg-[var(--card-bg)]/50 transition-all duration-200"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex-shrink-0 border-2 border-[var(--border-color)]"
                          style={{ background: userTheme.colors["--bg-color"] }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-[var(--text-color)] truncate">
                              {userTheme.label}
                            </span>
                            <Star className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                          </div>
                          <div className="text-xs text-[var(--label-color)] mb-2">
                            by {userTheme.author} • {userTheme.source}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Add to custom themes
                                const newTheme = {
                                  label: `${userTheme.label} (Community)`,
                                  colors: userTheme.colors,
                                };
                                setCustomThemes([...customThemes, newTheme]);
                                setSelectedCustomTheme(customThemes.length);
                                setTheme("custom");
                                setActiveTab("custom");
                              }}
                              className="h-6 px-2 text-xs border-[var(--accent-color)] text-[var(--accent-color)] hover:bg-[var(--accent-color)] hover:text-[var(--bg-color)]"
                            >
                              Add to Custom
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // Apply directly
                                setCustomThemeColors(userTheme.colors);
                                setTheme("custom");
                              }}
                              className="h-6 px-2 text-xs border-[var(--accent-color)] text-[var(--accent-color)] hover:bg-[var(--accent-color)] hover:text-[var(--bg-color)]"
                            >
                              Try Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 mx-auto text-[var(--label-color)] mb-2" />
                  <p className="text-sm text-[var(--text-color)] mb-2">
                    No community themes available
                  </p>
                  <p className="text-xs text-[var(--label-color)]">
                    Community themes will appear here when available
                  </p>
                </div>
              )}

              <div className="p-3 rounded-lg bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/20">
                <div className="flex items-start gap-2">
                  <Star className="w-4 h-4 text-[var(--accent-color)] mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-[var(--text-color)]">
                    <p className="font-medium mb-1">Want to contribute?</p>
                    <p className="text-[var(--label-color)] mb-2">
                      Create theme configs following the naming convention:
                    </p>
                    <div className="space-y-1">
                      <code className="block bg-[var(--card-bg)] px-2 py-1 rounded text-xs">
                        yourname-jportal-theme.config
                      </code>
                      <code className="block bg-[var(--card-bg)] px-2 py-1 rounded text-xs">
                        yourname-jportal-themes.config
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Corner Radius */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-[var(--label-color)]">
                Corner Radius
              </Label>
              <span className="text-xs font-mono text-[var(--text-color)] bg-[var(--card-bg)] px-2 py-1 rounded">
                {radius}px
              </span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={24}
                step={1}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="slider flex-1"
              />
            </div>
          </div>

          {/* Material UI Toggle */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--card-bg)]/50">
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-[var(--label-color)]" />
                <Label className="text-sm text-[var(--text-color)] cursor-pointer select-none">
                  Material UI Components
                </Label>
              </div>
              <MuiSwitch
                checked={useMaterialUI}
                onChange={(_, checked) => setUseMaterialUI(checked)}
                id="mui-toggle"
                sx={{
                  color: "var(--accent-color)",
                  "&.Mui-checked": {
                    color: "var(--accent-color)",
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "var(--accent-color)",
                  },
                }}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--card-bg)]/50">
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4 text-[var(--label-color)]" />
                <Label className="text-sm text-[var(--text-color)] cursor-pointer select-none">
                  Card Backgrounds
                </Label>
              </div>
              <MuiSwitch
                checked={useCardBackgrounds}
                onChange={(_, checked) => setUseCardBackgrounds(checked)}
                id="card-bg-toggle"
                sx={{
                  color: "var(--accent-color)",
                  "&.Mui-checked": {
                    color: "var(--accent-color)",
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "var(--accent-color)",
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
