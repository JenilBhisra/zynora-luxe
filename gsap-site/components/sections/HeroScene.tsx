'use client'
import React, { useRef } from 'react'
import gsap from 'gsap'
import SceneWrapper from '../gsap/SceneWrapper'
import ScrollScene from '../gsap/ScrollScene'
import Button from '../ui/Button'
import DiamondSparkles from '../ui/DiamondSparkles'

export default function HeroScene(){
  const heroRef = useRef<HTMLDivElement | null>(null)

  return (
    <SceneWrapper id="hero" className="h-hero">
      <ScrollScene onCreate={({ ctx, el })=>{
        // hero timeline
        ctx.add(()=>{
          const title = el.querySelector('.hero-title')
          const subtitle = el.querySelector('.hero-sub')
          const cta = el.querySelector('.hero-cta')
          if(title) gsap.fromTo(title, { y: 40, autoAlpha: 0 }, { y:0, autoAlpha:1, duration:1 })
          if(subtitle) gsap.fromTo(subtitle, { y: 30, autoAlpha:0 }, { y:0, autoAlpha:1, duration:0.9, delay:0.15 })
          if(cta) gsap.fromTo(cta, { scale:0.98, autoAlpha:0 }, { scale:1, autoAlpha:1, duration:0.6, delay:0.3 })
        })
      }}>
        <div ref={heroRef} style={{position:'relative',display:'flex',alignItems:'center',justifyContent:'space-between',gap:24}}>
          <div style={{flex:1}}>
            <h1 className="hero-title" style={{fontSize:48,lineHeight:1.02,margin:0}}>Krishna Diamonds — Craft & Light</h1>
            <p className="hero-sub small-muted" style={{marginTop:12,maxWidth:520}}>Exceptional diamonds, engineered sparkle, conversion-first presentation.</p>
            <div style={{marginTop:20}}>
              <Button onClick={()=>{}} className="hero-cta">Shop The Collection</Button>
            </div>
          </div>
          <div style={{width:360,height:360,position:'relative'}} className="card">
            <img src="/images/diamond.svg" alt="diamond" style={{width:'100%',height:'100%',objectFit:'contain'}} />
            <DiamondSparkles />
          </div>
        </div>
      </ScrollScene>
    </SceneWrapper>
  )
}
