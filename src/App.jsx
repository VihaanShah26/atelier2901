import './App.css';
import Navbar from './components/Navbar';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ConatctPage from './pages/contact';
import HomePage from './pages/Home';
import AboutPage from './pages/About';
import StationeryPage from './pages/Stationery';
import GiftingPage from './pages/Gifting';
import BooksPage from './pages/Books';
import InvitationsPage from './pages/Invitations';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {

  const Routing = () => {
    return (
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<ConatctPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/stationery" element={<StationeryPage />} />
        <Route path="/gifting" element={<GiftingPage />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/invitations" element={<InvitationsPage />} />
      </Routes>
      </BrowserRouter>
    )
  }

  return (
    <div className='App'>
      <Routing />
    </div>
  )
}

export default App; 