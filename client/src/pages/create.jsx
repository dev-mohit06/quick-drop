import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useWebRTCTransfer from "../common/useWebRTCTransfer";

export default function CreateSession() {
  const [file, setFile] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const navigate = useNavigate();
  
  // Initialize the WebRTC hook with your signaling server URL
  const {
    status,
    sessionId,
    createSession,
    setFile: setTransferFile,
    formatFileSize
  } = useWebRTCTransfer(import.meta.env.VITE_SIGNALING_SERVER_URL);

  // Handle file selection
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setTransferFile(selectedFile); // Set file in the WebRTC service
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      setTransferFile(droppedFile); // Set file in the WebRTC service
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Generate session code using the WebRTC service
  const generateSessionCode = async () => {
    if (!file) return;
    
    try {
      await createSession();
    } catch (err) {
      console.error("Failed to create session:", err);
      // Handle error - perhaps show an error message to the user
    }
  };

  const copySessionCode = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const removeFile = () => {
    setFile(null);
    // You might want to add a reset function to your WebRTC hook if needed
  };

  return (
    <>
      <div className="relative min-h-screen overflow-hidden">
        <div className="bg-noise"></div>

        {/* Watermark text */}
        <div className="watermark-text" style={{ top: "20%", left: "10%" }}>
          UPLOAD
        </div>
        <div className="watermark-text" style={{ top: "50%", left: "50%" }}>
          SHARE
        </div>
        <div className="watermark-text" style={{ top: "80%", left: "30%" }}>
          TRANSFER
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
          <div className="max-w-lg mx-auto">
            <h1 className="text-4xl font-black mb-8 text-center">Create Transfer Session</h1>

            <div className="card">
              {!file ? (
                <div
                  className="flex flex-col items-center justify-center p-12 cursor-pointer border-2 border-dashed border-white/10 m-6 rounded-lg transition-all hover:border-white/20"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[#FF5A5F] mb-6"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <p className="text-xl font-medium mb-2">Drag and drop your file here</p>
                  <p className="text-white/50 mb-4">or click to browse</p>
                  <p className="text-xs text-white/30">Supports any file type up to 2GB</p>
                  <input id="file-upload" type="file" className="hidden" onChange={handleFileSelect} />
                </div>
              ) : (
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#FF5A5F]/10 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#FF5A5F"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-xs text-white/50">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <button
                      onClick={removeFile}
                      className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  {!sessionId ? (
                    <button 
                      className="button-primary w-full" 
                      onClick={generateSessionCode} 
                      disabled={status === 'connecting'}
                    >
                      {status === 'connecting' ? (
                        <div className="flex items-center gap-2">
                          <svg
                            className="animate-spin h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Generating...
                        </div>
                      ) : (
                        "Generate Session Code"
                      )}
                    </button>
                  ) : (
                    <div className="space-y-6">
                      <div className="text-center">
                        <p className="text-white/50 mb-2">Share this code with the recipient</p>
                        <div className="flex items-center justify-center gap-2">
                          <div className="text-4xl font-bold tracking-widest bg-white/5 px-6 py-3 rounded-lg">
                            {sessionId}
                          </div>
                          <button
                            onClick={copySessionCode}
                            className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                          >
                            {copySuccess ? (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#00E5A0"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                              </svg>
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="text-center p-4 rounded-lg bg-white/5">
                        <p className="text-white/70">Transfer will start automatically when recipient connects</p>
                        {status === 'connecting' && (
                          <div className="flex items-center justify-center gap-2 mt-2 text-white/50">
                            <svg
                              className="animate-spin h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Waiting for recipient...
                          </div>
                        )}
                        {status === 'connected' && (
                          <div className="flex items-center justify-center gap-2 mt-2 text-green-400">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                              <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            Recipient connected - Transfer starting
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-white/5 p-4 text-center">
                <p className="text-xs text-white/30">
                  Files are transferred directly between devices and are not stored on our servers
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}