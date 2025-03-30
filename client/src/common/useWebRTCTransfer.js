// src/hooks/useWebRTCTransfer.js - Fixed version
import { useState, useEffect, useRef, useCallback } from 'react';
import WebRTCService from '../common/webrtc'; // Make sure the import path is correct

const useWebRTCTransfer = (serverUrl) => {
  const [status, setStatus] = useState('idle'); // idle, connecting, connected, transferring, completed, failed
  const [progress, setProgress] = useState(0);
  const [transferSpeed, setTransferSpeed] = useState('0 MB/s');
  const [timeRemaining, setTimeRemaining] = useState('Calculating...');
  const [sessionId, setSessionId] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [receivedFile, setReceivedFile] = useState(null);
  const [error, setError] = useState(null);
  const [isDataChannelReady, setIsDataChannelReady] = useState(false);

  const webrtcService = useRef(null);
  const transferStartTime = useRef(null);
  const lastUpdateTime = useRef(0);
  const lastTransferred = useRef(0);

  // Initialize WebRTC service
  useEffect(() => {
    // Create a new instance on mount
    webrtcService.current = new WebRTCService();
    const service = webrtcService.current;
    
    // Set up callbacks
    service.onStatusChange = (newStatus) => {
      console.log('Status changed:', newStatus);
      setStatus(newStatus);
      
      if (newStatus === 'transferring' && !transferStartTime.current) {
        transferStartTime.current = Date.now();
      }
    };
    
    service.onTransferProgress = (data) => {
      setProgress(data.progress);
      
      // Calculate transfer speed
      const now = Date.now();
      const transferred = data.sent || data.received || 0;
      
      // Update speed calculation every 500ms
      if (now - lastUpdateTime.current > 500) {
        const timeDiff = (now - lastUpdateTime.current) / 1000; // in seconds
        const bytesDiff = transferred - lastTransferred.current;
        
        if (timeDiff > 0) {
          const bytesPerSecond = bytesDiff / timeDiff;
          const mbps = (bytesPerSecond / (1024 * 1024)).toFixed(1);
          setTransferSpeed(`${mbps} MB/s`);
          
          // Calculate time remaining
          if (transferStartTime.current) {
            const elapsedTime = now - transferStartTime.current;
            const timeRemaining = service.calculateTimeRemaining(
              transferred,
              data.total,
              elapsedTime
            );
            setTimeRemaining(timeRemaining);
          }
        }
        
        lastUpdateTime.current = now;
        lastTransferred.current = transferred;
      }
    };
    
    service.onTransferComplete = (file) => {
      setReceivedFile(file);
      setStatus('completed');
      setProgress(100);
      setTimeRemaining('');
    };
    
    service.onTransferError = (msg) => {
      console.error('Transfer error:', msg);
      setError(msg);
      setStatus('failed');
    };
    
    service.onConnectionEstablished = () => {
      console.log('Connection established - data channel is ready');
      setStatus('connected');
      setIsDataChannelReady(true);
    };
    
    // Connect to signaling server
    service.connect(serverUrl)
      .catch((err) => {
        console.error('Connection error:', err);
        setError('Failed to connect to server');
        setStatus('failed');
      });
    
    // Clean up on unmount
    return () => {
      service.disconnect();
    };
  }, [serverUrl]);

  // Create a new transfer session (sender)
  const createSession = useCallback(async () => {
    setStatus('connecting');
    setError(null);
    
    try {
      const code = await webrtcService.current.createSession();
      setSessionId(code);
      return code;
    } catch (err) {
      console.error('Create session error:', err);
      setError('Failed to create session');
      setStatus('failed');
      throw err;
    }
  }, []);

  // Join an existing session (receiver)
  const joinSession = useCallback(async (code) => {
    setStatus('connecting');
    setError(null);
    
    try {
      await webrtcService.current.joinSession(code);
      setSessionId(code);
    } catch (err) {
      console.error('Join session error:', err);
      setError('Failed to join session');
      setStatus('failed');
      throw err;
    }
  }, []);

  // Set the file to be transferred
  const setFile = useCallback((file) => {
    if (!file) {
      console.error('No file selected');
      return;
    }
    
    console.log('Setting file:', file.name);
    webrtcService.current.setFile(file);
    setFileInfo({
      name: file.name,
      size: file.size,
      type: file.type
    });
  }, []);

  // Start the file transfer
  const startTransfer = useCallback(() => {
    console.log('Starting transfer...');
    if (!fileInfo) {
      setError('No file selected');
      return;
    }
    
    if (status !== 'connected') {
      setError('Not connected to peer');
      return;
    }
    
    // Reset states
    setError(null);
    setProgress(0);
    transferStartTime.current = Date.now();
    lastUpdateTime.current = Date.now();
    lastTransferred.current = 0;
    
    try {
      webrtcService.current.startFileTransfer();
    } catch (err) {
      console.error('Start transfer error:', err);
      setError(`Failed to start transfer: ${err.message}`);
    }
  }, [fileInfo, status]);

  // Cancel the transfer
  const cancelTransfer = useCallback(() => {
    webrtcService.current.closeConnection();
    setStatus('failed');
    setError('Transfer cancelled');
  }, []);

  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  // Download the received file
  const downloadFile = useCallback(() => {
    if (receivedFile) {
      const a = document.createElement('a');
      a.href = receivedFile.url;
      a.download = receivedFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }, [receivedFile]);

  return {
    status,
    progress,
    transferSpeed,
    timeRemaining,
    sessionId,
    fileInfo,
    receivedFile,
    error,
    isDataChannelReady,
    createSession,
    joinSession,
    setFile,
    startTransfer,
    cancelTransfer,
    downloadFile,
    formatFileSize
  };
};

export default useWebRTCTransfer;