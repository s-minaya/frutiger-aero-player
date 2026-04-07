/**Definición del contexto del reproductor
 *
 * No se usa directamente en los componentes — se accede a través
 * de usePlayer.js que añade una comprobación de seguridad.
 */
import { createContext } from "react";
/**
 * El valor por defecto null permite que usePlayer.js detecte
 * cuando el hook se usa fuera del PlayerProvider y lance
 * un error descriptivo en vez de fallar silenciosamente.
 */

export const PlayerContext = createContext(null);
