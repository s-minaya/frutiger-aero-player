import windowsXpWhiteLogo from "../../assets/branding/windows-xp-logo-white.png";
import XPLoader from './XPLoader.jsx'
import './BootScreen.scss'

export default function BootScreen() {
  return (
    <div className="boot-screen">
      <img
        className="boot-screen__logo"
        src={windowsXpWhiteLogo}
        alt="Windows XP"
      />
      <XPLoader />
    </div>
  )
}