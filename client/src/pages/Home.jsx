import React from 'react'
import HeroSection from '../components/HeroSection'
import FeatureSection from '../components/FeatureSection'
import TrailersSection from '../components/TrailersSection'
import RecommendedSection from '../components/RecommendedSection'

const Home = () => {
  return (
    <>
      <HeroSection />
      <RecommendedSection />
      <FeatureSection />
      <TrailersSection />
    </>
  )
}

export default Home
