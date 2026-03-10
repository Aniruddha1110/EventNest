import ProfilePageLayout from './ProfilePageLayout';
import TicketHistory from './TicketHistory'; // (Assume you extracted the tickets into this)

const UserProfilePage = () => {
    const currentUser = { name: "Alex Johnson", username: "@alexj_events", role: "user", phone: "+91 98765 43210", email: "alex.johnson@example.com" };

  return (
    <ProfilePageLayout user={currentUser}>
       {/* Everything here goes into the RIGHT column */}


       {/* <button
            onClick = {() => window.location.href = "mailto: abhishekpayra7@gmail.com?subject=EventSphere User Feedback"}
            className = "w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-grey-50 transition border border-grey-500"
        >
            💡 Provide Feedback
       </button> */}

       <TicketHistory /> 
    </ProfilePageLayout>
  );
};

export default UserProfilePage;