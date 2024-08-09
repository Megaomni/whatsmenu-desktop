import React, { ComponentProps } from "react"
import { twMerge } from "tailwind-merge";

export interface ProgressCircleProps extends ComponentProps<"div"> {
  progress: number;
}

export function ProgressCircle({ progress, ...props }: ProgressCircleProps) {
  // Comprimento total do círculo (circunferência)
  const totalCircumference = 2 * Math.PI * 40; // 2 * π * raio (40)
  
  // Calculando strokeDashoffset
  const strokeDashoffset = totalCircumference - (totalCircumference * progress) / 100
  
  return (
    <svg className="w-full h-full " viewBox="0 0 100 100">
      <circle
        className="text-gray-200 stroke-current"
        strokeWidth="4"
        cx="50"
        cy="50"
        r="40"
        fill="transparent"
      ></circle>

      <circle
        className={twMerge("progress-ring__circle stroke-current", props.className)}
        strokeWidth="4"
        strokeLinecap="round"
        cx="50"
        cy="50"
        r="40"
        fill="transparent"
        strokeDasharray={totalCircumference}
        strokeDashoffset={strokeDashoffset}
      ></circle>
      <text
        x="50%"       
        y="50%"       
        dominantBaseline="middle"
        textAnchor="middle"
        className={twMerge("stroke-current fill-current", props.className)}

      >{progress}%</text>
    </svg>
  );
}
