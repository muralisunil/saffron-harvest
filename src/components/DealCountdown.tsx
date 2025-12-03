import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface DealCountdownProps {
  endTime: Date;
  label?: string;
}

const DealCountdown = ({ endTime, label = "Deal ends in" }: DealCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = endTime.getTime() - new Date().getTime();
    
    if (difference <= 0) {
      return { hours: 0, minutes: 0, seconds: 0, expired: true };
    }

    return {
      hours: Math.floor(difference / (1000 * 60 * 60)),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      expired: false,
    };
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (timeLeft.expired) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Clock className="h-4 w-4" />
        <span>Deal expired</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Clock className="h-4 w-4 text-primary" />
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <TimeBlock value={timeLeft.hours} label="h" />
        <span className="text-primary font-bold">:</span>
        <TimeBlock value={timeLeft.minutes} label="m" />
        <span className="text-primary font-bold">:</span>
        <TimeBlock value={timeLeft.seconds} label="s" />
      </div>
    </div>
  );
};

const TimeBlock = ({ value, label }: { value: number; label: string }) => (
  <div className="flex items-baseline">
    <span className="bg-primary/10 text-primary font-bold px-2 py-1 rounded text-sm min-w-[32px] text-center">
      {value.toString().padStart(2, "0")}
    </span>
    <span className="text-xs text-muted-foreground ml-0.5">{label}</span>
  </div>
);

export default DealCountdown;
