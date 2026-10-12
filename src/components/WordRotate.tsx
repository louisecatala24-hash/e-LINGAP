import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export interface WordRotateProps {
  words: string[];
  duration?: number;
  className?: string;
  containerClassName?: string;
  style?: React.CSSProperties;
}

export function WordRotate({
  words,
  className,
  containerClassName = "overflow-hidden",
  duration = 3000,
  style
}: WordRotateProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIndex((prev) => (prev === words.length - 1 ? 0 : prev + 1));
    }, duration);

    return () => clearTimeout(timeoutId);
  }, [index, words, duration]);

  return (
    <div className={containerClassName} style={style}>
      <AnimatePresence mode="wait">
        <motion.div
          key={words[index]}
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -25 }}
          transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
          className={className}
        >
          {words[index]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

