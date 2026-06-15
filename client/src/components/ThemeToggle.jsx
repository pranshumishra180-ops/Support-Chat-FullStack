import { useTheme } from "./ThemeProvider";

function ThemeToggle() {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {isDarkMode ? "☀" : "☾"}
    </button>
  );
}

export default ThemeToggle;
