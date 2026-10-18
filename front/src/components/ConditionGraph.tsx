import type React from "react";
import { Flex, Text, Icon } from "@chakra-ui/react";
import { FaGhost } from "react-icons/fa";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { formatInTimeZone } from "date-fns-tz";

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
  const temperatures = props.conditions?.map(condition => ({ x: condition.created_unix, y: condition.temperature })) ?? [];
  const humidities = props.conditions?.map(condition => ({ x: condition.created_unix, y: condition.humidity })) ?? [];

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: props.title ?? "",
      },
      tooltip: {
        callbacks: {
          title: (items: TooltipItem<"line">[]) => items[0]?.parsed.x != null
            ? formatInTimeZone(items[0].parsed.x, "Asia/Tokyo", "yyyy/MM/dd HH:mm 'JST'") : "",
        },
      },
    },
    scales: {
      x: {
        type: "linear" as const,
        ticks: {
          maxTicksLimit: 8,
          callback: (value: string | number) => formatInTimeZone(Number(value), "Asia/Tokyo", "MM/dd HH:mm"),
        },
      },
    },
  };

  const data = {
    datasets: [
      {
        label: "湿度（%）",
        data: humidities,
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
      {
        label: "温度（℃）",
        data: temperatures,
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
    ],
  };

  if (props.conditions === undefined || props.conditions.length === 0) {
    return (
      <Flex flexDir="column" alignItems="center" >
        <Flex flexDir="row" alignItems="center" p={8}>
          <Icon h={6} w={6} as={FaGhost} mx={2} />
          <Text color="gray.700" textAlign="center">
            指定した期間のデータはありません
          </Text>
        </Flex>
      </Flex>
    );
  }

  return <Line options={options} data={data} />;
};
