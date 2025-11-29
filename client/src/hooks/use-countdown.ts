import { useState, useEffect } from "react";

interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formattedTime: string;
  relativeTime: string;
}

export function useCountdown(targetDate: Date | null): CountdownResult {
  const [countdown, setCountdown] = useState<CountdownResult>(calculateCountdown(targetDate));

  useEffect(() => {
    if (!targetDate) return;

    const interval = setInterval(() => {
      setCountdown(calculateCountdown(targetDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return countdown;
}

function calculateCountdown(targetDate: Date | null): CountdownResult {
  if (!targetDate) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      formattedTime: "N/A",
      relativeTime: "Unknown"
    };
  }

  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      formattedTime: "Now",
      relativeTime: "Drawing now!"
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  let formattedTime = "";
  if (days > 0) {
    formattedTime = `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    formattedTime = `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    formattedTime = `${minutes}m ${seconds}s`;
  } else {
    formattedTime = `${seconds}s`;
  }

  let relativeTime = "";
  if (days > 0) {
    relativeTime = days === 1 ? "Tomorrow" : `In ${days} days`;
  } else if (hours > 0) {
    relativeTime = hours === 1 ? "In 1 hour" : `In ${hours} hours`;
  } else if (minutes > 0) {
    relativeTime = minutes === 1 ? "In 1 minute" : `In ${minutes} minutes`;
  } else {
    relativeTime = "Less than a minute";
  }

  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    formattedTime,
    relativeTime
  };
}

export function getNextDrawDate(drawDays: string[] | null, drawTime: string | null): Date | null {
  if (!drawDays || drawDays.length === 0 || !drawTime) {
    return null;
  }

  const dayMap: Record<string, number> = {
    "Sunday": 0,
    "Monday": 1,
    "Tuesday": 2,
    "Wednesday": 3,
    "Thursday": 4,
    "Friday": 5,
    "Saturday": 6
  };

  const now = new Date();
  const sastOffset = 2 * 60;
  const localOffset = now.getTimezoneOffset();
  const sastNow = new Date(now.getTime() + (sastOffset + localOffset) * 60000);
  
  const [hours, minutes] = drawTime.split(":").map(Number);
  const currentDay = sastNow.getDay();
  const currentHour = sastNow.getHours();
  const currentMinute = sastNow.getMinutes();

  const drawDayNumbers = drawDays
    .map(day => dayMap[day])
    .filter(num => num !== undefined)
    .sort((a, b) => a - b);

  if (drawDayNumbers.length === 0) {
    return null;
  }

  let daysUntilDraw = 7;
  
  for (const drawDay of drawDayNumbers) {
    let diff = drawDay - currentDay;
    if (diff < 0) diff += 7;
    
    if (diff === 0) {
      if (currentHour < hours || (currentHour === hours && currentMinute < minutes)) {
        daysUntilDraw = 0;
        break;
      }
    } else if (diff < daysUntilDraw) {
      daysUntilDraw = diff;
    }
  }

  if (daysUntilDraw === 7) {
    daysUntilDraw = (drawDayNumbers[0] - currentDay + 7) % 7;
    if (daysUntilDraw === 0) daysUntilDraw = 7;
  }

  const nextDrawDate = new Date(sastNow);
  nextDrawDate.setDate(nextDrawDate.getDate() + daysUntilDraw);
  nextDrawDate.setHours(hours, minutes, 0, 0);

  const utcNextDraw = new Date(nextDrawDate.getTime() - (sastOffset + localOffset) * 60000);

  return utcNextDraw;
}
