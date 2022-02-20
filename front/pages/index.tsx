import type { NextPage } from "next";
import Head from "next/head";
import { Flex, Box } from "@chakra-ui/react";
import { TwitterTimelineEmbed } from "react-twitter-embed";

import { useDeviceCondition } from "~/hooks/device_condition";

import { ConditionStat } from "~/components/ConditionStat";
import { Title } from "~/components/Title";

const Home: NextPage = () => {
  const { now, loading, mutate, revalidating } = useDeviceCondition();
  return (
    <Flex flexDir="column" alignItems="center">
      <Head>
        <title>Welcome Smafore</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
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
        <Box mt={8} mb={4}>
          <ConditionStat
            condition={now}
            mutate={mutate}
            loading={loading}
            revalidating={revalidating}
          />
        </Box>
        <Flex rounded="md" shadow="xs">
          <TwitterTimelineEmbed
            onLoad={function noRefCheck() {}}
            options={{
              height: 400,
            }}
            screenName="Met_Komori"
            sourceType="profile"
          />
        </Flex>
      </Flex>
    </Flex>
  );
};

export default Home;
