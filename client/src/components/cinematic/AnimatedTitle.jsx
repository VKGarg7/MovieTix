import React from 'react'
import { motion } from "framer-motion";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.14, delayChildren: 0.1 },
  },
}

const word = {
  hidden: { opacity: 0, y: 40, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
}

const AnimatedTitle = ({ text, className = '', gradientLastWord = false }) => {
  const words = text.split(' ')

  return (
    <motion.h1 variants={container} initial="hidden" animate="show" className={className}>
      {words.map((w, i) => {
        const isLast = i === words.length - 1
        return (
          <motion.span
            key={`${w}-${i}`}
            variants={word}
            className={`inline-block mr-[0.28em] ${gradientLastWord && isLast ? 'gradient-text' : ''}`}
          >
            {w}
          </motion.span>
        )
      })}
    </motion.h1>
  )
}

export default AnimatedTitle
