import './Navbar.css';

const Navbar = () => {
  return (
    <div className="Navbar">
      <header className="navbar">
        <nav>
          <ul className="nav-links">
            <li><a href="/">Home</a></li>
            <li><a href="#stationery">Bespoke Stationery</a></li>
            <li><a href="#gifting">Gifting</a></li>
            <li><a href="#books">Coffee Table Books</a></li>
            <li><a href="#invitations">Invitations</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="/contact">Contact Us</a></li>
          </ul>
        </nav>
      </header>
    </div>
  );
};

export default Navbar;