import React from 'react'
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import PopularRoutes from '../components/PopularRoutes';
import WhySection from '../components/WhySection';   // ✅ додано
import TopCarriers from '../components/TopCarriers';
import Footer from '../components/Footer';

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-grow">
        <Hero />
        <PopularRoutes />

        <WhySection /> 

        <TopCarriers />
      </div>
      <Footer />
    </div>
  )
}

export default HomePage;
