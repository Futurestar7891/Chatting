import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMessage,
  faPhone,
  faVideo,
  faFile,
} from "@fortawesome/free-solid-svg-icons";
const PublicProfile = ({ showuserpublicprofiledata }) => {
  console.log(showuserpublicprofiledata);
  return (
    <div className="PublicProilemaindiv">
      <div className="PublicProfiletopdiv">
        <img src={showuserpublicprofiledata.Photo} alt="" />
        <p>{showuserpublicprofiledata.Name}</p>
      </div>
      <div className="PublicProfilemiddiv">
        <button>
          <FontAwesomeIcon style={{ fontSize: "2vw" }} icon={faMessage} />
        </button>
        <button>
          <FontAwesomeIcon style={{ fontSize: "2vw" }} icon={faPhone} />
        </button>
        <button>
          <FontAwesomeIcon style={{ fontSize: "2vw" }} icon={faVideo} />
        </button>
        <button>
          <FontAwesomeIcon style={{ fontSize: "2vw" }} icon={faFile} />
        </button>
      </div>
      <div className="PublicProfilebiodiv">{showuserpublicprofiledata.Bio}</div>
      <div className="PublicProfiledowndiv">
        <p>{showuserpublicprofiledata.Email}</p>
        <p>{showuserpublicprofiledata.Mobile}</p>
        {showuserpublicprofiledata.Mobile &&
        showuserpublicprofiledata.Mobile === localStorage.getItem("Mobile") ? (
          <p>Edit Profile</p>
        ) : (
          <p>Block</p>
        )}
      </div>
      <div className="PublicProfilecommomgroup">
        <h2>Common Groups</h2>
        array of groups components
      </div>
    </div>
  );
};

export default PublicProfile;
