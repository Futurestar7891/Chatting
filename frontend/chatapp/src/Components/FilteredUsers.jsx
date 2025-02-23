import { StateContext } from "../main";
import { useContext } from "react";

const FilteredUsers = ({ user }) => {
  const { setShowUserPublicProfileData, setShowPublicProfile } =
    useContext(StateContext);
  // Ensure lastMessageTime exists and is a valid date
  const lastMessageTime = user.lastMessageTime
    ? new Date(user.lastMessageTime)
    : null;

  // Limit name to 15 characters and add "..." if it exceeds
  const displayName =
    user.Name.length > 15 ? user.Name.substring(0, 15) + "..." : user.Name;

  return (
    <>
      <div className="Filtereduserleftdiv">
        <div className="Filtereduserphoto">
          <img
            onClick={() => {
              setShowUserPublicProfileData(user);
              setShowPublicProfile(true);
            }}
            src={user.Photo}
            alt={user.Name}
          />
        </div>

        <div className="Filteredusernamedetail">
          <h2>{displayName}</h2>
          <p>{user.recentmsg || "No recent messages"}</p>{" "}
          {/* Handle empty recent messages */}
        </div>
      </div>
      <div className="Filtereduserrightdiv">
        {lastMessageTime && !isNaN(lastMessageTime) ? ( // ✅ Ensure date is valid
          <>
            <p>{lastMessageTime.toLocaleDateString()}</p>
            <p>{lastMessageTime.toLocaleTimeString()}</p>
          </>
        ) : (
          <p>No time available</p> // ✅ Handle invalid date
        )}
      </div>
    </>
  );
};

export default FilteredUsers;
