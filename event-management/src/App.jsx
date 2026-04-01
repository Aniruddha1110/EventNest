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
import EventsPage from "./EventsPage";
import OngoingEventsPage from "./OngoingEventsPage";
import UpcomingEventsPage from "./UpcomingEventsPage";
import CreateEventPage from "./CreateEventPage";
import EventDetailPage from "./EventDetailPage";
import PaymentPage from "./PaymentPage";
import TicketPage from "./TicketPage";
import RoleSelectPage from "./RoleSelect";
import SignUpPage from "./SignupPage";
import CompletedEventsPage from "./CompletedEventsPage";





function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/organiser" element={<OrganiserPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/user" element={<UserPage />} />
        {/* <Route path="/profile" element={<ProfilePageLayout />} /> */}
        <Route path="/profile/ticket" element={<TicketHistory />} />
        <Route path="/userprofile" element={<UserProfilePage />} />
        <Route path="/organiserprofile" element={<OrganiserProfilePage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route path="/events/ongoing" element={<OngoingEventsPage />} />
        <Route path="/events/upcoming" element={<UpcomingEventsPage />} />
        <Route path="/events/create" element={<CreateEventPage />} />
        <Route path="/events/:eventId/ticket" element={<TicketPage />} />
        <Route path="/events/:eventId/payment" element={<PaymentPage />} />
        <Route path="/profile/ticket" element={<TicketHistory />} />
        <Route path="/roleselect" element={<RoleSelectPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route path="/events/ongoing" element={<OngoingEventsPage />} />
        <Route path="/events/upcoming" element={<UpcomingEventsPage />} />
        <Route path="/events/completed" element={<CompletedEventsPage />} />
        <Route path="/events/:eventId/ticket" element={<TicketPage />} />
        <Route path="/events/:eventId/payment" element={<PaymentPage />} />
        <Route path="/profile/ticket" element={<TicketHistory />} />
        <Route path="/select-role" element={<RoleSelectPage />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
