import React from 'react'
import { motion } from 'framer-motion'

const GlassPanel = ({
  children,
  className = '',
  hover = true,
  glow = false,
  as: Component = motion.div,
  ...props
}) => {
  return (
    <Component
      className={`glass-panel ${hover ? 'glass-panel-hover' : ''} ${glow ? 'shadow-[0_0_80px_-20px_rgba(248,69,101,0.35)]' : ''} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}

export default GlassPanel
