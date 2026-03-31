/**
 * Flujo de login:
 * 1. Usuario hace click en el avatar
 * 2. Se abre popup de Spotify (loginWithSpotifyPopup)
 * 3. Usuario se autentica en Spotify
 * 4. Popup envía 'spotify-login-success' y se cierra
 * 5. reload() actualiza el estado de useAuth con el perfil real
 * 6. navigate('/') lleva al usuario al Desktop
 */

import { useNavigate } from "react-router-dom";
import { loginWithSpotifyPopup } from "../../auth/spotifyAuth.js";
import { useAuth } from "../../hooks/useAuth.js";
import windowsXpLogo from "../../assets/branding/windows-xp-logo.png";
import shutdownBtn from "../../assets/ui/shutdown-btn.png";
import defaultUser from "../../assets/ui/chess-user.webp";
import "./LoginScreen.scss";

export default function LoginScreen({ onShutdown }) {
  // reload() recarga el perfil del usuario sin recargar la página —
  // lo llamamos tras el login exitoso para que useAuth tenga los datos reales
  const { reload } = useAuth();
  const navigate = useNavigate();

  /**
   * Inicia el flujo de login con Spotify.
   *
   * loginWithSpotifyPopup abre el popup y llama al callback cuando
   * el popup envía 'spotify-login-success'. En el callback:
   * 1. reload() — carga el perfil real del usuario en useAuth
   * 2. navigate('/') — redirige al Desktop ahora que hay sesión
   *
   * El await en reload() es importante — si navegáramos antes de que
   * reload termine, Desktop cargaría con user=null brevemente.
   */
  async function handleLogin() {
    loginWithSpotifyPopup(async () => {
      await reload();
      navigate("/");
    });
  }

  return (
    <div className="login-screen">

      {/* Barra superior azul oscura */}
      <div className="login-screen__top-bar" />

      {/* Cuerpo central dividido en dos columnas */}
      <div className="login-screen__body">

        {/* Columna izquierda — logo e instrucción */}
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

        {/* Columna derecha — usuario clickable */}
        <div className="login-screen__right">
          {/* Todo el bloque es clickable — igual que en XP donde
              hacías click en el nombre/avatar para iniciar sesión */}
          <div className="login-screen__user" onClick={handleLogin}>
            {/* Avatar genérico de XP — se mantiene siempre igual porque
                antes del login no sabemos quién es el usuario */}
            <img
              className="login-screen__avatar"
              src={defaultUser}
              alt="Usuario"
            />
            <span className="login-screen__username">Usuario</span>
          </div>
        </div>

      </div>

      {/* Pie — botón de apagar */}
      <div className="login-screen__footer">
        {/* onShutdown viene de AppContent — activa shuttingDown=true
            que superpone ShutdownScreen sobre toda la app */}
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