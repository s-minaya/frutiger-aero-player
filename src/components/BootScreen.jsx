import windowsXpWhiteLogo from "../images/windows-xp-logo-white.png";
import XPLoader from './XPLoader.jsx'
import '../styles/BootScreen.scss'

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