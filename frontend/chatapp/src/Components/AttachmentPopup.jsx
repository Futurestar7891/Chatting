import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faImage,
  faVideo,
  faCamera,
  faAddressBook,
  faFile,
} from "@fortawesome/free-solid-svg-icons";

const AttachmentPopup = ({ onFileSelect, onClose }) => {
  // Handle file selection for multiple files
  const handleFileSelect = (type) => {
    if (type === "camera") {
      openCamera();
    } else {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true; // Allow multiple file selection
      input.accept =
        type === "photo"
          ? "image/*"
          : type === "video"
          ? "video/*"
          : type === "audio"
          ? "audio/*"
          : type === "document"
          ? ".pdf,.doc,.docx"
          : type === "contact"
          ? ""
          : "*";

      input.onchange = (e) => {
        const files = Array.from(e.target.files); // Convert FileList to an array

        // Convert each file to Base64
        const fileReaders = files.map((file) => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                name: file.name,
                type: file.type,
                data: reader.result.split(",")[1], // Base64 data
              });
            };
            reader.readAsDataURL(file); // Convert file to Base64
          });
        });

        // Wait for all files to be converted
        Promise.all(fileReaders).then((fileData) => {
          onFileSelect(fileData); // Pass the Base64 data to the parent
          onClose(); // Close the attachment popup
        });
      };

      input.click();
    }
  };

  // Open camera logic (unchanged)
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement("video");
      video.srcObject = stream;
      video.autoplay = true;

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      const cameraContainer = document.createElement("div");
      cameraContainer.style.position = "fixed";
      cameraContainer.style.top = "0";
      cameraContainer.style.left = "0";
      cameraContainer.style.width = "100%";
      cameraContainer.style.height = "100%";
      cameraContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
      cameraContainer.style.display = "flex";
      cameraContainer.style.flexDirection = "column";
      cameraContainer.style.alignItems = "center";
      cameraContainer.style.justifyContent = "center";
      cameraContainer.style.zIndex = "1000";

      cameraContainer.appendChild(video);

      const captureButton = document.createElement("button");
      captureButton.innerText = "Capture Photo";
      captureButton.style.marginTop = "20px";
      captureButton.style.padding = "10px 20px";
      captureButton.style.backgroundColor = "#3498db";
      captureButton.style.color = "white";
      captureButton.style.border = "none";
      captureButton.style.borderRadius = "5px";
      captureButton.style.cursor = "pointer";

      captureButton.onclick = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          const file = new File([blob], "photo.png", { type: "image/png" });
          onFileSelect([file]); // Pass the captured photo as an array
          onClose();
        }, "image/png");

        stream.getTracks().forEach((track) => track.stop());
        document.body.removeChild(cameraContainer);
      };

      cameraContainer.appendChild(captureButton);
      document.body.appendChild(cameraContainer);
    } catch (error) {
      console.error("Error accessing the camera:", error);
      alert(
        "Unable to access the camera. Please ensure you have granted permission."
      );
    }
  };

  return (
    <div className="AttachmentPopupmaindiv">
      <FontAwesomeIcon
        className="fileicons"
        icon={faImage}
        onClick={() => handleFileSelect("photo")}
      />
      <FontAwesomeIcon
        className="fileicons"
        icon={faVideo}
        onClick={() => handleFileSelect("video")}
      />
      <FontAwesomeIcon
        className="fileicons"
        icon={faCamera}
        onClick={() => handleFileSelect("camera")}
      />
      <FontAwesomeIcon
        className="fileicons"
        icon={faAddressBook}
        onClick={() => handleFileSelect("contact")}
      />
      <FontAwesomeIcon
        className="fileicons"
        icon={faFile}
        onClick={() => handleFileSelect("document")}
      />
    </div>
  );
};

export default AttachmentPopup;
