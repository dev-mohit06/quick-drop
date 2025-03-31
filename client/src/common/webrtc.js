// Fixed version of WebRTCService.js
import io from 'socket.io-client';

class WebRTCService {
  constructor() {
    this.socket = null;
    this.peerConnection = null;
    this.dataChannel = null;
    this.sessionId = null;
    this.remotePeerId = null;
    this.isSender = false;
    this.isReceiver = false;
    this.file = null;
    this.fileChunks = [];
    this.receivedSize = 0;
    this.fileSize = 0;
    this.chunkSize = 16384; // 16KB chunks
    this.onStatusChange = null;
    this.onTransferProgress = null;
    this.onTransferComplete = null;
    this.onTransferError = null;
    this.onConnectionEstablished = null;
    this.waitingForNextChunk = false; 
    this.offset = 0; // Initialize offset in constructor
  }

  // Initialize socket connection
  connect(serverUrl) {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(serverUrl,{
          transports: ['polling'],
          withCredentials: true
        });
        
        this.socket.on('connect', () => {
          console.log('Connected to signaling server');
          this.setupSocketEvents();
          resolve();
        });
        
        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          reject(error);
        });
      } catch (error) {
        console.error('Failed to connect to server:', error);
        reject(error);
      }
    });
  }

  // Setup all socket event listeners
  setupSocketEvents() {
    // When a peer connects to the same session
    this.socket.on('peer-connected', ({ sender, receiver }) => {
      console.log('Peer connected:', { sender, receiver });
      
      if (this.isSender && receiver) {
        this.remotePeerId = receiver;
        this.initializeConnection();
      } else if (this.isReceiver && sender) {
        this.remotePeerId = sender;
        // Receiver waits for the offer
      }
      
      if (this.onStatusChange) {
        this.onStatusChange('connected');
      }
    });

    // When a peer disconnects
    this.socket.on('peer-disconnected', ({ peerId }) => {
      console.log('Peer disconnected:', peerId);
      if (this.onStatusChange) {
        this.onStatusChange('disconnected');
      }
      this.closeConnection();
    });

    // WebRTC signaling - handle offer
    this.socket.on('webrtc-offer', async ({ offer, sender }) => {
      if (!this.peerConnection) {
        await this.createPeerConnection();
      }
      
      this.remotePeerId = sender;
      
      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        
        this.socket.emit('webrtc-answer', {
          sessionId: this.sessionId,
          answer: answer,
          target: this.remotePeerId
        });
      } catch (error) {
        console.error('Error handling offer:', error);
        if (this.onTransferError) {
          this.onTransferError('Failed to process connection offer');
        }
      }
    });

    // WebRTC signaling - handle answer
    this.socket.on('webrtc-answer', async ({ answer, sender }) => {
      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        console.log('Remote description set successfully');
      } catch (error) {
        console.error('Error handling answer:', error);
        if (this.onTransferError) {
          this.onTransferError('Failed to establish connection');
        }
      }
    });

    // WebRTC signaling - handle ICE candidates
    this.socket.on('webrtc-ice-candidate', async ({ candidate, sender }) => {
      try {
        if (candidate && this.peerConnection) {
          await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error('Error handling ICE candidate:', error);
      }
    });

    // Handle transfer status updates
    this.socket.on('transfer-status', (status) => {
      if (this.onStatusChange) {
        this.onStatusChange(status);
      }
    });
  }

  // Create a session (for sender)
  createSession() {
    return new Promise((resolve, reject) => {
      this.socket.emit('create-session', null, (response) => {
        if (response.success) {
          this.sessionId = response.sessionId;
          this.isSender = true;
          console.log('Session created:', this.sessionId);
          resolve(this.sessionId);
        } else {
          console.error('Failed to create session:', response.error);
          reject(new Error(response.error || 'Failed to create session'));
        }
      });
    });
  }

  // Join a session (for receiver)
  joinSession(sessionId) {
    return new Promise((resolve, reject) => {
      this.sessionId = sessionId;
      this.isReceiver = true;
      
      this.socket.emit('join-session', { sessionId }, (response) => {
        if (response.success) {
          console.log('Joined session:', sessionId);
          this.createPeerConnection();
          resolve();
        } else {
          console.error('Failed to join session:', response.error);
          reject(new Error(response.error || 'Failed to join session'));
        }
      });
    });
  }

  // Initialize WebRTC connection (sender initiates the connection)
  async initializeConnection() {
    if (this.isSender && this.remotePeerId) {
      await this.createPeerConnection();
      
      // Create data channel for file transfer
      this.dataChannel = this.peerConnection.createDataChannel('fileTransfer', {
        ordered: true,
      });
      
      this.setupDataChannel();
      
      try {
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);
        
        this.socket.emit('webrtc-offer', {
          sessionId: this.sessionId,
          offer: offer,
          target: this.remotePeerId
        });
      } catch (error) {
        console.error('Error creating offer:', error);
        if (this.onTransferError) {
          this.onTransferError('Failed to create connection offer');
        }
      }
    }
  }

  // Create and configure the RTCPeerConnection
  async createPeerConnection() {
    try {
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      };
      
      this.peerConnection = new RTCPeerConnection(configuration);
      
      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          this.socket.emit('webrtc-ice-candidate', {
            sessionId: this.sessionId,
            candidate: event.candidate,
            target: this.remotePeerId
          });
        }
      };
      
      // Log state changes
      this.peerConnection.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', this.peerConnection.iceConnectionState);
        
        // Added check for connected state
        if (this.peerConnection.iceConnectionState === 'connected' && this.onConnectionEstablished) {
          this.onConnectionEstablished();
        }
      };
      
      // Handle incoming data channels (for receiver)
      if (this.isReceiver) {
        this.peerConnection.ondatachannel = (event) => {
          this.dataChannel = event.channel;
          this.setupDataChannel();
        };
      }
      
      return this.peerConnection;
    } catch (error) {
      console.error('Error creating peer connection:', error);
      if (this.onTransferError) {
        this.onTransferError('Failed to create connection');
      }
      throw error;
    }
  }

  // Setup the data channel event handlers
  setupDataChannel() {
    if (!this.dataChannel) return;
  
    this.dataChannel.binaryType = 'arraybuffer';
    
    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
      if (this.onConnectionEstablished) {
        this.onConnectionEstablished();
      }
      
      // Send file info immediately when data channel opens (if sender)
      if (this.isSender && this.file) {
        this.sendFileInfo();
      }
    };
    
    this.dataChannel.onclose = () => {
      console.log('Data channel closed');
      // Add specific handling for unexpected closure during transfer
      if (this.isSender && this.offset && this.offset < this.file.size) {
        console.error('Data channel closed during active transfer');
        if (this.onTransferError) {
          this.onTransferError('Connection closed during file transfer');
        }
      }
    };
    
    this.dataChannel.onerror = (error) => {
      console.error('Data channel error:', error);
      if (this.onTransferError) {
        this.onTransferError(`Data channel error: ${error.message || 'Unknown error'}`);
      }
    };
      
    this.dataChannel.onmessage = (event) => {
      if (typeof event.data === 'string') {
        // Handle control messages
        const message = JSON.parse(event.data);
        
        switch (message.type) {
          case 'file-info':
            this.handleFileInfo(message);
            break;
          case 'file-received':
            this.handleFileReceived();
            break;
          case 'ready-for-next-chunk':
            this.waitingForNextChunk = false; // Reset flag
            this.sendNextChunk(); // Send next chunk when receiver is ready
            break;
          default:
            console.log('Unknown message type:', message.type);
        }
      } else {
        // Handle binary data (file chunks)
        this.receiveFileChunk(event.data);
      }
    };
  }

  // Set the file to be sent
  setFile(file) {
    this.file = file;
    // Reset offset when setting a new file
    this.offset = 0;
    
    // If data channel is already open, send file info immediately
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.sendFileInfo();
    }
  }

  // Send file info to the receiver
  sendFileInfo() {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      console.error('Data channel not open');
      return;
    }
    
    const fileInfo = {
      type: 'file-info',
      name: this.file.name,
      size: this.file.size,
      mimeType: this.file.type
    };
    
    this.dataChannel.send(JSON.stringify(fileInfo));
    console.log('File info sent:', fileInfo);
  }

  // Receiver handles incoming file info
  handleFileInfo(fileInfo) {
    console.log('Received file info:', fileInfo);
    
    this.fileSize = fileInfo.size;
    this.fileName = fileInfo.name;
    this.fileMimeType = fileInfo.mimeType;
    this.fileChunks = [];
    this.receivedSize = 0;
    
    // Signal ready to receive
    this.dataChannel.send(JSON.stringify({ type: 'ready-for-next-chunk' }));
    
    if (this.onStatusChange) {
      this.onStatusChange('transferring');
    }
  }

  // Start sending file
  startFileTransfer() {
    if (!this.file) {
      console.error('Cannot start transfer: No file selected');
      if (this.onTransferError) {
        this.onTransferError('No file selected for transfer');
      }
      return;
    }
    
    if (!this.dataChannel) {
      console.error('Cannot start transfer: Data channel not created');
      if (this.onTransferError) {
        this.onTransferError('Connection not established');
      }
      return;
    }

    if (this.dataChannel.readyState !== 'open') {
      console.error('Cannot start transfer: Data channel not open');
      if (this.onTransferError) {
        this.onTransferError('Connection not ready');
      }
      return;
    }
    
    console.log('Starting file transfer');
    
    // Reset transfer state
    this.offset = 0;
    this.waitingForNextChunk = false;
    
    if (this.onStatusChange) {
      this.onStatusChange('transferring');
    }
    
    // Always send file info first before starting to send chunks
    this.sendFileInfo();
    
    // Note: First chunk will be sent when receiver acknowledges with 'ready-for-next-chunk'
  }

  checkBufferState() {
    if (this.dataChannel) {
      return this.dataChannel.bufferedAmount < this.dataChannel.bufferedAmountLowThreshold;
    }
    return false;
  }

  // Send the next chunk of the file
  sendNextChunk() {
    if (!this.file) {
      console.error('No file to send');
      return;
    }
    
    if (this.offset >= this.file.size) {
      console.log('File sent completely');
      return;
    }
    
    // Don't send if we're already waiting for the receiver to acknowledge
    if (this.waitingForNextChunk) {
      console.log('Waiting for receiver to acknowledge previous chunk');
      return;
    }
    
    // Don't send if buffer is getting full
    if (this.dataChannel && this.dataChannel.bufferedAmount > 1024 * 1024) {
      // Wait and try again when buffer drains
      setTimeout(() => this.sendNextChunk(), 100);
      return;
    }
    
    const reader = new FileReader();
    const slice = this.file.slice(this.offset, this.offset + this.chunkSize);
    
    reader.onload = (event) => {
      // Add a check if the data channel still exists and is open
      if (this.dataChannel && this.dataChannel.readyState === 'open') {
        this.dataChannel.send(event.target.result);
        this.offset += event.target.result.byteLength;
        
        const progress = Math.min((this.offset / this.file.size) * 100, 100);
        
        if (this.onTransferProgress) {
          this.onTransferProgress({
            sent: this.offset,
            total: this.file.size,
            progress: progress
          });
        }
        
        // Set waiting flag to prevent sending more chunks before receiver is ready
        this.waitingForNextChunk = true;
        
        // If we've sent the entire file, we can reset the waiting flag
        if (this.offset >= this.file.size) {
          this.waitingForNextChunk = false;
        }
        
      } else {
        console.error('Data channel closed or null during transfer');
        if (this.onTransferError) {
          this.onTransferError('Connection lost during transfer');
        }
      }
    };
    
    reader.readAsArrayBuffer(slice);
  }

  // Receiver handles incoming file chunk
  receiveFileChunk(chunk) {
    this.fileChunks.push(chunk);
    this.receivedSize += chunk.byteLength;
    
    const progress = Math.min((this.receivedSize / this.fileSize) * 100, 100);
    
    if (this.onTransferProgress) {
      this.onTransferProgress({
        received: this.receivedSize,
        total: this.fileSize,
        progress: progress
      });
    }
    
    // Request next chunk if more data expected
    if (this.receivedSize < this.fileSize) {
      this.dataChannel.send(JSON.stringify({ type: 'ready-for-next-chunk' }));
    } else {
      this.assembleFile();
    }
  }

  // Assemble received chunks into complete file
  assembleFile() {
    const blob = new Blob(this.fileChunks, { type: this.fileMimeType });
    const url = URL.createObjectURL(blob);
    
    if (this.onTransferComplete) {
      this.onTransferComplete({
        name: this.fileName,
        size: this.fileSize,
        type: this.fileMimeType,
        url: url,
        blob: blob
      });
    }
    
    // Notify sender that file was received
    this.dataChannel.send(JSON.stringify({ type: 'file-received' }));
    
    if (this.onStatusChange) {
      this.onStatusChange('completed');
    }
  }

  // Handle file received notification
  handleFileReceived() {
    console.log('File successfully received by peer');
    
    if (this.onStatusChange) {
      this.onStatusChange('completed');
    }
  }

  // Calculate estimated transfer time based on progress
  calculateTimeRemaining(bytesTransferred, totalBytes, elapsedTime) {
    if (bytesTransferred === 0) return "Calculating...";
    
    const bytesPerSecond = bytesTransferred / (elapsedTime / 1000);
    const remainingBytes = totalBytes - bytesTransferred;
    const remainingSeconds = remainingBytes / bytesPerSecond;
    
    if (isNaN(remainingSeconds) || !isFinite(remainingSeconds)) {
      return "Calculating...";
    }
    
    if (remainingSeconds < 1) {
      return "Less than a second";
    } else if (remainingSeconds < 60) {
      return `About ${Math.ceil(remainingSeconds)} seconds`;
    } else if (remainingSeconds < 3600) {
      return `About ${Math.ceil(remainingSeconds / 60)} minutes`;
    } else {
      return `About ${Math.floor(remainingSeconds / 3600)} hours ${Math.ceil((remainingSeconds % 3600) / 60)} minutes`;
    }
  }

  // Close and clean up the connection
  closeConnection() {
    if (this.dataChannel) {
      this.dataChannel.close();
    }
    
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    
    this.dataChannel = null;
    this.peerConnection = null;
    this.remotePeerId = null;
    this.fileChunks = [];
    this.receivedSize = 0;
    this.offset = 0;
  }

  // Disconnect from signaling server
  disconnect() {
    this.closeConnection();
    
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export default WebRTCService;