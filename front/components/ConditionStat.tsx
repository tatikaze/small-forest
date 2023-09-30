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
      rounded="lg"
      w="full"
      gap={2}
    >
      <Flex flexDir="row" alignItems="center" mb={2} textColor="gray.500">
        {props.loading ? (
          <Skeleton>
            <Text fontSize="sm">yyyy/MM/dd HH:mm:ss</Text>
          </Skeleton>
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
      <Flex flexDir="row" mr={2} justifyContent="space-evenly">
        <Flex mx={2} flexDir="column" alignItems="flex-start">
          <Flex alignItems="center" mx={2}>
            <Icon as={FaTemperatureHigh} mx={1} />
            温度
          </Flex>
          {props.loading ? (
            <Skeleton>
              <Text fontSize="2xl" ml={4}>
                00.0℃
              </Text>
            </Skeleton>
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
            <Skeleton>
              <Text fontSize="2xl" ml={4}>
                00.0%
              </Text>
            </Skeleton>
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
