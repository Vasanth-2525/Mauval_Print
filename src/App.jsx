import React from 'react'
import Navbar from './Components/Navbar.jsx';
import Footer from './Components/Footer.jsx';
import {Outlet} from 'react-router-dom';
import ScrollToTop from './Components/ScrollToTop.jsx';
import { ToastContainer } from 'react-toastify';
import ScrollNavigator from './Components/ScrollNavigator.jsx';

const App = () => {
  return (
    <div>
      <Navbar/>
      <ScrollToTop/>
      <ScrollNavigator/>
      <Outlet/>
      <Footer/>
      <ToastContainer position="top-right" autoClose={1000} className='z-1000'  />
    </div>
  )
}

export default App