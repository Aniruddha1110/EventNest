import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import OrganiserPage from "./OrganiserPage";
// import AdminDashboard from "./AdminPage";
import UserPage from "./UserPage";
import AdminPage from "./AdminPage";
import ProfilePageLayout from "./ProfilePageLayout";
import TicketHistory from "./TicketHistory";
import UserProfilePage from "./UserProfilePage";
import OrganiserProfilePage from "./OrganiserProfilePage";
import { ThemeProvider } from "./ThemeContext";

function App() {
  return (
    <ThemeProvider>
      
      <Routes>
        
        <Route path="/" element={<LandingPage />} />
        <Route path="/organiser" element={<OrganiserPage />} />
        <Route path="/admin" element={<AdminPage/>} />
        <Route path="/user" element={<UserPage />} />
        {/* <Route path="/profile" element={<ProfilePageLayout />} /> */}
        <Route path="/profile/ticket" element={<TicketHistory />} />
        <Route path="/userprofile" element={<UserProfilePage />} />
        <Route path="/organiserprofile" element={<OrganiserProfilePage />} />
      </Routes>
    </ThemeProvider>

    
  );
}

export default App;