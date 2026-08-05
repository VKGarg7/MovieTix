import React, { Suspense, lazy, useEffect, useState } from 'react'
import { MotionConfig } from 'framer-motion'
import { initScrollStore } from './lib/scrollStore'
import Universe from './components/cinematic/universe/Universe'
import CustomCursor from './components/cinematic/CustomCursor'
import PageTransition from './components/cinematic/PageTransition'
import Navbar from './components/Navbar'
import CityTheaterModal from './components/CityTheaterModal'
import { Route, Routes, useLocation } from 'react-router-dom'
import {Toaster} from 'react-hot-toast'
import Footer from './components/Footer'
import { useAppContext } from './context/useAppContext'
import { SignIn } from '@clerk/clerk-react'
import Loading from './components/Loading'
import BookingAssistant from './components/BookingAssistant'

// Every routed page is code-split — the initial bundle only needs the app shell
// (nav, footer, 3D universe, providers), not every page's chunk up front.
const Home = lazy(() => import('./pages/Home'))
const Movies = lazy(() => import('./pages/Movies'))
const MovieDetails = lazy(() => import('./pages/MovieDetails'))
const SeatLayout = lazy(() => import('./pages/SeatLayout'))
const BookingFlow = lazy(() => import('./pages/booking/BookingFlow'))
const GroupBookingCreate = lazy(() => import('./pages/GroupBookingCreate'))
const GroupBookingClaim = lazy(() => import('./pages/GroupBookingClaim'))
const GroupBookingManage = lazy(() => import('./pages/GroupBookingManage'))
const ShowtimePollCreate = lazy(() => import('./pages/ShowtimePollCreate'))
const ShowtimePollVote = lazy(() => import('./pages/ShowtimePollVote'))
const ShowtimePollManage = lazy(() => import('./pages/ShowtimePollManage'))
const WaitlistClaim = lazy(() => import('./pages/WaitlistClaim'))
const MyBookings = lazy(() => import('./pages/MyBookings'))
const Account = lazy(() => import('./pages/Account'))
const Favourite = lazy(() => import('./pages/Favourite'))
const Theaters = lazy(() => import('./pages/Theaters'))
const TheaterDetails = lazy(() => import('./pages/TheaterDetails'))
const Layout = lazy(() => import('./pages/admin/Layout'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const AddShows = lazy(() => import('./pages/admin/AddShows'))
const ListShows = lazy(() => import('./pages/admin/ListShows'))
const ListBookings = lazy(() => import('./pages/admin/ListBookings'))
const Coupons = lazy(() => import('./pages/admin/Coupons'))
const PricingRules = lazy(() => import('./pages/admin/PricingRules'))
const MenuItems = lazy(() => import('./pages/admin/MenuItems'))
const VerifyPickup = lazy(() => import('./pages/admin/VerifyPickup'))
const ManageTheaters = lazy(() => import('./pages/admin/ManageTheaters'))
const AuditLog = lazy(() => import('./pages/admin/AuditLog'))
const MultiplexPulse = lazy(() => import('./pages/admin/MultiplexPulse'))

const App = () => {

  const isAdminRoute = useLocation().pathname.startsWith('/admin')

  const {user, selectedTheater} = useAppContext()
  const [isCityModalOpen, setIsCityModalOpen] = useState(false)

  useEffect(() => initScrollStore(), [])

  return (
    <MotionConfig reducedMotion="user">
      <Universe />
      <CustomCursor />
      <Toaster />
      {!isAdminRoute && !selectedTheater && (
        <CityTheaterModal onClose={() => {}} dismissible={false} />
      )}
      {!isAdminRoute && isCityModalOpen && (
        <CityTheaterModal onClose={() => setIsCityModalOpen(false)} />
      )}
      {!isAdminRoute && <Navbar onChangeLocation={() => setIsCityModalOpen(true)} />}
      {!isAdminRoute && <BookingAssistant />}
      <PageTransition>
      <Suspense fallback={<Loading />}>
      <Routes>
        <Route path='/' element={<Home/>} />
        <Route path='/movies' element={<Movies/>} />
        <Route path='/movies/:id' element={<MovieDetails/>} />
        <Route path='/book' element={<BookingFlow/>} />
        <Route path='/book/:movieId' element={<BookingFlow/>} />
        <Route path='/movies/:id/:date' element={<SeatLayout/>} />
        <Route path='/movies/:id/:date/group-booking' element={<GroupBookingCreate/>} />
        <Route path='/group-booking/:groupId' element={<GroupBookingClaim/>} />
        <Route path='/group-booking/:groupId/manage' element={<GroupBookingManage/>} />
        <Route path='/movies/:id/showtime-poll' element={<ShowtimePollCreate/>} />
        <Route path='/showtime-poll/:pollId' element={<ShowtimePollVote/>} />
        <Route path='/showtime-poll/:pollId/manage' element={<ShowtimePollManage/>} />
        <Route path='/waitlist/:entryId/claim' element={<WaitlistClaim/>} />
        <Route path='/my-bookings' element={<MyBookings/>} />
        <Route path='/account' element={<Account/>} />
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
      </Suspense>
      </PageTransition>
      {!isAdminRoute && <Footer/>}
    </MotionConfig>
  )
}

export default App
