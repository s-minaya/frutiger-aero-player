import { useNavigate } from "react-router-dom";
import { loginWithSpotifyPopup } from "../auth/spotifyAuth.js";
import { useAuth } from "../hooks/useAuth.js";
import windowsXpLogo from "../images/windows-xp-logo.png";
import shutdownBtn from "../images/shutdown-btn.png";
import defaultUser from "../images/chess-user.webp";
import "../styles/LoginScreen.scss";

export default function LoginScreen({ onShutdown }) {
  const { reload } = useAuth();
  const navigate = useNavigate();

  async function handleLogin() {
    loginWithSpotifyPopup(async () => {
      await reload();
      navigate("/");
    });
  }

  return (
    <div className="login-screen">
      {/* Barra superior */}
      <div className="login-screen__top-bar" />

      {/* Cuerpo central */}
      <div className="login-screen__body">
        {/* Columna izquierda — logo */}
        <div className="login-screen__left">
          <img
            className="login-screen__logo"
            src={windowsXpLogo}
            alt="Windows XP"
          />
          <p className="login-screen__hint">
            Para comenzar, haz clic en tu usuario
          </p>
        </div>

        {/* Divisor vertical */}
        <div className="login-screen__divider" />

        {/* Columna derecha — usuario */}
        <div className="login-screen__right">
          <div className="login-screen__user" onClick={handleLogin}>
            <img
              className="login-screen__avatar"
              src={defaultUser}
              alt="Usuario"
            />
            <span className="login-screen__username">Usuario</span>
          </div>
        </div>
      </div>

      {/* Pie */}
      <div className="login-screen__footer">
        <button className="login-screen__shutdown" onClick={onShutdown}>
          <img
            className="login-screen__shutdown-icon"
            src={shutdownBtn}
            alt="Apagar"
          />
          <span>Apagar el equipo</span>
        </button>
      </div>
    </div>
  );
}
