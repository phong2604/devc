import React from "react";
import { useAuth } from "react-oidc-context";
import "./style/header.css";

function Header() {
  const auth = useAuth();

  const signOutRedirect = () => {
    const clientId = "3k6g1a02gem5ssk22o9dbcmh4m";
    const logoutUri = "http://localhost:3000";
    const cognitoDomain = "https://texttoflashcard.auth.us-east-1.amazoncognito.com";
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  if (auth.isLoading) {
    return <div>Loading...</div>;
  }

  if (auth.error) {
    return <div>Encountering error... {auth.error.message}</div>;
  }

  return (
    <header className="header">
      <div className="logo">
        <h1>Inka</h1>
        <span className="logo-star">★</span>
      </div>
      <div className="nav">

      <nav className="nav">
        <a href="/decks" className="nav-link">
          Decks
        </a>
        <a href="/add-card" className="nav-link">
          Add
        </a>
        <a href="/account" className="nav-link">
          Account
        </a>
      </nav>
      <div className="auth-actions">
        {auth.isAuthenticated ? (
          <>
            <button className="auth-button" onClick={() => auth.removeUser()}>
              Log Out
            </button>
          </>
        ) : (
          <>
            <button className="auth-button" onClick={() => auth.signinRedirect()}>
              Log In
            </button>
          </>
        )}
      </div>
        </div>
    </header>
  );
}

export default Header;
