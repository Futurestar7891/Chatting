const PreviewPopup = ({ files, onFileSelect }) => {
  const removefile = (index) => {
    onFileSelect(files.filter((file, i) => i !== index));
  };

  return (
    <div className="PreviewPopupmaindiv">
      {files && files.length > 0 && (
        <div className="Filepreview">
          {files.map((file, index) => {
            const base64Data = `data:${file.type};base64,${file.data}`; // Construct Base64 URL

            return (
              <div className="previewindividual" key={index}>
                <p onClick={() => removefile(index)}>X</p>
                {file.type.startsWith("image/") ? (
                  <img src={base64Data} alt={`Selected ${index}`} />
                ) : file.type.startsWith("video/") ? (
                  <video controls src={base64Data} />
                ) : file.type.startsWith("audio/") ? (
                  <audio controls src={base64Data} />
                ) : (
                  <p>Unsupported file type</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PreviewPopup;
