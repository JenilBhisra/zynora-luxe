'use client'
import React, { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if(typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger)

export default function TimelineController({ children }: { children: React.ReactNode }){
  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(()=>{
    const container = containerRef.current
    if(!container) return

    const isDesktop = window.matchMedia('(min-width: 769px)').matches
    const sections = Array.from(container.querySelectorAll('.section')) as HTMLElement[]

    const ctx = gsap.context(()=>{
      sections.forEach((section)=>{
        const targets = section.querySelectorAll('.scene-inner')

        gsap.set(targets, { autoAlpha: 1, y: 0 })

        gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
            pin: isDesktop,
            pinSpacing: false,
            anticipatePin: 1,
            markers: process.env.NODE_ENV === 'development'
          }
        })
        .fromTo(targets, { y: 22, autoAlpha: 0.88 }, { y: 0, autoAlpha: 1, duration: 1, ease: 'none' }, 0)
      })
    }, container)

    return ()=> ctx.revert()
  },[])

  // Handle viewport resize to refresh ScrollTrigger on mobile/responsive changes
  useEffect(()=>{
    const handleResize = ()=> ScrollTrigger.refresh()
    window.addEventListener('resize', handleResize)
    return ()=> window.removeEventListener('resize', handleResize)
  },[])

  return <div ref={containerRef as any}>{children}</div>
}
