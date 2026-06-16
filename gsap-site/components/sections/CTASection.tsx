'use client'
import React from 'react'
import gsap from 'gsap'
import SceneWrapper from '../gsap/SceneWrapper'
import ScrollScene from '../gsap/ScrollScene'
import Button from '../ui/Button'

export default function CTASection(){
  return (
    <SceneWrapper id="cta">
      <ScrollScene onCreate={({ ctx, el })=>{
        ctx.add(()=>{
          const cta = el.querySelector('.final-cta')
          if(cta) gsap.fromTo(cta, { y: 30, autoAlpha: 0 }, { y:0, autoAlpha:1, duration:0.9 })
        })
      }}>
        <div style={{textAlign:'center',padding:'80px 24px'}}>
          <h2>Find Your Perfect Diamond</h2>
          <p className="small-muted">Book a consultation or start customizing your ring today.</p>
          <div style={{marginTop:20}}>
            <Button className="final-cta">Start Customizing</Button>
          </div>
        </div>
      </ScrollScene>
    </SceneWrapper>
  )
}
