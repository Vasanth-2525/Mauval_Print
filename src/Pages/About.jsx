import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IoIosArrowForward } from 'react-icons/io';
import about from '/Image/Designs/ds2.png';
import Testimonial from '../Home/Testimonial';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Head from '../Components/Head';

export default function About() {
  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
    });
  }, []);

  return (
    <div className='mt-17'>
      <Head
        title="About Us"
        subtitle="About Us"
      />
      <section className="bg-primary/10 text-gray-800 py-12 px-6 md:px-20 overflow-x-hidden">
        <div>
          {/* Heading */}
          <h2
            className="text-3xl md:text-5xl font-bold text-primary mb-2 md:mb-0"
            data-aos="fade-up"
          >
            About Our Mauval Print
          </h2>

          {/* Grid Section */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div data-aos="fade-right">
              <p className="text-lg md:text-xl text-gray-600 text-justify leading-[35px] mb-4">
                We’re more than just ink on fabric — we’re storytellers, artists, and your creative partners.
                Whether it’s a bold statement, your startup logo, or your squad’s inside joke — we bring your vision to life on high-quality tees.
              </p>

              <div>
                <h3 className="text-2xl font-bold text-primary mb-4">Why Choose Us?</h3>
                <ul className="space-y-2 text-gray-600 list-disc pl-5">
                  <li>Custom printing with vibrant, long-lasting colors</li>
                  <li>High-quality, breathable cotton fabrics</li>
                  <li>Fast turnaround & doorstep delivery</li>
                  <li>Eco-friendly printing technology</li>
                </ul>
              </div>
            </div>

            {/* Right: Image */}
            <div
              className="w-full h-100 rounded-xl overflow-hidden"
              data-aos="fade-left"
            >
              <img
                src={about}
                alt="Custom Printed T-Shirts"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials section with AOS */}
      <div data-aos="fade-up">
        <Testimonial />
      </div>
    </div>
  );
}