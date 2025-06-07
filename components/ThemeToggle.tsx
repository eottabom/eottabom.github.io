'use client';

import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const cycleOrder = ['system', 'dark', 'light'] as const;
  type ThemeValue = typeof cycleOrder[number];

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const current = theme === 'system' ? systemTheme : theme;

  const getIcon = (mode: ThemeValue) => {
    switch (mode) {
      case 'system':
        return <Monitor className="w-5 h-5" />;
      case 'dark':
        return <Moon className="w-5 h-5" />;
      case 'light':
        return <Sun className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  const handleClick = () => {
    const currentIndex = cycleOrder.indexOf(theme as ThemeValue);
    const nextIndex = (currentIndex + 1) % cycleOrder.length;
    setTheme(cycleOrder[nextIndex]);
  };

  return (
    <button
      onClick={handleClick}
      className="p-2 rounded-md border border-gray-300 dark:border-gray-600 hover:border-blue-500 transition"
      aria-label="Toggle Theme"
    >
      {getIcon(theme as ThemeValue)}
    </button>
  );
}
