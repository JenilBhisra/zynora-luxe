'use client'
import React from 'react'
import Container from '../components/ui/Container'
import HeroScene from '../components/sections/HeroScene'
import ProductReveal from '../components/sections/ProductReveal'
import FeatureHighlight from '../components/sections/FeatureHighlight'
import ZoomDetail from '../components/sections/ZoomDetail'
import CTASection from '../components/sections/CTASection'
import TimelineController from '../components/gsap/TimelineController'

export default function Page(){
  return (
    <main>
      <Container>
        <TimelineController>
          <HeroScene />
          <ProductReveal />
          <FeatureHighlight />
          <ZoomDetail />
          <CTASection />
        </TimelineController>
      </Container>
    </main>
  )
}
