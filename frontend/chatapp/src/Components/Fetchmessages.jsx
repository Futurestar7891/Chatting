import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Message from "./Message";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faFaceSmile,
  faLink,
  faMicrophone,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import AttachmentPopup from "./AttachmentPopup";
import PreviewPopup from "./PreviewPopup";

const FetchMessages = ({ selectedUser, socket }) => {
  const popupRef = useRef(null);
  const receiverId = selectedUser._id;
  const senderId = localStorage.getItem("id"); // Replace dynamically
  const [recieverphoto, setRecieverPhoto] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [showAttachmentPopup, setShowAttachmentPopup] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [showPreviewPopup, setShowPreviewPopup] = useState(false);
  const senderphoto = localStorage.getItem("Photo");

  // Fetch messages from the backend
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:3000/api/fetch-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ senderid: senderId, receiverid: receiverId }),
      });

      const data = await response.json();
      if (data.success) {
        setMessages(data.messages || []);
        setRecieverPhoto(data.userphoto);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, [receiverId, senderId]);

  // Set up socket listeners
  useEffect(() => {
    if (!receiverId || !socket) return;

    setLoading(true);
    fetchMessages();

    const chatKey =
      senderId < receiverId
        ? `${senderId}-${receiverId}`
        : `${receiverId}-${senderId}`;

    socket.emit("joinRoom", chatKey);

    const handleReceiveMessage = (newMessage) => {
      console.log("Received message:", newMessage.senderId);

      setMessages((prevMessages) => {
        // Check for duplicates
        const isDuplicate = prevMessages.some(
          (msg) => msg.timestamp === newMessage.timestamp
        );
        if (!isDuplicate) {
          return [...prevMessages, newMessage];
        }
        return prevMessages;
      });
    };

    // Clean up previous listener and add a new one
    socket.off("receiveMessage", handleReceiveMessage);
    socket.on("receiveMessage", handleReceiveMessage);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
    };
  }, [receiverId, socket, fetchMessages, senderId]);

  // Close attachment popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowAttachmentPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAttachmentPopup]);

  // Handle file selection from the attachment popup
  const handleFileSelect = useCallback((files) => {
    setSelectedFiles(files); // Set the selected files
    setShowPreviewPopup(true); // Show the preview popup
    setShowAttachmentPopup(false); // Close the attachment popup
  }, []);

  // Toggle attachment popup
  const handleAttachmentClick = useCallback(() => {
    setShowAttachmentPopup((prev) => !prev);
  }, []);

  // Send a new message
  const handleSendMessage = useCallback(
    async (e) => {
      e.preventDefault();
      if (!messageInput.trim() && selectedFiles.length === 0) return;

      const newMessage = {
        senderId: senderId,
        receiverId: receiverId,
        text: messageInput,
        files: selectedFiles.map((file) => ({
          name: file.name,
          type: file.type,
          data: file.data,
        })),
        timestamp: new Date(),
      };

      try {
        const response = await fetch("http://localhost:3000/api/send-receive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senderid: senderId,
            receiverid: receiverId,
            message: newMessage,
          }),
        });

        const data = await response.json();
        if (data.success) {
          setMessageInput("");
          setSelectedFiles([]);
          setShowPreviewPopup(false);
        } else {
          console.error("Failed to send message:", data.message);
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    },
    [messageInput, selectedFiles, senderId, receiverId]
  );

  const renderedMessages = useMemo(() => {
    return messages.map((msg, index) => (
      <Message
        userphoto={
          msg.senderId && msg.senderId._id === senderId
            ? senderphoto
            : recieverphoto
        }
        key={index}
        message={msg}
        isSent={msg.senderId && msg.senderId._id === senderId}
      />
    ));
  }, [messages, senderId, recieverphoto, senderphoto]);

  return (
    <div className="Chatapprightdiv">
      <div className="Chatapprightdivtopdiv">
        <h2>Chat with {selectedUser.Name}</h2>
      </div>
      {receiverId ? (
        <div
          style={{ background: `url('/background.jpg')` }}
          className="Chatapprightdivdowndiv"
        >
          {loading ? (
            <div className="loader-container">
              <div className="loader"></div>
            </div>
          ) : (
            <div className="messages-container">{renderedMessages}</div>
          )}
        </div>
      ) : (
        <div
          style={{
            backgroundColor: "rgb(70, 69, 69)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            color: "black",
            fontSize: "2vw",
          }}
          className="Chatapprightdivdowndiv"
        >
          {" "}
          Send or recieve message via choosing chatuser
        </div>
      )}

      {receiverId ? (
        <form
          onSubmit={handleSendMessage}
          className="Chatapprightdivmessagediv"
        >
          <div className="Attachfile" ref={popupRef}>
            <FontAwesomeIcon icon={faLink} onClick={handleAttachmentClick} />
            {showAttachmentPopup && (
              <AttachmentPopup
                onFileSelect={handleFileSelect}
                onClose={() => setShowAttachmentPopup(false)}
              />
            )}
          </div>
          <div className="Attachfile">
            <FontAwesomeIcon icon={faFaceSmile} />
          </div>
          <div className="Attachfile">
            <FontAwesomeIcon icon={faMicrophone} />
          </div>
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
          />
          <button type="submit" className="sendmessage">
            <FontAwesomeIcon
              icon={faPaperPlane}
              style={{
                cursor:
                  messageInput.trim() || selectedFiles.length > 0
                    ? "pointer"
                    : "not-allowed",
              }}
            />
          </button>
          {showPreviewPopup && (
            <PreviewPopup
              files={selectedFiles}
              onFileSelect={handleFileSelect}
            />
          )}
        </form>
      ) : (
        <div
          className="Chatapprightdivmessagediv"
          style={{ backgroundColor: "rgb(70, 69, 69)" }}
        ></div>
      )}
    </div>
  );
};

export default FetchMessages;
