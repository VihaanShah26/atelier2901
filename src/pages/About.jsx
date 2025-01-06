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
                    {/* <img src="atelier_logo_black.png" alt="Atelier Logo" /> */}
                    <p>
                    At ATELIER 2901, we curate exquisite bespoke designs that epitomize  individuality  and  sophistication. <br />
                    Founded by Payal Shah, a passionate designer with over two decades of expertise, including a distinguished tenure as an Art Director at Grey Worldwide, our studio offers an exclusive
                    range  of  personalized  creations. <br />
                    From custom stationery and curated gifts to bespoke
                    coffee table books and luxury invitations, each piece is meticulously crafted to reflect the unique essence of our
                    discerning  clients. <br /> <br />
                    Let ATELIER 2901 transform your vision into timeless elegance.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default AboutPage; 