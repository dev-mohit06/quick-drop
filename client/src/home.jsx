import { Link } from "react-router-dom" 
import Header from "./components/header"

export default function Home() {
  return (
    <>
      <Header />
      <div className="relative min-h-screen overflow-hidden">
        <div className="bg-noise"></div>

        {/* Watermark text */}
        <div className="watermark-text" style={{ top: "10%", left: "-5%" }}>
          QUICKDROP
        </div>
        <div className="watermark-text" style={{ top: "30%", left: "20%" }}>
          TRANSFER
        </div>
        <div className="watermark-text" style={{ top: "50%", left: "-10%" }}>
          SECURE
        </div>
        <div className="watermark-text" style={{ top: "70%", left: "15%" }}>
          QUICKDROP
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
              YOUR FILES ARE ABOUT TO GET
              <span className="block text-gradient">TRANSFERRED</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/70 mb-12 max-w-2xl">
              Transfer files directly between devices{" "}
              <span className="text-white font-medium">without uploading to a server</span>. Fast, secure, and simple.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/create" className="button-primary text-lg px-8 py-4">
                Create Session
              </Link>
              <Link to="/join" className="button-secondary text-lg px-8 py-4">
                Join Session
              </Link>
            </div>

            <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
              <div className="card p-6">
                <div className="w-12 h-12 rounded-full bg-[#FF5A5F]/10 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FF5A5F"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Create a session</h3>
                <p className="text-white/70">Upload your file and generate a unique session code to share</p>
              </div>

              <div className="card p-6">
                <div className="w-12 h-12 rounded-full bg-[#00E5A0]/10 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#00E5A0"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Share the code</h3>
                <p className="text-white/70">Give the 6-digit code to the recipient to establish connection</p>
              </div>

              <div className="card p-6">
                <div className="w-12 h-12 rounded-full bg-[#FF5A5F]/10 flex items-center justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FF5A5F"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Transfer complete</h3>
                <p className="text-white/70">Files transfer directly between devices with end-to-end encryption</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}