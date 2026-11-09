import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div>
        <Link className="brand" to="/">
          <span className="brand-mark">▶</span> AutoReel
        </Link>
        <p>Make consistency your unfair advantage.</p>
      </div>
      <div className="footer-links">
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <span>© {new Date().getFullYear()} AutoReel</span>
      </div>
    </footer>
  );
}