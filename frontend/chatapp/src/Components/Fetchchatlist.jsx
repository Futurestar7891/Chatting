import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useCallback, useContext, useMemo } from "react";
import _ from "lodash";
import FilteredUsers from "./FilteredUsers";
import Options from "./Options";
import { StateContext } from "../main";

const Fetchchatlist = ({ setSelectedUser, socket }) => {
  const [search, setSearch] = useState("");
  const [chatusers, setChatUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const Mobile = localStorage.getItem("Mobile");
  const { showbar, setShowbar } = useContext(StateContext);

  // Function to fetch chat list
  const fetchChatList = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:3000/api/search-chatlist",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ Username: Mobile }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setChatUsers(data.users);
        setFilteredUsers(data.users); // Initialize filteredUsers with all users
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, [Mobile]);

  // Fetch chat list on component mount
  useEffect(() => {
    fetchChatList();
  }, [fetchChatList]);

  // Listen for new messages and refresh chat list
  useEffect(() => {
    if (socket) {
      const handleReceiveMessage = () => {
        fetchChatList(); // Re-fetch the chat list whenever a new message is received
      };

      socket.on("receiveMessage", handleReceiveMessage);

      return () => {
        socket.off("receiveMessage", handleReceiveMessage);
      };
    }
  }, [socket, fetchChatList]);

  // Function to fetch contacts
  const fetchContacts = useCallback(
    async (keyword) => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/search-contact",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ Username: Mobile, keyword }),
          }
        );

        const data = await response.json();
        if (data.success) {
          setContacts(data.contacts);
        }
      } catch (error) {
        console.error("Error fetching contacts:", error);
      }
    },
    [Mobile]
  );

  // Debounced search handler
  const handleSearch = useCallback(
    _.debounce((keyword) => {
      if (keyword.trim() === "") {
        setFilteredUsers(chatusers); // Reset to all users if search is empty
        setContacts([]); // Clear contacts
      } else {
        const filtered = chatusers.filter((user) =>
          user.Name.toLowerCase().includes(keyword.toLowerCase())
        );
        setFilteredUsers(filtered);

        // Fetch contacts only if filtered users are 5 or fewer
        if (filtered.length <= 5) {
          fetchContacts(keyword);
        } else {
          setContacts([]); // Clear contacts if filtered users are more than 5
        }
      }
    }, 300),
    [chatusers, fetchContacts]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (e) => {
      const keyword = e.target.value;
      setSearch(keyword);
      handleSearch(keyword);
    },
    [handleSearch]
  );

  // Memoize the rendered chat list to avoid unnecessary re-renders
  const renderedChatList = useMemo(() => {
    return filteredUsers.map((user, index) => (
      <div
        key={index}
        onClick={() => setSelectedUser(user)}
        className="Filteredusermaindiv"
      >
        <FilteredUsers user={user} />
      </div>
    ));
  }, [filteredUsers, setSelectedUser]);

  // Memoize the rendered contacts list
  const renderedContacts = useMemo(() => {
    return contacts.map((contact, index) => (
      <div
        key={index}
        onClick={() => setSelectedUser(contact)}
        className="Filteredusermaindiv"
      >
        <FilteredUsers user={contact} />
      </div>
    ));
  }, [contacts, setSelectedUser]);

  return (
    <div className="Chatappleftdiv">
      <div className="Searchuserinput">
        <div>
          <FontAwesomeIcon
            onClick={() => setShowbar(!showbar)}
            style={{ fontSize: "2vw", cursor: "pointer" }}
            icon={faBars}
          />
        </div>
        <input
          type="text"
          value={search}
          onChange={handleInputChange}
          placeholder="Search users..."
        />
      </div>

      {/* Inline Loader */}
      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      ) : filteredUsers.length > 0 || contacts.length > 0 ? (
        <div className="Searchusers">
          {filteredUsers.length > 0 && <h2>Chats</h2>}
          {renderedChatList}

          {/* Show contacts if filtered users are 5 or fewer */}
          {filteredUsers.length <= 5 && contacts.length > 0 && (
            <div className="Otherusers">
              <h2>Other Contacts</h2>
              {renderedContacts}
            </div>
          )}
        </div>
      ) : (
        <div className="Searchusers">Chat not found</div>
      )}

      {showbar ? <Options /> : ""}
    </div>
  );
};

export default Fetchchatlist;
