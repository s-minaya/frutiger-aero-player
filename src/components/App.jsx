/* * basename:
 * import.meta.env.BASE_URL viene de vite.config.js donde está configurado
 * como '/spotify-frutiger-aero/'. Esto hace que todas las rutas funcionen
 * correctamente tanto en local (127.0.0.1:5173/spotify-frutiger-aero/)
 * como en producción (usuario.github.io/spotify-frutiger-aero/).
 * Sin basename las rutas en GitHub Pages darían 404.
 */

import { BrowserRouter } from "react-router-dom";
import AppContent from "./AppContent.jsx";

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppContent />
    </BrowserRouter>
  );
}
