import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="navbar">
      <Link className="brand" to="/">
        <span className="brand-mark">▶</span> AutoReel
      </Link>
      <nav>
        <NavLink to="/">Home</NavLink>
        {user ? (
          <>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <button
              className="nav-logout"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Log in</NavLink>
            <Link className="nav-signup" to="/signup">Get started</Link>
          </>
        )}
      </nav>
    </header>
  );
}