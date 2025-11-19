import React, { useState } from "react";
import { extractPalette } from "../colourextract/colourhelper";

export const Page = () => {
  const [imgURL, setImgURL] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [numColors, setNumColors] = useState(5);
  const [granularity, setGranularity] = useState(50);
  const [palette, setPalette] = useState([]);
  const [metrics, setMetrics] = useState(null); // <-- new state for metrics

  const handleFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImgURL(url);
    setStatus("Ready to start");
    setPalette([]);
    setMetrics(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
  };

  const removeImage = () => {
    setImgURL("");
    setStatus("Idle");
    setPalette([]);
    setMetrics(null);
  };

  const startProcessing = async () => {
    if (!imgURL) return;

    setStatus(`Starting...`);
    const img = new Image();
    img.src = imgURL;
    img.onload = async () => {
      // extractPalette now returns { colors, ssd }
      const result = await extractPalette(img, numColors, setStatus, granularity); 
      setPalette(result.colors);
      setMetrics({ ssd: result.ssd });
      setStatus("Done!");
    };
  };

  return (
    <div className="outer">

      {/* Header */}
      <div className="header">
        <h1>K-means / Clustering Image Colour Extractor</h1>
                <p className="subtitle">This page uses (browserside) K-means clustering to find the best 
                    (average) colours in an image
                </p>
<a href="https://github.com/2of/Colour-Extractor-Image-Web">
  <button>Code</button>
</a>

        <p className="subtitle">Upload or drag an image to begin.</p>
      </div>

      {/* Drag & Drop Zone */}
{!imgURL && (
  <div
    className={`dropZone ${dragActive ? "active" : ""}`}
    onDragEnter={handleDrag}
    onClick={() => document.getElementById("fileInput").click()} // <-- trigger input click
  >
    <input
      type="file"
      accept="image/*"
      id="fileInput" // add id
      className="fileInput"
      onChange={handleChange}
      style={{ display: "none" }} // keep it hidden
    />
    <div
      className="dropContent"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      {dragActive ? <p>Drop it here ✨</p> : <p>Drag & drop an image or click to upload</p>}
    </div>
  </div>
)}



      {imgURL && (
        <div className="previewContainer">
          <img src={imgURL} alt="Uploaded" className="previewImage" />
        </div>
      )}


      {imgURL && (
        <div className="sliderContainer">
          <label htmlFor="numColors">Number of colours: {numColors}</label>
          <input
            id="numColors"
            type="range"
            min="2"
            max="10"
            value={numColors}
            onChange={(e) => setNumColors(Number(e.target.value))}
          />
        </div>
      )}

      {imgURL && (
        <div className="sliderContainer">
          <label htmlFor="granularity">Granularity (pixels sampled) (recommend 50): {granularity}</label>
          <input
            id="granularity"
            type="range"
            min="1"
            max="100"
            value={granularity}
            onChange={(e) => setGranularity(Number(e.target.value))}
          />
        </div>
      )}

          <p> K = 10 is fixed</p>
      {imgURL && (
        <div className="buttonRow">
          <button className="removeBtn" onClick={removeImage}>
            Remove Image
          </button>
          
          <button className="startBtn" onClick={startProcessing}>
            Start
          </button>
        </div>
      )}


      {imgURL && (
        <div className="statusContainer">
          <p className="liveStatus">Status: {status}</p>
        </div>
      )}

{palette.length > 0 && (
  <div className="paletteRow">
    {palette.map((color, idx) => (
      <div
        key={idx}
        className="colorBox"
        style={{ background: color }}
        title={`Click to copy ${color}`}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(color);
            setStatus(`Copied ${color} to clipboard!`);
            // Reset status after 2 seconds
     
          } catch (err) {
            setStatus("Failed to copy colour");
         
          }
        }}
      />
    ))}
  </div>
)}



      {metrics && (
        <div className="metricsContainer">
          <p>Total SSD: {metrics.ssd.toFixed(2)}</p>
        </div>
      )}


      {imgURL && palette.length === 0 && (
        <div className="resultsPlaceholder">
          <p>The extracted palette will appear here.</p>
        </div>
      )}

      <footer className="footer">
        <p>Built with ❤️ by Noah</p>
      </footer>
    </div>
  );
};
