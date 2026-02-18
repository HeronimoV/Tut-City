"use client";

import { useState, useEffect } from "react";

export default function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "granted") { setGranted(true); return; }
    if (Notification.permission === "denied") return;
    if (localStorage.getItem("notif-dismissed")) return;

    // Show after 3rd solve
    const totalSolves = parseInt(localStorage.getItem("total-solves-count") || "0", 10);
    if (totalSolves >= 3) setShow(true);
  }, []);

  if (!show || granted) return null;

  const handleEnable = async () => {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setGranted(true);
      setShow(false);
      // Tell service worker to schedule reminders
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready;
        reg.active?.postMessage({ type: "SCHEDULE_STREAK_REMINDER" });
      }
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("notif-dismissed", "1");
  };

  return (
    <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-2xl p-4 mb-4 animate-slide-up">
      <div className="flex items-center justify-between gap-3">
        <p className="text-white font-semibold text-sm flex-1">
          🔔 Get reminders to keep your streak alive?
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleEnable}
            className="bg-white text-orange-600 font-bold text-sm px-4 py-2 rounded-xl hover:bg-orange-50 transition active:scale-95"
          >
            Enable
          </button>
          <button onClick={handleDismiss} className="text-white/70 hover:text-white text-lg leading-none">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
