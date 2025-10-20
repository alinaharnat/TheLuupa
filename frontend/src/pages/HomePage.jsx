import React from 'react'
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Footer from '../components/Footer';

const HomePage = () => {
  return (
    <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow">
          <Hero />
        </div>
        <Footer />
    </div>
  )
}

export default HomePage