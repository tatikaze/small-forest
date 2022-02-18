import { Flex, Icon, Text } from "@chakra-ui/react";
import { FaTemperatureHigh } from "react-icons/fa";
import { WiHumidity } from "react-icons/wi";

import { format } from "date-fns";
import { getTokyoDate } from '~/lib/format'

import type { Condition } from "~/types";

type Props = {
  condition: Condition;
};

export const ConditionStat: React.FC<Props> = (props: Props) => {
  return (
    <Flex
      flexDir="column"
      p={4}
      border={1}
      borderStyle="solid"
      borderColor={"gray.200"}
      rounded="md"
    >
      <Flex flexDir="row" mr={2}>
        <Flex mx={2} flexDir="column" alignItems="flex-start">
          <Flex alignItems="center" mx={2}>
            <Icon as={FaTemperatureHigh} mx={1} />
            温度
          </Flex>
          <Text fontSize="2xl" ml={4}>
            {props.condition.temperature}℃
          </Text>
        </Flex>
        <Flex mx={2} flexDir="column" alignItems="flex-start">
          <Flex alignItems="center" mx={2}>
            <Icon as={WiHumidity} h="1.3rem" w="1.3rem" />
            湿度
          </Flex>
          <Text fontSize="2xl" ml={4}>
            {props.condition.humidity}%
          </Text>
        </Flex>
      </Flex>
      <Text fontSize="sm" textColor="gray.500" textAlign="right" mx={4}>
        {format(getTokyoDate(new Date(props.condition.created_at)), "yyyy/MM/dd HH:mm:ss")}
      </Text>
    </Flex>
  );
};
