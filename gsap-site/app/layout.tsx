import '../styles/globals.css'
import React from 'react'

export const metadata = {
  title: 'GSAP Storytelling Site',
  description: 'Premium multi-section GSAP storytelling with diamond sparkle'
}

export default function RootLayout({ children }: { children: React.ReactNode }){
  return (
    <html lang="en">
      <head />
      <body>
        {children}
      </body>
    </html>
  )
}
