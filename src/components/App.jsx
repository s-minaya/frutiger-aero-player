import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isLoggedIn } from '../auth/tokenManager.js'
import Desktop from './Desktop.jsx'
import CallbackPage from './CallbackPage.jsx'

function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={<Desktop />} />
        <Route path="/callback" element={<CallbackPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <div>Home — próximamente</div>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
