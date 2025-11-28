import { cn } from "@/lib/utils";

interface LotteryBallProps {
  number: number;
  isBonus?: boolean;
  size?: "sm" | "md" | "lg";
}

export function LotteryBall({ number, isBonus = false, size = "md" }: LotteryBallProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-10 h-10 md:w-12 md:h-12 text-base md:text-lg",
    lg: "w-12 h-12 md:w-14 md:h-14 text-lg md:text-xl",
  };

  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-mono font-bold text-white shadow-md",
        sizeClasses[size],
        isBonus 
          ? "bg-lottery-ball-bonus" 
          : "bg-lottery-ball-main"
      )}
      data-testid={`lottery-ball-${number}${isBonus ? "-bonus" : ""}`}
    >
      {number.toString().padStart(2, "0")}
    </div>
  );
}
