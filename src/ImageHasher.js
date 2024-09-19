// src/ImageHasher.js

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import CryptoJS from 'crypto-js';
import imageCompression from 'browser-image-compression';

const ImageHasher = () => {
  const [imagesData, setImagesData] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]); // For showing image previews
  const [includeTimestamp, setIncludeTimestamp] = useState(false);
  const [customTimestamp, setCustomTimestamp] = useState(''); // Custom timestamp
  const [useCurrentTimestamp, setUseCurrentTimestamp] = useState(true); // Option to toggle
  const [includeLocation, setIncludeLocation] = useState(false);
  const [locationString, setLocationString] = useState('');
  const [customLocation, setCustomLocation] = useState({ latitude: '', longitude: '' });
  const [useCurrentLocation, setUseCurrentLocation] = useState(true); // Option to toggle
  const [customString, setCustomString] = useState('');
  const [hash, setHash] = useState('');
  const [loading, setLoading] = useState(false);

  // Handle file drop and image preview
  const onDrop = useCallback(async (acceptedFiles) => {
    setLoading(true);
    const compressedImagesData = [];
    const previews = [];

    for (const file of acceptedFiles) {
      // Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      try {
        const compressedFile = await imageCompression(file, options);
        const reader = new FileReader();
        reader.onloadend = () => {
          compressedImagesData.push(reader.result);
          previews.push(URL.createObjectURL(file)); // Create image preview
          if (compressedImagesData.length === acceptedFiles.length) {
            setImagesData(compressedImagesData);
            setImagePreviews(previews);
            setLoading(false);
          }
        };
        reader.readAsDataURL(compressedFile); // Read as Base64 string
      } catch (error) {
        console.error('Error processing image:', error);
        setLoading(false);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  // Get Geolocation
  const fetchLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const latitude = position.coords.latitude.toFixed(6);
          const longitude = position.coords.longitude.toFixed(6);
          setLocationString(`${latitude},${longitude}`);
        },
        (error) => {
          console.error('Error fetching location:', error);
          setIncludeLocation(false);
          alert('Unable to fetch location.');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  };

  // Handle Hash Generation
  const generateHash = () => {
    setLoading(true);
    let entropySources = '';

    // Include images data
    if (imagesData.length > 0) {
      entropySources += imagesData.join('-');
    }

    // Include timestamp
    if (includeTimestamp) {
      const timestamp = useCurrentTimestamp
        ? new Date().toISOString()
        : customTimestamp;
      entropySources += `-${timestamp}`;
    }

    // Include location
    if (includeLocation) {
      const location = useCurrentLocation
        ? locationString
        : `${customLocation.latitude},${customLocation.longitude}`;
      entropySources += `-${location}`;
    }

    // Include custom string
    if (customString.trim() !== '') {
      entropySources += `-${customString.trim()}`;
    }

    // Generate hash
    const finalHash = CryptoJS.SHA256(entropySources).toString();
    setHash(finalHash);
    setLoading(false);
  };

  // Handle location toggle
  const handleLocationToggle = () => {
    if (useCurrentLocation && !includeLocation) {
      fetchLocation();
    }
    setIncludeLocation(!includeLocation);
  };

  return (
    <div>
      <h2>Unique Slice of Time and Space Hasher</h2>

      {/* Image Upload */}
      <div
        {...getRootProps()}
        style={{
          border: '2px dashed #cccccc',
          padding: '20px',
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        <input {...getInputProps()} accept="image/*" multiple />
        {isDragActive ? (
          <p>Drop the images here ...</p>
        ) : (
          <p>Drag & drop images here, or click to select images</p>
        )}
      </div>

      {/* Show previews after successful upload */}
      {imagePreviews.length > 0 && (
        <div>
          <h3>Uploaded Images:</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {imagePreviews.map((preview, index) => (
              <img
                key={index}
                src={preview}
                alt={`Uploaded ${index}`}
                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Entropy Options */}
      <div style={{ marginBottom: '20px' }}>
        {/* Timestamp Selection */}
        <label>
          <input
            type="checkbox"
            checked={includeTimestamp}
            onChange={() => setIncludeTimestamp(!includeTimestamp)}
          />
          Include Timestamp
        </label>
        {includeTimestamp && (
          <div>
            <label>
              <input
                type="radio"
                checked={useCurrentTimestamp}
                onChange={() => setUseCurrentTimestamp(true)}
              />
              Use Current Timestamp
            </label>
            <label style={{ marginLeft: '10px' }}>
              <input
                type="radio"
                checked={!useCurrentTimestamp}
                onChange={() => setUseCurrentTimestamp(false)}
              />
              Custom Timestamp:
            </label>
            {!useCurrentTimestamp && (
              <input
                type="datetime-local"
                value={customTimestamp}
                onChange={(e) => setCustomTimestamp(e.target.value)}
                style={{ marginLeft: '10px' }}
              />
            )}
          </div>
        )}

        {/* Location Selection */}
        <label>
          <input
            type="checkbox"
            checked={includeLocation}
            onChange={handleLocationToggle}
          />
          Include Location
        </label>
        {includeLocation && (
          <div>
            <label>
              <input
                type="radio"
                checked={useCurrentLocation}
                onChange={() => setUseCurrentLocation(true)}
              />
              Use Current Location
            </label>
            <label style={{ marginLeft: '10px' }}>
              <input
                type="radio"
                checked={!useCurrentLocation}
                onChange={() => setUseCurrentLocation(false)}
              />
              Custom Location:
            </label>
            {!useCurrentLocation && (
              <div>
                <input
                  type="text"
                  value={customLocation.latitude}
                  placeholder="Latitude"
                  onChange={(e) =>
                    setCustomLocation({
                      ...customLocation,
                      latitude: e.target.value,
                    })
                  }
                  style={{ marginRight: '10px', width: '150px' }}
                />
                <input
                  type="text"
                  value={customLocation.longitude}
                  placeholder="Longitude"
                  onChange={(e) =>
                    setCustomLocation({
                      ...customLocation,
                      longitude: e.target.value,
                    })
                  }
                  style={{ width: '150px' }}
                />
              </div>
            )}
          </div>
        )}

        {/* Custom String */}
        <label>
          Custom String:
          <input
            type="text"
            value={customString}
            onChange={(e) => setCustomString(e.target.value)}
            placeholder="Enter custom text"
            style={{ marginLeft: '10px', width: '200px' }}
          />
        </label>
      </div>

      {/* Generate Hash Button */}
      <button onClick={generateHash} disabled={loading}>
        {loading ? 'Processing...' : 'Generate Hash'}
      </button>

      {/* Display Hash */}
      {hash && (
        <div style={{ marginTop: '20px' }}>
          <h3>Your Unique Hash:</h3>
          <textarea
            readOnly
            value={hash}
            style={{ width: '100%', height: '100px' }}
          />
        </div>
      )}
    </div>
  );
};

export default ImageHasher;