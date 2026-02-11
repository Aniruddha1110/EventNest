import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import OrganiserPage from "./OrganiserPage";
import AdminDashboard from "./AdminPage";
import UserPage from "./UserPage";
import AdminPage from "./AdminPage";

function App() {
  return (
    <>
      <Routes>
        {/* Landing / Home page */}
        <Route path="/" element={<LandingPage />} />

        {/* Organiser dashboard page */}
        <Route path="/organiser" element={<OrganiserPage />} />

        {/* Admin dashboard page */}
        <Route path="/admin" element={<AdminPage/>} />

        <Route path="/user" element={<UserPage />} />
      </Routes>
    </>

    
  );
}

export default App;