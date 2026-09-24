import { Routes, Route } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import QRScanner from './pages/QRScanner.jsx'
import ArtifactDetail from './pages/ArtifactDetail.jsx'
import MuseumMap from './pages/MuseumMap.jsx'
import ToursCollections from './pages/ToursCollections.jsx'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quet-ma-qr" element={<QRScanner />} />
          <Route path="/hien-vat/:id" element={<ArtifactDetail />} />
          <Route path="/ban-do" element={<MuseumMap />} />
          <Route path="/bo-suu-tap" element={<ToursCollections />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
