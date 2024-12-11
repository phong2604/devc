import React, { useState } from "react";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { useAuth } from "react-oidc-context";

const s3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.REACT_APP_API_KEY,
    secretAccessKey: process.env.REACT_APP_OTHER_VALUE,
  },
});

const AddCard = () => {
  const [selectedOption, setSelectedOption] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState(""); // State to store the file content
  const [saving, setSaving] = useState(false); // State for save button status
  const { isAuthenticated, signinRedirect, user } = useAuth();
  const userEmail = user?.profile?.email;

  const getUsernameFromEmail = (email) => {
    return email.split("@")[0];
  };

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    setText("");
    setFile(null);
  };

  const handleFileChange = (event) => setFile(event.target.files[0]);

  const handleTextChange = (event) => setText(event.target.value);

  const formatTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}-${minutes}-${seconds}`;
  };

  const uploadFileToS3 = async (fileToUpload, bucketName) => {
    try {
      const fileExtension = fileToUpload.name.split(".").pop().toLowerCase();
      const timestamp = formatTimestamp();
      const username = getUsernameFromEmail(userEmail);
      const fileName = `${username}-${timestamp}.${fileExtension}`;

      const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: fileToUpload,
        ContentType: fileToUpload.type,
        Metadata: {
          email: userEmail,
          timestamp: timestamp,
        },
      };

      const command = new PutObjectCommand(params);
      await s3Client.send(command);
      alert(
        `File uploaded successfully to bucket "${bucketName}" as "${fileName}"!`
      );
      return fileName;
    } catch (error) {
      console.error("File upload failed:", error);
      return null;
    }
  };

  const fetchFileContentFromS3 = async (fileName, bucketName) => {
    try {
      const command = new GetObjectCommand({
        Bucket: bucketName,
        Key: fileName,
      });
      const data = await s3Client.send(command);

      const body = data.Body;
      const reader = body.getReader();
      const decoder = new TextDecoder();
      let content = "";
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        content += decoder.decode(value, { stream: true });
        done = doneReading;
      }

      try {
        const jsonContent = JSON.parse(content);
        setFileContent(JSON.stringify(jsonContent, null, 2));
      } catch (error) {
        console.error("Failed to parse JSON content:", error);
        setFileContent(content);
      }
    } catch (error) {
      console.error("Failed to fetch file content:", error);
      alert("Error fetching the file. Please check if the file exists.");
    }
  };

  const startPolling = (fileName, bucketName) => {
    const pollingInterval = setInterval(async () => {
      try {
        // Check if the file has the correct extension, and if not, change it to .json
        if (!fileName.endsWith('.json')) {
          fileName = fileName.replace(/\.[^/.]+$/, '.json');  // Change any extension to .json
        }
  
        const response = await s3Client.send(
          new GetObjectCommand({
            Bucket: bucketName,
            Key: fileName,
          })
        );
  
        if (response && response.Body) {
          clearInterval(pollingInterval);
          alert(`File processing completed. File is ready: ${fileName}`);
          fetchFileContentFromS3(fileName, bucketName);
        }
      } catch (error) {
        console.error("Polling failed:", error);
      }
    }, 5000);
  };
  

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!userEmail) {
      alert("User email not found. Please log in.");
      return;
    }

    let fileName = "";
    if (file) {
      const fileExtension = file.name.split(".").pop().toLowerCase();
      const timestamp = formatTimestamp();
      const username = getUsernameFromEmail(userEmail);
      const dynamicFileName = `${username}-${timestamp}.${fileExtension}`;
      const fileWithDynamicName = new File([file], dynamicFileName, {
        type: file.type,
      });

      switch (fileExtension) {
        case "mp4":
          fileName = await uploadFileToS3(fileWithDynamicName, "devcvideo");
          break;
        case "mp3":
          fileName = await uploadFileToS3(fileWithDynamicName, "devcaudio");
          break;
        case "txt":
          fileName = await uploadFileToS3(fileWithDynamicName, "devctext");
          break;
        default:
          console.log("Invalid file type. Only .mp4, .mp3, and .txt files are allowed.");
          return;
      }

      if (fileName) {
        startPolling(fileName, "devcflashcard");
      }
    } else if (text) {
      const timestamp = formatTimestamp();
      const username = getUsernameFromEmail(userEmail);
      let fileName = `${username}-${timestamp}.txt`;

      const textFile = new Blob([text], { type: "text/plain" });
      const textFileWithDynamicName = new File([textFile], fileName, {
        type: "text/plain",
      });

      fileName = await uploadFileToS3(textFileWithDynamicName, "devctext");

      if (fileName) {
        startPolling(fileName, "devcflashcard");
      }
    } else {
      alert("No input provided.");
    }
  };
  const Dynamo_URL = process.env.REACT_APP_API_URL;

const handleSave = async () => {
  setSaving(true);
  try {
    const card = JSON.parse(fileContent); // Access the current card
    let allCardsSaved = true; // Flag to check if all cards were saved successfully

    // Loop through each card and post it individually
    for (let i = 0; i < card.cards.length; i++) {
      const payload = {
        cardid: card.cards[i].cardid,
        backHTML: card.cards[i].backHTML,
        deck: card.cards[i].deck,
        frontHTML: card.cards[i].frontHTML,
      };

      console.log(`Saving card ${card.cards[i].cardid}...`);
      console.log(Dynamo_URL);
      
      const response = await fetch(
        Dynamo_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        console.log(`Card ${card.cards[i].cardid} saved successfully!`);
      } else {
        console.error(`Failed to save card ${card.cards[i].cardid}.`);
        allCardsSaved = false; // Set flag to false if any card fails
      }
    }

    // Show success message only after all cards have been processed
    if (allCardsSaved) {
      alert("All cards saved successfully!");
    } else {
      alert("Some cards failed to save. Please check the console for details.");
    }

  } catch (error) {
    console.error("Error during saving:", error);
    alert("An error occurred while saving the cards.");
  } finally {
    setSaving(false);
  }
};

  return (
    <div>
      <h1>Add Card Page</h1>
      {!isAuthenticated ? (
        <div>
          <p>You must be logged in to upload files.</p>
          <button className="auth-button" onClick={signinRedirect}>
            Log In
          </button>
        </div>
      ) : (
        <>
          <div>
            <button onClick={() => handleOptionClick("file")}>Add File</button>
            <button onClick={() => handleOptionClick("text")}>Enter Text</button>
          </div>
          <form onSubmit={handleSubmit}>
            {selectedOption === "file" && (
              <div>
                <label htmlFor="fileInput">Add File:</label>
                <input
                  type="file"
                  id="fileInput"
                  onChange={handleFileChange}
                  accept=".mp4,.mp3,.txt"
                />
              </div>
            )}
            {selectedOption === "text" && (
              <div>
                <label htmlFor="textInput">Enter Text:</label>
                <textarea
                  id="textInput"
                  value={text}
                  onChange={handleTextChange}
                  rows="4"
                  cols="50"
                />
              </div>
            )}
            <button type="submit">Upload</button>
          </form>
          <p>Result:</p>
          <div>
            {fileContent ? (
              (() => {
                try {
                  const contentJson = JSON.parse(fileContent);
                  if (Array.isArray(contentJson.cards)) {
                    return contentJson.cards.map((card, index) => (
                      <div
                        key={card.cardid || index}
                        style={{
                          marginBottom: "10px",
                          border: "1px solid #ccc",
                          padding: "10px",
                          borderRadius: "5px",
                        }}
                      >
                        <p>
                          <strong>Front:</strong> {card.frontHTML}
                        </p>
                        <p>
                          <strong>Back:</strong> {card.backHTML}
                        </p>
                      </div>
                    ));
                  } else {
                    return <p>Error: Invalid cards format</p>;
                  }
                } catch (error) {
                  console.error("Failed to parse file content as JSON:", error);
                  return <p>{fileContent}</p>;
                }
              })()
            ) : (
              <p>No content to display.</p>
            )}
          </div>
          {fileContent && (
            <button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Card"}
            </button>
          )}

        </>
      )}
    </div>
  );
};

export default AddCard;
