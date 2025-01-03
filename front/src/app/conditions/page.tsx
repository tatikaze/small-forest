"use client";
import type { FC } from "react";
import Head from "next/head";
import { Box, Flex } from "@chakra-ui/react";

import { useDeviceCondition } from "~/hooks/device_condition";

import { Title } from "~/components/Title";
import { ConditionGraph } from "~/components/ConditionGraph";

const ConditionDetailPage: FC = () => {
  const { conditions, loading } = useDeviceCondition();
  return (
    <Flex flexDir="column" alignItems="center">
      <Head>
        <title>ConditionHistory</title>
      </Head>
      <Flex
        flexDir="column"
        justifyContent="center"
        alignItems="center"
        w="full"
        mx={8}
        px={2}
        my={8}
      >
        <Title />
        <Box
          minW={{ sm: "500px", md: "700px" }}
          maxW={{ sm: "500px", md: "1000px" }}
          h="full"
          my={8}
        >
          {!loading && conditions ? (
            <ConditionGraph conditions={conditions} title={"過去2時間"} />
          ) : null}
        </Box>
      </Flex>
    </Flex>
  );
};

export default ConditionDetailPage;
