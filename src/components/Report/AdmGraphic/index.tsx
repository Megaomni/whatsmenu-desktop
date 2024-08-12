import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { Month } from "../../../pages/adm/report/registers";
import { DateTime } from "luxon";
import { AdmReports } from "../../../pages/adm/report/financial";
import { Seller } from "next-auth";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ReportAdmGraphicProps {
  type: "client" | "support" | "seller";
  period: "monthly" | "yearly";
  months?: string[];
  sellers?: Seller[];
  reports?: AdmReports;
}

export function ReportAdmGraphic({
  type,
  period,
  months,
  sellers,
  reports,
}: ReportAdmGraphicProps) {
  const colors = [
    "#ff6384",
    "#36a2ea",
    "#ffce57",
    "#4bc0c0",
    "#9966ff",
    "#ff9f40",
  ];

  const days: string[] = [];

  let day = DateTime.local();

  while (day.toFormat("yyyy-MM-dd") !== day.toFormat("yyyy-MM-01")) {
    days.unshift(day.toFormat("yyyy-MM-dd"));
    day = day.minus({ days: 1 });
  }
  days.unshift(day.toFormat("yyyy-MM-01"));

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  };

  let datasets: any[] = [],
    labels: any[] = [];

  if (type === "client" && reports) {
    labels = months ?? [];
    datasets = [
      {
        label: "Cadastros",
        data: months?.map((month) => reports.registers[month].length),
        backgroundColor: months?.map(() => colors[3]),
      },
      {
        label: "Mensalidades",
        data: months?.map((month) => reports.mensalities[month].length),
        backgroundColor: months?.map(() => colors[4]),
      },
      {
        label: "Upgrades",
        data: months?.map((month) => reports.upgrades[month].length),
        backgroundColor: months?.map(() => colors[2]),
      },
      {
        label: "Cancelamentos",
        data: months?.map((month) => reports.canceleds[month].length),
        backgroundColor: months?.map(() => colors[0]),
      },
    ];
  }

  if (type === "support" && reports) {
    labels = months ?? [];
    datasets = [
      {
        label: 'Ativos',
        data: months?.map(month => reports[month].paids.length),
        backgroundColor: months?.map(() => colors[3]),
      },
      {
        label: 'Ativos com atraso',
        data: months?.map(month => reports[month].paidLates.length),
        backgroundColor: months?.map(() => colors[4]),
      },
      {
        label: 'Cancelamentos',
        data: months?.map(month => reports[month].canceleds.length),
        backgroundColor: months?.map(() => colors[0]),
      }
    ]
  }

  if (type === "seller") {
    if (period === "monthly") {
      labels = days;
      sellers?.forEach((seller, index) => {
        const data = days.map((day) => {
          if (seller.months) {
            return seller.months[seller.months.length - 1]?.users.filter(
              (u: any) => {
                if (u.controls.disableInvoice) {
                  return u.created_at.includes(day);
                } else {
                  return u.invoices[0].updated_at.includes(day);
                }
              }
            ).length;
          }
        });
        datasets.push({
          label: seller.name,
          data,
          backgroundColor: colors[index],
        });
      });
    }

    if (period === "yearly") {
      labels = months ?? [];
      sellers?.forEach((seller, index) => {
        const data = months?.map(
          (day) =>
            seller.months
              ?.find((m) => m.month === day)
              ?.users.filter((u: any) => {
                if (u.controls.disableInvoice) {
                  return u.created_at.includes(day);
                } else {
                  return u.invoices[0].updated_at.includes(day);
                }
              }).length
        );
        datasets.push({
          label: seller.name,
          data,
          backgroundColor: colors[index],
        });
      });
    }
  }

  const data = {
    labels,
    datasets,
  };
  return <Bar options={options} data={data} style={{ maxHeight: "18rem" }} />;
}
