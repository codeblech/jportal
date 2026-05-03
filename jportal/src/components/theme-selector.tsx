import { defaultPresets } from "../utils/theme-presets";
import { useThemeStore } from "../stores/theme-store";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { useHaptics } from "../hooks/useHaptics";

interface ThemeSelectorProps {
  className?: string;
}

export function ThemeSelector({ className }: ThemeSelectorProps) {
  const { themeState, setThemeState } = useThemeStore();
  const haptics = useHaptics();

  const handleThemeSelect = (presetKey: string) => {
    const preset = defaultPresets[presetKey];
    if (!preset) return;

    haptics.success();
    setThemeState({
      ...themeState,
      preset: presetKey,
      styles: {
        light: { ...preset.styles.light } as any,
        dark: { ...preset.styles.dark } as any,
      },
    });
  };

  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4", className)}>
      {Object.entries(defaultPresets)
        .sort(([keyA, a], [keyB, b]) => (keyA || a.label || "").localeCompare(keyB || b.label || ""))
        .map(([key, preset]) => (
          <Button
            key={key}
            variant={themeState.preset === key ? "default" : "outline"}
            className={cn("h-auto flex-col gap-2 p-3", themeState.preset === key && "bg-primary/80")}
            onClick={() => handleThemeSelect(key)}
          >
            <div className="flex h-6 w-full gap-1">
              <div
                className="h-full w-1/3 border-1 rounded-l-sm"
                style={{
                  backgroundColor: preset.styles.light.primary || "#ffffff",
                }}
              />
              <div
                className="h-full w-1/3 border-1"
                style={{
                  backgroundColor: preset.styles.light.accent || "#000000",
                }}
              />
              <div
                className="h-full w-1/3 border-1"
                style={{
                  backgroundColor: preset.styles.light.secondary || "#000000",
                }}
              />
              <div
                className="h-full w-1/3 border-1 rounded-r-sm"
                style={{
                  backgroundColor: preset.styles.light.border || "#000000",
                }}
              />
            </div>
            <span className="text-xs font-medium text-center">{preset.label || key}</span>
          </Button>
        ))}
    </div>
  );
}
