/** Hook para consumir el PlayerContext
 *
 * En vez de usar useContext(PlayerContext) directamente en cada
 * componente, este hook centraliza el acceso y añade una comprobación
 * de seguridad — si alguien intenta usarlo fuera del PlayerProvider
 * recibe un error claro en vez de un fallo silencioso.
 *
 * Uso:
 *   const { currentTrack, playTrack, togglePlay } = usePlayer()
 */

import { useContext } from "react";
import { PlayerContext } from "../context/PlayerContext.jsx";

export function usePlayer() {
  const context = useContext(PlayerContext);

  // Si context es null significa que usePlayer se está usando
  // fuera del PlayerProvider — error de programación, no de usuario
  if (!context) {
    throw new Error("usePlayer debe usarse dentro de un PlayerProvider");
  }

  return context;
}
