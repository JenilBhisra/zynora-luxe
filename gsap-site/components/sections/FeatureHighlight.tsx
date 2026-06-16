'use client'
import React from 'react'
import gsap from 'gsap'
import SceneWrapper from '../gsap/SceneWrapper'
import ScrollScene from '../gsap/ScrollScene'
import Card from '../ui/Card'

export default function FeatureHighlight(){
  return (
    <SceneWrapper id="features">
      <ScrollScene onCreate={({ ctx, el })=>{
        ctx.add(()=>{
          const items = el.querySelectorAll('.feature-item')
          if(items.length) gsap.fromTo(items, { y: 30, autoAlpha: 0 }, { y:0, autoAlpha:1, duration:0.7, stagger:0.12 })
        })
      }}>
        <div className="feature-grid">
          <Card className="feature-item"><h3>Sparkle</h3><p className="small-muted">Engineered light play.</p></Card>
          <Card className="feature-item"><h3>Clarity</h3><p className="small-muted">Premium grading and transparency.</p></Card>
          <Card className="feature-item"><h3>Craft</h3><p className="small-muted">Hand-finished settings.</p></Card>
        </div>
      </ScrollScene>
    </SceneWrapper>
  )
}
