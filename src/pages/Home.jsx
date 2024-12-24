import Navbar from "../components/Navbar"; 
import './Home.css'

const HomePage = () => {
    return (
        <div className='Home'>
            <Navbar />
            <div className='logo'>
                <img src="/atelier_logo_black.png" alt="Logo" />
            </div>
        </div>
    )
}

export default HomePage; 