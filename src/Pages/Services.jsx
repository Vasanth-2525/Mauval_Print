import React from 'react';
import { FaTshirt, FaPaintBrush, FaTruck, FaTags, FaCogs, FaUserTie } from 'react-icons/fa';
import { SiBlueprint } from "react-icons/si";
import Head from '../Components/Head';
import { Link } from 'react-router-dom';

const services = [
   {
    title: 'Flim Printing',
    icon: SiBlueprint,
    navigate:"/print",
    description: 'Get your own design printed with vibrant colors and premium quality on T-shirts.',
  },
  {
    title: 'Custom Design Printing',
    icon: FaPaintBrush,
    navigate:"",
    description: 'Get your own design printed with vibrant colors and premium quality on T-shirts.',
  },
  {
    title: 'Bulk Order Printing',
    icon: FaTshirt,
    navigate:"",
    description: 'Specialized in large quantity orders with discounted rates and fast delivery.',
  },
  {
    title: 'Express Delivery',
    icon: FaTruck,
    navigate:"",
    description: 'Quick and reliable delivery service across India within 3-5 business days.',
  },
  {
    title: 'Custom Tags & Labels',
    icon: FaTags,
    navigate:"",
    description: 'Add custom tags, labels or logos for your brand identity on every shirt.',
  },
  {
    title: 'High-Quality Materials',
    icon: FaCogs,
    navigate:"",
    description: 'We use top-grade fabrics and printing techniques for long-lasting quality.',
  },
  {
    title: 'Corporate & Event Printing',
    icon: FaUserTie,
    navigate:"",
    description: 'Ideal for businesses, teams, colleges, and event merchandise printing.',
  },
];

export default function Services() {
  return (
    <div className='mt-17'>
    <Head
        title="Our Services"
        subtitle="Our Services"
      />
    <section className="py-16 px-4 md:px-20 bg-primary/10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <Link
              key={index}
              to={service.navigate}
              className="group border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-lg transition duration-600 bg-white hover:bg-primary hover:text-white"
            >
              {/* Icon Centered with Hover Effect */}
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-gray-100 group-hover:bg-white text-primary group-hover:text-primary transition-all duration-600">
                  <Icon className="text-2xl" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-center text-primary group-hover:text-white">{service.title}</h3>
              <p className="text-gray-600 text-sm text-center group-hover:text-white">{service.description}</p>
            </Link>
          );
        })}
      </div>
    </section>
    </div>
  );
}