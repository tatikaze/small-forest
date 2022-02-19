import { Flex, Icon, Text } from "@chakra-ui/react";
import Link from "next/link";
import { FaTemperatureHigh } from "react-icons/fa";
import { AiOutlineArrowRight } from "react-icons/ai";
import { WiHumidity } from "react-icons/wi";

import { format } from "date-fns";
import { getTokyoDate } from "~/lib/format";
import { pagesPath } from "~/lib/$path";

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
      <Text fontSize="sm" textColor="gray.500" textAlign="left" mb={2}>
        {format(
          getTokyoDate(new Date(props.condition.created_at)),
          "yyyy/MM/dd HH:mm:ss"
        )}
      </Text>
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
      <Link href={pagesPath.conditions.$url()}>
        <Flex
          flexDir="row"
          justifyContent="flex-end"
          alignItems="center"
          px={2}
          py={1}
          mt={1}
          _hover={{ textDecoration: "underline" }}
        >
          <Text textAlign="right" userSelect="none">
            View Detail
          </Text>
          <Icon as={AiOutlineArrowRight} mx={1} />
        </Flex>
      </Link>
    </Flex>
  );
};
