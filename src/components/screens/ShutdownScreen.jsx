import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { clearTokens } from "../../auth/tokenManager.js";
import windowsXpWhiteLogo from "../../assets/branding/windows-xp-logo-white.png";
import XPLoader from "./XPLoader.jsx";
import "./ShutdownScreen.scss";

export default function ShutdownScreen({ onDone }) {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      // Limpiamos todos los tokens del localStorage —
      // después de esto isLoggedIn() devuelve false
      clearTokens();
      // Navegamos a /login — PrivateRoute impedirá volver al Desktop
      // sin hacer login de nuevo
      navigate("/login");
      // Avisamos a AppContent que puede resetear shuttingDown a false.
      // El ?. es optional chaining — por si onDone no se pasa como prop
      onDone?.();
    }, 3000);// 3 segundos de animación antes de cerrar sesión

    // Cleanup: cancela el timer si el componente se desmonta antes
    // de los 3 segundos — evita llamar a navigate sobre un componente
    // ya desmontado

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
