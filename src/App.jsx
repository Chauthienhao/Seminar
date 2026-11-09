import { Routes, Route, Outlet } from 'react-router-dom'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import Home from './pages/Home.jsx'
import ArtifactLookup from './pages/ArtifactLookup.jsx'
import ArtifactDetail from './pages/ArtifactDetail.jsx'
import MuseumMap from './pages/MuseumMap.jsx'
import ToursCollections from './pages/ToursCollections.jsx'
import QrRedirect from './pages/QrRedirect.jsx'
import PoiDetail from './pages/PoiDetail.jsx'

// Khung chung của site khách tham quan — khu CMS (/admin/*) có layout riêng nên nằm ngoài khung này
function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<AdminDashboard />} />
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/tra-cuu-hien-vat" element={<ArtifactLookup />} />
        <Route path="/hien-vat/:id" element={<ArtifactDetail />} />
        {/* Đích của link trong mã QR dán tại điểm tham quan (POI) — không đổi đường dẫn này */}
        <Route path="/q/:code" element={<QrRedirect />} />
        <Route path="/diem/:code" element={<PoiDetail />} />
        <Route path="/ban-do" element={<MuseumMap />} />
        <Route path="/bo-suu-tap" element={<ToursCollections />} />
      </Route>
    </Routes>
  )
}
