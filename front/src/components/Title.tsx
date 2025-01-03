"use client";
import { chakra, Icon, Flex, useBoolean } from "@chakra-ui/react";
import { BsMoonStars } from "react-icons/bs";
import { motion } from "framer-motion";

export const Title = () => {
  const [hover, setHover] = useBoolean(true);

  return (
    <chakra.h1 color="gray.700" fontWeight="semibold" fontSize="4xl">
      <motion.div
        onHoverStart={() => {
          setHover.on();
        }}
        onHoverEnd={() => setHover.off()}
      >
        <Flex flexDir="row" alignItems="center" justifyContent="center" px={4}>
          <motion.div
            transition={{ duration: 1 }}
            animate={{ rotate: hover ? [0, 20, -18, 0] : 0 }}
            key={hover ? "move" : null}
            style={{ display: "flex", alignItems: "center" }}
          >
            <Icon as={BsMoonStars} mx={4} />
          </motion.div>
          <Flex px={2}>
            <motion.div
              onHoverStart={() => {
                setHover.on();
              }}
              onHoverEnd={() => setHover.off()}
            >
              Welcome to{" "}
              <chakra.a
                textColor="#FF751D"
                href="https://www.youtube.com/channel/UCzUNASdzI4PV5SlqtYwAkKQ"
              >
                Smafore
              </chakra.a>
            </motion.div>
          </Flex>
        </Flex>
      </motion.div>
    </chakra.h1>
  );
};
