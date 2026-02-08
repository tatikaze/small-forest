"use client";
import { useState } from "react";
import { chakra, Icon, Flex } from "@chakra-ui/react";
import { BsMoonStars } from "react-icons/bs";
import { motion } from "framer-motion";

export const Title = () => {
  const [hover, setHover] = useState(true);

  return (
    <chakra.h1 color="gray.700" fontWeight="semibold" fontSize="4xl">
      <motion.div
        onHoverStart={() => {
          setHover(true);
        }}
        onHoverEnd={() => setHover(false)}
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
                setHover(true);
              }}
              onHoverEnd={() => setHover(false)}
            >
              Welcome to{" "}
              <chakra.a
                color="#FF751D"
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
