/**
 * Integración con el Web Playback SDK de Spotify
 *
 * El SDK de Spotify no está en npm — Spotify lo sirve desde sus servidores
 * y hay que cargarlo como un script externo. Este hook gestiona todo ese
 * ciclo de vida:
 *
 * 1. Carga el script del SDK cuando el hook se monta
 * 2. Espera a que el SDK esté listo (callback window.onSpotifyWebPlaybackSDKReady)
 * 3. Crea el Player con nuestro token
 * 4. Obtiene el device_id que Spotify nos asigna
 * 5. Expone el player y el device_id para que PlayerPanel pueda usarlos
 *
 * Por qué un hook y no directamente en PlayerPanel:
 * La lógica de cargar un script externo y gestionar su ciclo de vida
 * es compleja — separarla en un hook mantiene PlayerPanel limpio
 * y hace el código más testeable.
 *
 * Solo funciona con usuarios Premium — el SDK lanza un error
 * si se intenta usar con una cuenta free.
 */

import { useEffect, useState, useRef } from "react";
import { getValidAccessToken } from "../auth/tokenManager.js";

export function useSpotifyPlayer() {
  // El objeto Player del SDK — null hasta que el SDK está listo.
  // Se expone en el return para que los componentes puedan llamar
  // a métodos del SDK directamente si lo necesitan.
  const [player, setPlayer] = useState(null);

  // Ref al mismo objeto Player — usada exclusivamente en el cleanup.
  // Sin esta ref, el useEffect tendría que incluir 'player' en sus
  // dependencias, lo que causaría un bucle infinito de reconexiones.
  const playerRef = useRef(null);

  // ID del dispositivo que Spotify nos asigna — necesario para
  // decirle a Spotify "reproduce en ESTE dispositivo"
  const [deviceId, setDeviceId] = useState(null);

  // Estado de la reproducción que nos envía el SDK
  const [playerState, setPlayerState] = useState(null);

  // true mientras el SDK se está cargando e inicializando
  const [loading, setLoading] = useState(true);

  // Error si el SDK falla (cuenta free, navegador incompatible...)
  const [error, setError] = useState(null);

  useEffect(() => {
    /**
     * Carga el script del SDK de Spotify en el DOM.
     * Si ya está cargado (script con ese src ya existe) no lo duplica.
     */
    function loadSDKScript() {
      if (
        document.querySelector(
          'script[src="https://sdk.scdn.co/spotify-player.js"]',
        )
      ) {
        return; // ya está cargado
      }
      const script = document.createElement("script");
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);
    }

    /**
     * Inicializa el Player del SDK.
     * Se llama cuando el SDK está listo — Spotify llama a
     * window.onSpotifyWebPlaybackSDKReady automáticamente.
     */
    async function initPlayer() {
      try {
        const token = await getValidAccessToken();

        const spotifyPlayer = new window.Spotify.Player({
          name: "Frutiger Aero Player", // nombre que aparece en la lista de dispositivos
          getOAuthToken: (cb) => cb(token), // función que el SDK llama para obtener el token
          volume: 0.8,
        });

        // ── Listeners del SDK ──────────────────────────────────────────

        // Error de autenticación — token inválido o expirado
        spotifyPlayer.addListener("authentication_error", ({ message }) => {
          setError(`Error de autenticación: ${message}`);
          setLoading(false);
        });

        // Error de cuenta — usuario sin Premium
        spotifyPlayer.addListener("account_error", ({ message }) => {
          setError(`Se requiere Spotify Premium: ${message}`);
          setLoading(false);
        });

        // El SDK está listo y conectado — Spotify nos da el device_id
        spotifyPlayer.addListener("ready", ({ device_id }) => {
          setDeviceId(device_id);
          setLoading(false);
        });

        // El SDK se desconectó
        spotifyPlayer.addListener("not_ready", ({ device_id }) => {
          console.warn("Player desconectado:", device_id);
        });

        // El estado de reproducción cambió — canción, progreso, pausa...
        spotifyPlayer.addListener("player_state_changed", (state) => {
          setPlayerState(state);
        });

        // Conectamos el player al navegador
        await spotifyPlayer.connect();
        setPlayer(spotifyPlayer);
        playerRef.current = spotifyPlayer; // guardamos la referencia para el cleanup
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }

    // El SDK llama a esta función cuando está listo para usarse
    window.onSpotifyWebPlaybackSDKReady = initPlayer;

    loadSDKScript();

    // Cleanup: desconectamos el player al desmontar el componente
    return () => {
      playerRef.current?.disconnect();
    };
  }, []); // solo se ejecuta al montar

  return { player, deviceId, playerState, loading, error };
}
