"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      setCurrentDate(now.toLocaleDateString("en-US", options));
    };

    updateDate();
    const interval = setInterval(updateDate, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-slate-900 dark:text-white">
          Hello World
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-light">
          Welcome to our Hello World website
        </p>
        {currentDate && (
          <time className="block text-sm text-slate-500 dark:text-slate-400 mt-4">
            {currentDate}
          </time>
        )}
      </div>
    </main>
  );
}
