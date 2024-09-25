"use client";

import { useState, useEffect } from "react";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";

interface OrderProps {
  orderId: number;
  isVIP: boolean;
  cookingTime: number; // Total time to process the order (in seconds)
  onComplete: () => void;
}

export const Order = ({
  orderId,
  isVIP,
  cookingTime,
  onComplete,
}: OrderProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          onComplete(); // Notify when order is complete
          return 100;
        }
        return prev + 100 / cookingTime; // Update every second
      });
    }, 1000);

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [cookingTime, onComplete]);

  return (
    <div className="order">
      <span>
        Order #{orderId} {isVIP && <Badge>VIP</Badge>}
      </span>
      <Progress value={progress} />
    </div>
  );
};
