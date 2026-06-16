'use client'
import React from 'react'
import gsap from 'gsap'
import SceneWrapper from '../gsap/SceneWrapper'
import ScrollScene from '../gsap/ScrollScene'

export default function ZoomDetail(){
  return (
    <SceneWrapper id="zoom">
      <ScrollScene onCreate={({ ctx, el })=>{
        ctx.add(()=>{
          const img = el.querySelector('img')
          if(img) gsap.fromTo(img, { scale:1.6, autoAlpha:0 }, { scale:1, autoAlpha:1, duration:1.4 })
        })
      }}>
        <div className="zoom-grid">
          <div className="zoom-text">
            <h3>Inspect The Facets</h3>
            <p className="small-muted">Zoom into the optical performance and see how light scatters.</p>
          </div>
          <div className="zoom-image card">
            <img src="/images/diamond.svg" alt="diamond closeup" style={{width:'100%'}} />
          </div>
        </div>
      </ScrollScene>
    </SceneWrapper>
  )
}
