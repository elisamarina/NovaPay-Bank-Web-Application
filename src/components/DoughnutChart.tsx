"use client";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const DoughnutChart = ({ accounts }: DoughnutChartProps) => {
  const hasAccounts = accounts.length > 0;
  const accountNames = hasAccounts
    ? accounts.map((account) => account.name)
    : ["No connected accounts"];
  const balances = hasAccounts
    ? accounts.map((account) => account.currentBalance)
    : [1];

  const data = {
    datasets: [
      {
        label: "Banks",
        data: balances,
        backgroundColor: hasAccounts
          ? ["#FF6384", "#36A2EB", "#FFCE56"]
          : ["#334155"],
      },
    ],
    labels: accountNames,
  };
  return (
    <Doughnut
      data={data}
      options={{
        cutout: "60%",
        plugins: {
          legend: {
            display: false,
          },
        },
      }}
    />
  );
};

export default DoughnutChart;
