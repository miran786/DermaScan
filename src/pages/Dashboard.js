import React, { useState } from "react";
import axios from "axios";

// components
// (Assuming these components exist in your v3 commit)
// import CardSettings from "../../components/Cards/CardSettings.js";
// import CardProfile from "../../components/Cards/CardProfile.js";

export default function Dashboard() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setPrediction(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file first.");
      return;
    }

    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // This is the updated part that points to your live Cloud Run service
      const response = await axios.post(
        'https://dermascan-api-1088919928349.us-central1.run.app/predict',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setPrediction(response.data);
    } catch (err) {
      console.error("Error uploading file:", err);
      setError("Error making prediction. Please check the backend server.");
    } finally {
      setLoading(false);
    }
  };

  // The JSX for your dashboard will be here.
  // This is a simplified example since the original v3 UI code is not fully present.
  return (
    <div className="flex flex-wrap">
      <div className="w-full px-4">
        <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
          <div className="rounded-t mb-0 px-4 py-3 border-0">
            <div className="flex flex-wrap items-center">
              <div className="relative w-full px-4 max-w-full flex-grow flex-1">
                <h3 className="font-semibold text-base text-blueGray-700">
                  DermaScan AI Analysis
                </h3>
              </div>
            </div>
          </div>
          <div className="block w-full overflow-x-auto p-4">
            <input type="file" onChange={handleFileChange} accept="image/jpeg, image/png" />
            <button
              className="bg-indigo-500 text-white active:bg-indigo-600 font-bold uppercase text-xs px-4 py-2 rounded shadow hover:shadow-md outline-none focus:outline-none mr-1 ease-linear transition-all duration-150"
              type="button"
              onClick={handleUpload}
              disabled={loading}
            >
              {loading ? "Analyzing..." : "Analyze Image"}
            </button>
            {error && <p className="text-red-500 text-xs italic mt-2">{error}</p>}
            {preview && (
              <div className="mt-4">
                <h4 className="font-bold">Preview:</h4>
                <img src={preview} alt="Upload preview" className="mt-2 rounded max-h-60" />
              </div>
            )}
            {prediction && (
              <div className="mt-4">
                <h4 className="font-bold">Result:</h4>
                <p><strong>Disease:</strong> {prediction.disease}</p>
                <p><strong>Confidence:</strong> {Math.round(prediction.confidence * 100)}%</p>
                <p><strong>Description:</strong> {prediction.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}