import { useMemo } from "react";
import { Flex, Icon, Text, Skeleton } from "@chakra-ui/react";
import Link from "next/link";
import { FaTemperatureHigh } from "react-icons/fa";
import { AiOutlineArrowRight, AiOutlineReload } from "react-icons/ai";
import { WiHumidity } from "react-icons/wi";
import { motion } from "framer-motion";

import { format } from "date-fns";
import { getTokyoDate } from "~/lib/format";
import { pagesPath } from "~/lib/$path";

import type { Condition } from "~/types";

type Props = {
  condition: Condition | undefined;
  mutate: () => void;
  loading: boolean;
  revalidating: boolean;
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
      <Flex flexDir="row" alignItems="center" mb={2} textColor="gray.500">
        {props.loading ? (
          <Skeleton w={40} h="1.4rem" />
        ) : (
          <Text fontSize="sm" textAlign="left">
            {props.condition
              ? format(
                  getTokyoDate(new Date(props.condition?.created_at)),
                  "yyyy/MM/dd HH:mm:ss"
                )
              : null}
          </Text>
        )}
        <Flex flexGrow={1} justifyContent="flex-end" mr={1}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2 }}
            key={props.revalidating ? "validate" : null}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon
              as={AiOutlineReload}
              onClick={() => props.mutate()}
              textColor="gray.700"
              h={4}
              w={4}
            />
          </motion.div>
        </Flex>
      </Flex>
      <Flex flexDir="row" mr={2}>
        <Flex mx={2} flexDir="column" alignItems="flex-start">
          <Flex alignItems="center" mx={2}>
            <Icon as={FaTemperatureHigh} mx={1} />
            温度
          </Flex>
          {props.loading ? (
            <Skeleton w={20} h="2.4rem" />
          ) : (
            <Text fontSize="2xl" ml={4}>
              {props.condition ? props.condition.temperature : null}℃
            </Text>
          )}
        </Flex>
        <Flex mx={2} flexDir="column" alignItems="flex-start">
          <Flex alignItems="center" mx={2}>
            <Icon as={WiHumidity} h="1.3rem" w="1.3rem" />
            湿度
          </Flex>
          {props.loading ? (
            <Skeleton w={20} h="2.4rem" />
          ) : (
            <Text fontSize="2xl" ml={4}>
              {props.condition ? props.condition.humidity : null}%
            </Text>
          )}
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
