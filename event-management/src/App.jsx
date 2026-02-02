import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import OrganiserPage from "./OrganiserPage";
import AdminDashboard from "./AdminPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing / Home page */}
        <Route path="/" element={<LandingPage />} />

        {/* Organiser dashboard page */}
        <Route path="/organiser" element={<OrganiserPage />} />

        {/* Admin dashboard page */}
        <Route path="/admin" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;