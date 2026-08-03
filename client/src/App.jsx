import React, { useState } from 'react'
import Navbar from './components/Navbar'
import CityTheaterModal from './components/CityTheaterModal'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetails from './pages/MovieDetails'
import SeatLayout from './pages/SeatLayout'
import MyBookings from './pages/MyBookings'
import Favourite from './pages/Favourite'
import Theaters from './pages/Theaters'
import {Toaster} from 'react-hot-toast'
import Footer from './components/Footer'
import Layout from './pages/admin/Layout'
import Dashboard from './pages/admin/Dashboard'
import AddShows from './pages/admin/AddShows'
import ListShows from './pages/admin/ListShows'
import ListBookings from './pages/admin/ListBookings'
import Coupons from './pages/admin/Coupons'
import PricingRules from './pages/admin/PricingRules'
import MenuItems from './pages/admin/MenuItems'
import VerifyPickup from './pages/admin/VerifyPickup'
import { useAppContext } from './context/useAppContext'
import { SignIn } from '@clerk/clerk-react'
import Loading from './components/Loading'

const App = () => {

  const isAdminRoute = useLocation().pathname.startsWith('/admin')

  const {user, selectedTheater} = useAppContext()
  const [isCityModalOpen, setIsCityModalOpen] = useState(false)

  return (
    <>
      <Toaster />
      {!isAdminRoute && !selectedTheater && (
        <CityTheaterModal onClose={() => {}} dismissible={false} />
      )}
      {!isAdminRoute && isCityModalOpen && (
        <CityTheaterModal onClose={() => setIsCityModalOpen(false)} />
      )}
      {!isAdminRoute && <Navbar onChangeLocation={() => setIsCityModalOpen(true)} />}
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/movies' element={<Movies/>} />
        <Route path='/movies/:id' element={<MovieDetails/>} />
        <Route path='/movies/:id/:date' element={<SeatLayout/>} />
        <Route path='/my-bookings' element={<MyBookings/>} />
        <Route path='/loading/:nextUrl' element={<Loading/>} />
        
        <Route path='/favourite' element={<Favourite/>} />
        <Route path='/theaters' element={<Theaters/>} />

        <Route path='/admin/*' element={user ? <Layout/> : (
          <div className='min-h-screen flex justify-center items-center'>
            <SignIn fallbackRedirectUrl={'/admin'} />
          </div>
        )}>
          <Route index element={<Dashboard/>}/>
          <Route path='add-shows' element={<AddShows/>}/>
          <Route path='list-shows' element={<ListShows/>}/>
          <Route path='list-bookings' element={<ListBookings/>}/>
          <Route path='coupons' element={<Coupons/>}/>
          <Route path='pricing-rules' element={<PricingRules/>}/>
          <Route path='menu-items' element={<MenuItems/>}/>
          <Route path='verify-pickup' element={<VerifyPickup/>}/>
        </Route>

      </Routes>
      {!isAdminRoute && <Footer/>}
    </>
  )
}

export default App
