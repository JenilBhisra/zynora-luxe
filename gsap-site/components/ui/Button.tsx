'use client'
import React from 'react'

export default function Button({ children, onClick, variant='primary', className='' }: { children: React.ReactNode, onClick?: () => void, variant?: 'primary'|'ghost', className?: string }){
  const base = 'cta'
  const cls = `${base} ${variant === 'ghost' ? 'ghost' : 'primary'} ${className}`
  return (
    <button className={cls} onClick={onClick}>
      {children}
    </button>
  )
}
