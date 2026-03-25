import { BrowserRouter } from 'react-router-dom'
import AppContent from './AppContent.jsx'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AppContent />
    </BrowserRouter>
  )
}