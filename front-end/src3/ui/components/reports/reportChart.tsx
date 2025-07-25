import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ChartConfig {
  labelKey: string;
  dataKey: string;
  datasetLabel: string;
}

interface ReportChartProps {
  data: any[];
  chartConfig: ChartConfig;
}

const ReportChart: React.FC<ReportChartProps> = ({ data, chartConfig }) => {
  if (!chartConfig) {
    return null;
  }

  const chartLabels = data.map(item => item[chartConfig.labelKey]);
  const chartDataPoints = data.map(item => item[chartConfig.dataKey]);

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: chartConfig.datasetLabel,
        data: chartDataPoints,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Gráfico: ${chartConfig.datasetLabel}`,
        font: {
          size: 16
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ position: 'relative', height: '400px', width: '100%', marginTop: '2rem' }}>
      <Bar options={options} data={chartData} />
    </div>
  );
};

export default ReportChart;