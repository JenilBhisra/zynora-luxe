'use client'
import React from 'react'
import gsap from 'gsap'
import SceneWrapper from '../gsap/SceneWrapper'
import ScrollScene from '../gsap/ScrollScene'
import Card from '../ui/Card'
import Button from '../ui/Button'

export default function ProductReveal(){
  return (
    <SceneWrapper id="product" className="section">
      <ScrollScene onCreate={({ ctx, el })=>{
        ctx.add(()=>{
          const left = el.querySelector('.reveal-left')
          const right = el.querySelector('.reveal-right')
          if(left) gsap.fromTo(left, { x:-120, autoAlpha:0 }, { x:0, autoAlpha:1, duration:1 })
          if(right) gsap.fromTo(right, { x:120, autoAlpha:0 }, { x:0, autoAlpha:1, duration:1 })
        })
      }}>
        <div className="product-grid">
          <div className="reveal-left">
            <h2 style={{marginTop:0}}>Reveal: The Perfect Cut</h2>
            <p className="small-muted">A balanced light performance engineered for life and photographs alike.</p>
            <div style={{marginTop:16}}>
              <Button onClick={()=>{}}>Explore Cuts</Button>
            </div>
          </div>
          <div className="reveal-right card">
            <img src="/images/diamond.svg" alt="diamond" style={{width:'100%'}}/>
            <div style={{marginTop:12}}>
              <strong>Brilliance</strong>
              <p className="small-muted">Ideal symmetry and optical precision.</p>
            </div>
          </div>
        </div>
      </ScrollScene>
    </SceneWrapper>
  )
}
