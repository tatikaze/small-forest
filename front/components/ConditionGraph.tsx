import type React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { format } from "date-fns";
import { getTokyoDate } from "~/lib/format";

import type { Condition } from "~/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type Props = {
  conditions: Condition[] | undefined;
  title: string;
};

export const ConditionGraph: React.FC<Props> = (props: Props) => {
  const temperatures: number[] =
    props.conditions?.map((condition) => condition.temperature) ?? [];
  const humidities: number[] =
    props.conditions?.map((condition) => condition.humidity) ?? [];
  const label_leng: string[] =
    props.conditions?.map((condition) => {
      return format(getTokyoDate(new Date(condition.created_at)), "dd日HH:mm");
    }) ?? [];

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: props.title ?? "",
      },
    },
    scales: {
      x: {},
    },
  };

  const data = {
    labels: label_leng,
    datasets: [
      {
        label: "湿度",
        data: humidities,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
      {
        label: "温度",
        data: temperatures,
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
    ],
  };

  return <Line options={options} data={data} />;
};
