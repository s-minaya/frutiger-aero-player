import "./DesktopIcon.scss";
export default function DesktopIcon({ label, icon, onDoubleClick }) {
  return (
    <div className="desktop-icon" onDoubleClick={onDoubleClick}>
      <img className="desktop-icon__img" src={icon} alt="" />
      <span className="desktop-icon__label">{label}</span>
    </div>
  )
}