import React from 'react'
import { motion } from 'framer-motion'

const base = 'relative inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-wide transition-colors duration-300 disabled:opacity-40 disabled:pointer-events-none'

const variants = {
  primary: 'btn-glow text-white px-8 py-3.5 border border-white/10',
  ghost: 'bg-white/5 hover:bg-white/10 text-white px-7 py-3 border border-white/10 backdrop-blur-xl',
  outline: 'bg-transparent hover:bg-white/5 text-white px-7 py-3 border border-white/20',
}

const GlowButton = ({ children, variant = 'primary', className = '', as: Component = motion.button, ...props }) => {
  return (
    <Component
      whileHover={{ scale: 1.035, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}

export default GlowButton
