import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import { Flex, Box } from "@chakra-ui/react";

import { useDeviceCondition } from "~/hooks/device_condition";

import { ConditionGraph } from "~/components/ConditionGraph";
import { ConditionStat } from "~/components/ConditionStat";

const Home: NextPage = () => {
  const { conditions, now, loading, error } = useDeviceCondition();
  return (
    <div className={styles.container}>
      <Head>
        <title>Welcome Smafore App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Flex
        flex={1}
        flexDir="column"
        justifyContent="center"
        alignItems="center"
        mx={8}
        px={2}
	my={8}
      >
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Smafore</a>
        </h1>
        <Box mt={8} mb={4}>
          {!loading && now ? <ConditionStat condition={now} /> : null}
        </Box>
        {!loading && conditions ? (
          <ConditionGraph conditions={conditions} title={"過去2時間"} />
        ) : null}
      </Flex>
    </div>
  );
};

export default Home;
