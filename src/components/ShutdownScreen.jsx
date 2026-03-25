import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearTokens } from "../auth/tokenManager.js";
import windowsXpWhiteLogo from "../images/windows-xp-logo-white.png";
import XPLoader from "./XPLoader.jsx";
import "../styles/ShutdownScreen.scss";

export default function ShutdownScreen({ onDone }) {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      clearTokens();
      navigate("/login");
      onDone?.();
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate, onDone]);

  return (
    <div className="shutdown-screen">
      <img
        className="shutdown-screen__logo"
        src={windowsXpWhiteLogo}
        alt="Windows XP"
      />
      <XPLoader />
    </div>
  );
}
