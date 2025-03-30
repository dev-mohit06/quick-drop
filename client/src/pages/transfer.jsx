import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useWebRTCTransfer from "../common/useWebRTCTransfer";

export default function TransferPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { sessionId, isReceiver } = location.state || {};
  
  // Initialize WebRTC hook with your signaling server URL
  const webRTC = useWebRTCTransfer(import.meta.env.VITE_SIGNALING_SERVER_URL);
  
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("connecting");
  const [transferSpeed, setTransferSpeed] = useState("0 MB/s");
  const [timeRemaining, setTimeRemaining] = useState("Calculating...");
  const [fileInfo, setFileInfo] = useState(null);

  // Redirect if no session information is provided
  useEffect(() => {
    if (!sessionId) {
      navigate("/");
    }
  }, [sessionId, navigate]);

  // Connect to the session if we have session info
  useEffect(() => {
    if (sessionId && !webRTC.sessionId) {
      // If already joined through previous page, this won't run again
      if (isReceiver && webRTC.status === "idle") {
        webRTC.joinSession(sessionId);
      }
    }
  }, [sessionId, isReceiver, webRTC]);

  // Monitor WebRTC status changes
  useEffect(() => {
    // Map WebRTC status to component status
    switch (webRTC.status) {
      case "idle":
      case "connecting":
        setStatus("connecting");
        break;
      case "connected":
        setStatus("connecting"); // Still connecting until transfer begins
        break;
      case "transferring":
        setStatus("transferring");
        break;
      case "completed":
        setStatus("completed");
        break;
      case "failed":
        setStatus("failed");
        break;
      default:
        setStatus("connecting");
    }

    // Update file info when available
    if (webRTC.fileInfo) {
      setFileInfo(webRTC.fileInfo);
    } else if (webRTC.receivedFile) {
      setFileInfo({
        name: webRTC.receivedFile.name,
        size: webRTC.formatFileSize(webRTC.receivedFile.size),
        type: webRTC.receivedFile.type
      });
    }

    // Update progress and transfer metrics
    if (webRTC.progress) {
      setProgress(webRTC.progress);
    }
    
    if (webRTC.transferSpeed) {
      setTransferSpeed(webRTC.transferSpeed);
    }
    
    if (webRTC.timeRemaining) {
      setTimeRemaining(webRTC.timeRemaining);
    }
  }, [webRTC.status, webRTC.fileInfo, webRTC.receivedFile, webRTC.progress, webRTC.transferSpeed, webRTC.timeRemaining]);

  const cancelTransfer = () => {
    webRTC.cancelTransfer();
    setStatus("failed");
  };

  const downloadFile = () => {
    webRTC.downloadFile();
  };

  // Determine file icon based on type
  const getFileIcon = () => {
    if (!fileInfo) return null;
    
    if (fileInfo.type && fileInfo.type.startsWith("image/")) {
      return (
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
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      );
    }
    
    // Default file icon
    return (
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
    );
  };

  return (
    <>
      <div className="relative min-h-screen overflow-hidden">
        <div className="bg-noise"></div>

        {/* Watermark text */}
        <div className="watermark-text" style={{ top: "20%", left: "-5%" }}>
          TRANSFER
        </div>
        <div className="watermark-text" style={{ top: "50%", left: "20%" }}>
          PROGRESS
        </div>
        <div className="watermark-text" style={{ top: "80%", left: "-10%" }}>
          COMPLETE
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
          <div className="max-w-lg mx-auto">
            <h1 className="text-4xl font-black mb-8 text-center">
              {status === "connecting" && "Establishing Connection..."}
              {status === "transferring" && "Transferring File..."}
              {status === "completed" && "Transfer Complete!"}
              {status === "failed" && "Transfer Failed"}
            </h1>

            <div className="card">
              <div className="p-6 space-y-6">
                {fileInfo ? (
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#FF5A5F]/10 flex items-center justify-center">
                        {getFileIcon()}
                      </div>
                      <div>
                        <p className="font-medium">{fileInfo.name}</p>
                        <p className="text-xs text-white/50">{fileInfo.size}</p>
                      </div>
                    </div>
                    {status === "completed" && (
                      <div className="w-8 h-8 rounded-full bg-[#00E5A0]/10 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
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
                      </div>
                    )}
                    {status === "failed" && (
                      <div className="w-8 h-8 rounded-full bg-[#FF5A5F]/10 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#FF5A5F"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-white/5">
                    <p className="text-center text-white/70">
                      {status === "connecting" ? "Waiting for file information..." : "No file information available"}
                    </p>
                  </div>
                )}

                {status !== "failed" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{Math.round(progress)}%</span>
                      {status !== "completed" && <span>{transferSpeed}</span>}
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    {status !== "completed" && (
                      <p className="text-xs text-white/50 text-right">
                        {status === "connecting" ? "Preparing transfer..." : timeRemaining}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex justify-center gap-4">
                  {status === "transferring" && (
                    <button className="button-secondary" onClick={cancelTransfer}>
                      Cancel Transfer
                    </button>
                  )}

                  {status === "completed" && isReceiver && webRTC.receivedFile && (
                    <button className="button-primary" onClick={downloadFile}>
                      Download File
                    </button>
                  )}

                  {status === "completed" && (
                    <Link to="/" className="button-secondary">
                      Return Home
                    </Link>
                  )}

                  {status === "failed" && (
                    <Link to="/" className="button-primary">
                      Return Home
                    </Link>
                  )}
                </div>
              </div>

              <div className="border-t border-white/5 p-4 text-center">
                <p className="text-xs text-white/30">
                  {status === "connecting" && "Establishing a secure connection..."}
                  {status === "transferring" && "Transfer in progress. Please keep this window open."}
                  {status === "completed" && "File has been successfully transferred."}
                  {status === "failed" && "The transfer was cancelled or encountered an error."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}