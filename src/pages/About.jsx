import Navbar from "../components/Navbar";
import './About.css';

const AboutPage = () => {
    return (
        <div className="About">
            <Navbar />
            <div className="about-container">
                <div className="about-img">
                    <img src="/about_page_img.jpg" alt="About Page Image" />
                </div>
                <div className="about-content">
                    <img src="atelier_logo_black.png" alt="Atelier Logo" />
                    <p>
                        About text will go here. 
                    </p>
                </div>
            </div>
        </div>
    )
}

export default AboutPage; 