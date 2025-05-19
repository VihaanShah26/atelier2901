import Navbar from "../components/Navbar";
import './Contact.css';

const ConatctPage = () => {
    return (
        <div className="Contact">
            <Navbar />
            <div className="contact-container">
                <div className="contact-img">
                    <img src="/contact_page_img.jpg" alt="Contact Page Image" />
                </div>
                <div className="contact-content">
                    <img src="atelier_logo_black.png" alt="Atelier Logo" /> 
                    <p>
                        <br /> Let's create something extraordinary. <br />
                        Get in touch with us at <br />
                        <a href="mailto:payal.shah@atelier2901.com">payal.shah@atelier2901.com</a>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default ConatctPage; 