import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useWebRTCTransfer from "../common/useWebRTCTransfer";

export default function JoinSession() {
  const [sessionCode, setSessionCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();
  
  // Initialize WebRTC hook with your signaling server URL
  const webRTC = useWebRTCTransfer(import.meta.env.VITE_SIGNALING_SERVER_URL);

  // Monitor status changes
  useEffect(() => {
    if (webRTC.status === "connected") {
      // Successfully connected to session
      setIsJoining(false);
      navigate("/transfer", { 
        state: { 
          sessionId: webRTC.sessionId,
          isReceiver: true 
        } 
      });
    } else if (webRTC.status === "failed") {
      setIsValidating(false);
      setIsJoining(false);
      setErrorMessage(webRTC.error || "Failed to join session. Invalid code or connection error.");
    }
  }, [webRTC.status, webRTC.sessionId, webRTC.error, navigate]);

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
    setSessionCode(value);
    setErrorMessage("");
  };

  const joinSession = async () => {
    if (sessionCode.length !== 6) {
      return;
    }

    setIsValidating(true);
    setErrorMessage("");

    try {
      // Attempt to join the session with the provided code
      await webRTC.joinSession(sessionCode);
      setIsValidating(false);
      setIsJoining(true);
    } catch (error) {
      setIsValidating(false);
      setIsJoining(false);
      setErrorMessage("Invalid session code or session expired");
      console.error("Join session error:", error);
    }
  };

  return (
    <>
      <div className="relative min-h-screen overflow-hidden">
        <div className="bg-noise"></div>

        {/* Watermark text */}
        <div className="watermark-text" style={{ top: "20%", left: "10%" }}>
          JOIN
        </div>
        <div className="watermark-text" style={{ top: "50%", left: "20%" }}>
          CONNECT
        </div>
        <div className="watermark-text" style={{ top: "80%", left: "30%" }}>
          RECEIVE
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
          <div className="max-w-lg mx-auto">
            <h1 className="text-4xl font-black mb-8 text-center">Join Transfer Session</h1>

            <div className="card">
              <div className="p-6 space-y-6">
                <div className="text-center mb-6">
                  <p className="text-white/70 mb-2">Enter the 6-digit session code provided by the sender</p>
                </div>

                <div className="space-y-6">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="000000"
                    value={sessionCode}
                    onChange={handleCodeChange}
                    className="input text-center text-3xl tracking-widest font-bold"
                    maxLength={6}
                  />

                  {errorMessage && (
                    <div className="text-red-500 text-sm text-center">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    className={`button-primary w-full ${sessionCode.length !== 6 || isValidating || isJoining ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={joinSession}
                    disabled={sessionCode.length !== 6 || isValidating || isJoining}
                  >
                    {isValidating ? (
                      <div className="flex items-center justify-center gap-2">
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
                        Validating...
                      </div>
                    ) : isJoining ? (
                      <div className="flex items-center justify-center gap-2">
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
                        Establishing Connection...
                      </div>
                    ) : (
                      "Join Session"
                    )}
                  </button>
                </div>
              </div>

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