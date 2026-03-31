import "./StartMenu.scss";
import iconWMP from "../../assets/icons/wmp.webp";
import defaultUser from "../../assets/ui/chess-user.webp";
import logoutIcon from "../../assets/ui/logout-key.PNG";

export default function StartMenu({ onOpenPlayer, onLogout, onLogin, user }) {
  const avatar = user?.images?.[0]?.url || defaultUser;

  const username = user?.display_name || "Usuario";

  return (
    <div className="start-menu">
      {/* Cabecera azul con avatar y nombre */}
      <div
        className="start-menu__header"
        onClick={onLogin}
        style={{ cursor: "pointer" }}
      >
        <img className="start-menu__avatar" src={avatar} alt="" />
        <span className="start-menu__username">{username}</span>
      </div>

      {/* Cuerpo dos columnas */}
      <div className="start-menu__body">
        {/* Columna izquierda */}
        <div className="start-menu__left">
          <div className="start-menu__item" onDoubleClick={onOpenPlayer}>
            <img className="start-menu__icon" src={iconWMP} alt="" />
            <div className="start-menu__item-text">
              <span className="start-menu__item-title">
                Reproductor de Windows
              </span>
              <span className="start-menu__item-title">Media</span>
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="start-menu__right" />
      </div>

      {/* Pie con cerrar sesión */}
      <div className="start-menu__footer">
        <button className="start-menu__logout" onClick={onLogout}>
          <img className="start-menu__logout-icon" src={logoutIcon} alt="" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}
