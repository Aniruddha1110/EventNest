import { StrictMode } from 'react'
import React from 'react';


import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import UserPage from './UserPage.jsx';
import AdminPage from './AdminPage.jsx';
import OrganiserPage from './OrganiserPage.jsx';
import LandingPage from './LandingPage.jsx';



createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App/>
    </BrowserRouter>
  </React.StrictMode>,
)
