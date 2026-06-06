"use client";

import { ArcElement, Chart as ChartJS, Legend, Tooltip } from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

const chartColors = ["#6b2fa0", "#8d5ab3", "#b195c9", "#d4c4e3", "#eee8f5"];

const DoughnutChart = ({ accounts }: DoughnutChartProps) => {
  const hasAccounts = accounts.length > 0;
  const positiveBalances = accounts.map((account) =>
    Math.max(account.currentBalance, 0),
  );
  const totalBalance = positiveBalances.reduce(
    (total, balance) => total + balance,
    0,
  );
  const chartAccounts = hasAccounts
    ? accounts.slice(0, 5)
    : ([
        {
          id: "empty",
          name: "No accounts",
          currentBalance: 1,
        },
      ] as Account[]);
  const balances = hasAccounts
    ? totalBalance > 0
      ? positiveBalances.slice(0, 5)
      : chartAccounts.map(() => 1)
    : [1];
  const balanceTotal = balances.reduce((total, balance) => total + balance, 0);
  const labels = chartAccounts.map((account, index) => ({
    id: account.id,
    name: account.name,
    color: hasAccounts ? chartColors[index % chartColors.length] : "#64748b",
    percentage:
      hasAccounts && totalBalance > 0
        ? Math.round((balances[index] / balanceTotal) * 100)
        : 0,
  }));

  return (
    <div className="flat-pie-wrap">
      <Pie
        data={{
          labels: labels.map((label) => label.name),
          datasets: [
            {
              label: "Balance",
              data: balances,
              backgroundColor: hasAccounts ? chartColors : ["#334155"],
              borderColor: "rgba(15, 23, 42, 0.12)",
              borderWidth: 1,
              hoverOffset: 6,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          rotation: 0,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const label = labels[context.dataIndex];
                  return `${label.name}: ${label.percentage}%`;
                },
              },
            },
          },
        }}
      />

      {labels.slice(0, 5).map((label, index) => {
        const previousTotal = balances
          .slice(0, index)
          .reduce((total, balance) => total + balance, 0);
        const middleValue = previousTotal + balances[index] / 2;
        const angle = -90 + (middleValue / balanceTotal) * 360;
        const radians = (angle * Math.PI) / 180;
        const radius = 24;
        const left = 50 + Math.cos(radians) * radius;
        const top = 50 + Math.sin(radians) * radius;

        return (
          <div
            key={label.id}
            className="flat-pie-label"
            style={{
              left: `${left}%`,
              top: `${top}%`,
            }}
          >
            <strong>{label.percentage}%</strong>
            <span>{label.name}</span>
          </div>
        );
      })}
    </div>
  );
};

export default DoughnutChart;
