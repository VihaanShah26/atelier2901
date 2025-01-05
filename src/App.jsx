import './App.css';
import Navbar from './components/Navbar';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import ConatctPage from './pages/contact';
import HomePage from './pages/Home';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {

  const Routing = () => {
    return (
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/contact" element={<ConatctPage />} />
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