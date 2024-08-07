import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ReportGraphicsProps {
  type: "monthly" | "yearly";
  monthly?: any;
  yearly?: any;
}

export function ReportGraphics({ type, yearly, monthly }: ReportGraphicsProps) {
  const options = {
    responsive: true,
  };

  if (monthly || yearly) {
    const labels =
      type === "monthly"
        ? monthly?.dates
        : yearly?.dates
  
    const data = {
      labels,
      datasets: [
        {
          label: "Faturamento",
          lineTension: 0.3,
          data: [
            ...(type === "monthly" ? monthly : yearly)?.values
          ],
          fill: true,
          borderColor: "#43b04a",
          backgroundColor: "#43b04a80",
        },
      ],
    };
    return <Line options={options} data={data} style={{ maxHeight: "18rem" }} />;
  }
  return null
}
