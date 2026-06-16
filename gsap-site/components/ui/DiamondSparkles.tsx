'use client'
import React, { useRef, useEffect } from 'react'

type Particle = { x:number,y:number,vx:number,vy:number,size:number,alpha:number }

export default function DiamondSparkles({ className=''}: { className?: string }){
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const density = 40

  useEffect(()=>{
    const canvas = canvasRef.current
    if(!canvas) return
    const ctx = canvas.getContext('2d')!
    let w = canvas.width = canvas.clientWidth * devicePixelRatio
    let h = canvas.height = canvas.clientHeight * devicePixelRatio

    const resize = ()=>{
      w = canvas.width = canvas.clientWidth * devicePixelRatio
      h = canvas.height = canvas.clientHeight * devicePixelRatio
    }

    window.addEventListener('resize', resize)

    const rand = (a:number,b:number)=> a + Math.random()*(b-a)

    const createParticles = ()=>{
      particlesRef.current = []
      for(let i=0;i<Math.max(8, Math.floor(density * (canvas.clientWidth/800)));i++){
        particlesRef.current.push({ x: rand(0,w), y: rand(0,h), vx: rand(-0.15,0.15), vy: rand(-0.12,0.12), size: rand(0.7,2.8), alpha: rand(0.05,0.35) })
      }
    }

    createParticles()

    let hoverBoost = 0

    const onMouseEnter = ()=> hoverBoost = 1
    const onMouseLeave = ()=> hoverBoost = 0

    canvas.addEventListener('mouseenter', onMouseEnter)
    canvas.addEventListener('mouseleave', onMouseLeave)

    const tick = ()=>{
      ctx.clearRect(0,0,w,h)
      particlesRef.current.forEach(p=>{
        p.x += p.vx * (1 + hoverBoost*2)
        p.y += p.vy * (1 + hoverBoost*2)
        p.alpha += (Math.random()-0.5) * 0.02
        if(p.alpha < 0.02) p.alpha = 0.02
        ctx.beginPath()
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`
        ctx.arc(p.x, p.y, p.size * devicePixelRatio, 0, Math.PI*2)
        ctx.fill()
        // wrap
        if(p.x < -10) p.x = w + 10
        if(p.x > w + 10) p.x = -10
        if(p.y < -10) p.y = h + 10
        if(p.y > h + 10) p.y = -10
      })
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return ()=>{
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('mouseenter', onMouseEnter)
      canvas.removeEventListener('mouseleave', onMouseLeave)
      if(rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  },[])

  return (
    <canvas aria-hidden className={className} ref={canvasRef} style={{ position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',mixBlendMode:'screen' }} />
  )
}
