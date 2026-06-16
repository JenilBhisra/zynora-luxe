'use client'
import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger)

export default function ScrollScene({ children, onCreate }: { children: React.ReactNode, onCreate?: (args: { ctx: gsap.Context, el: HTMLElement }) => void }){
  const ref = useRef<HTMLElement | null>(null)

  useEffect(()=>{
    if(!ref.current) return
    const el = ref.current
    const ctx = gsap.context(()=>{
      // Ensure scene content is visible before section-level timelines take over.
      gsap.set(el, { autoAlpha: 1, y: 0 })
    }, el)

    if(onCreate){
      try{ onCreate({ ctx, el }) }catch(e){ console.error(e) }
    }

    return ()=> ctx.revert()
  },[onCreate])

  return (
    <div ref={ref as any} className="scene-inner">
      {children}
    </div>
  )
}
