import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState } from 'react'
import { isLoggedIn } from "../auth/tokenManager.js";
import LoginScreen from "./LoginScreen.jsx";
import Desktop from "./Desktop.jsx";
import CallbackPage from "./CallbackPage.jsx";
import ShutdownScreen from './ShutdownScreen.jsx'

function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const [shuttingDown, setShuttingDown] = useState(false)
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      {shuttingDown && <ShutdownScreen onDone={() => setShuttingDown(false)} />}
      <Routes>
        <Route path="/login" element={<LoginScreen onShutdown={() => setShuttingDown(true)} />
      } />
        <Route path="/callback" element={<CallbackPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Desktop onShutdown={() => setShuttingDown(true)} />
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
