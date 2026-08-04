import React, { useState } from 'react'
import Navbar from './components/Navbar'
import CityTheaterModal from './components/CityTheaterModal'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetails from './pages/MovieDetails'
import SeatLayout from './pages/SeatLayout'
import GroupBookingCreate from './pages/GroupBookingCreate'
import GroupBookingClaim from './pages/GroupBookingClaim'
import GroupBookingManage from './pages/GroupBookingManage'
import ShowtimePollCreate from './pages/ShowtimePollCreate'
import ShowtimePollVote from './pages/ShowtimePollVote'
import ShowtimePollManage from './pages/ShowtimePollManage'
import WaitlistClaim from './pages/WaitlistClaim'
import MyBookings from './pages/MyBookings'
import Favourite from './pages/Favourite'
import Theaters from './pages/Theaters'
import TheaterDetails from './pages/TheaterDetails'
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
import ManageTheaters from './pages/admin/ManageTheaters'
import AuditLog from './pages/admin/AuditLog'
import MultiplexPulse from './pages/admin/MultiplexPulse'
import { useAppContext } from './context/useAppContext'
import { SignIn } from '@clerk/clerk-react'
import Loading from './components/Loading'
import BookingAssistant from './components/BookingAssistant'

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
      {!isAdminRoute && <BookingAssistant />}
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/movies' element={<Movies/>} />
        <Route path='/movies/:id' element={<MovieDetails/>} />
        <Route path='/movies/:id/:date' element={<SeatLayout/>} />
        <Route path='/movies/:id/:date/group-booking' element={<GroupBookingCreate/>} />
        <Route path='/group-booking/:groupId' element={<GroupBookingClaim/>} />
        <Route path='/group-booking/:groupId/manage' element={<GroupBookingManage/>} />
        <Route path='/movies/:id/showtime-poll' element={<ShowtimePollCreate/>} />
        <Route path='/showtime-poll/:pollId' element={<ShowtimePollVote/>} />
        <Route path='/showtime-poll/:pollId/manage' element={<ShowtimePollManage/>} />
        <Route path='/waitlist/:entryId/claim' element={<WaitlistClaim/>} />
        <Route path='/my-bookings' element={<MyBookings/>} />
        <Route path='/loading/:nextUrl' element={<Loading/>} />
        
        <Route path='/favourite' element={<Favourite/>} />
        <Route path='/theaters' element={<Theaters/>} />
        <Route path='/theaters/:id' element={<TheaterDetails/>} />

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
          <Route path='manage-theaters' element={<ManageTheaters/>}/>
          <Route path='audit-log' element={<AuditLog/>}/>
          <Route path='multiplex-pulse' element={<MultiplexPulse/>}/>
        </Route>

      </Routes>
      {!isAdminRoute && <Footer/>}
    </>
  )
}

export default App
