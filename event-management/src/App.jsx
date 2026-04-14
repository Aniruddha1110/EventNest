import { Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import OrganiserPage from "./OrganiserPage";
import UserPage from "./UserPage";
import AdminPage from "./AdminPage";
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
import LoginPage from "./LoginPage";
import OAuthCallbackPage from "./OAuthCallbackPage";
import ForgotPasswordPage from "./ForgotPasswordPage";
import VerifyOtpPage from "./VerifyOtpPage";
import ResetPasswordPage from "./ResetPasswordPage";

function App() {
  return (
    <ThemeProvider>
      <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/roleselect" element={<RoleSelectPage />} />
          <Route path="/select-role" element={<RoleSelectPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          <Route path="/oauth2/redirect" element={<OAuthCallbackPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Registration after OTP */}
          <Route path="/register/user" element={<SignUpPage />} />
          <Route path="/register/organiser" element={<SignUpPage />} />

          {/* Dashboards */}
          <Route path="/user" element={<UserPage />} />
          <Route path="/organiser" element={<OrganiserPage />} />
          <Route path="/admin" element={<AdminPage />} />

          {/* Profile */}
          <Route path="/userprofile" element={<UserProfilePage />} />
          <Route path="/organiserprofile" element={<OrganiserProfilePage />} />
          <Route path="/profile/ticket" element={<TicketHistory />} />

          {/* Events — specific paths BEFORE dynamic :eventId */}
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/ongoing" element={<OngoingEventsPage />} />
          <Route path="/events/upcoming" element={<UpcomingEventsPage />} />
          <Route path="/events/completed" element={<CompletedEventsPage />} />
          <Route path="/events/create" element={<CreateEventPage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
          <Route path="/events/:eventId/ticket" element={<TicketPage />} />
          <Route path="/events/:eventId/payment" element={<PaymentPage />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;