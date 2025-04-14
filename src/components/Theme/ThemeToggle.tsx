import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { themeChange } from "theme-change";

const ThemeToggle = () => {
    const [theme, setTheme] = useState<string>(localStorage.getItem('theme') || 'light');

    useEffect(() => {
        // Initialize theme-change
        themeChange(false);

        // Set initial theme based on localStorage or system preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
            setTheme(savedTheme);
        } else {
            // Check system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const initialTheme = prefersDark ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', initialTheme);
            localStorage.setItem('theme', initialTheme);
            setTheme(initialTheme);
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    return (
        <div className="tooltip tooltip-bottom" data-tip={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}>
            <button
                onClick={toggleTheme}
                className="btn btn-ghost btn-circle hover:bg-base-200 transition-colors duration-300"
                aria-label="Toggle theme"
            >
                <div className="relative w-6 h-6 flex items-center justify-center">
                    {/* Sun icon */}
                    <div
                        className={`absolute transform transition-all duration-500 ease-in-out ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`}
                    >
                        <Sun size={24} />
                    </div>

                    {/* Moon icon */}
                    <div
                        className={`absolute transform transition-all duration-500 ease-in-out ${theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}
                    >
                        <Moon size={24} />
                    </div>
                </div>
            </button>
        </div>
    );
};

export default ThemeToggle;