const Message = ({ message, isSent, userphoto }) => {
  return (
    <div className={`message ${isSent ? "sent" : "received"}`}>
      <div className="userphotodiv">
        <img src={userphoto} alt=" " />
      </div>
      <div className={`messagesdiv  ${isSent ? "sendermsg" : "receivermsg"}`}>
        {message.files &&
          message.files.map((file, index) => {
            const base64Data = `data:${file.type};base64,${file.data}`;

            if (file.type.startsWith("image")) {
              return (
                <div className="message-media" key={index}>
                  <img src={base64Data} alt={file.name} />
                </div>
              );
            } else if (file.type.startsWith("video")) {
              return (
                <div className="message-media" key={index}>
                  <video controls src={base64Data} />
                </div>
              );
            } else if (file.type.startsWith("audio")) {
              return (
                <div className="message-media" key={index}>
                  <audio controls src={base64Data} />
                </div>
              );
            } else {
              return (
                <div className="message-media" key={index}>
                  <a href={base64Data} download={file.name}>
                    Download {file.name}
                  </a>
                </div>
              );
            }
          })}
        <div className="messagetextdiv">
          <p>
            {message.text}{" "}
            <span className="message-timestamp">
              {new Date(message.timestamp).toLocaleTimeString()}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Message;
