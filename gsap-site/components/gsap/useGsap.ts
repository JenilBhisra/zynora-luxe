'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useGsap(){
  const rootRef = useRef<HTMLElement | null>(null)

  useEffect(()=>{
    // no-op here; individual scenes will create contexts
  },[])

  return { rootRef, gsap, ScrollTrigger }
}

export default useGsap
