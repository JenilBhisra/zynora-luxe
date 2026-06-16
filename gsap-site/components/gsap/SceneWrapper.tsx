'use client'
import React from 'react'

export default function SceneWrapper({ children, id, className }: { children: React.ReactNode, id?: string, className?: string }){
  return (
    <section id={id} className={`section ${className || ''}`}>
      {children}
    </section>
  )
}
