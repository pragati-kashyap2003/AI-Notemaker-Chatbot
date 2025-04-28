import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Sidebar from "@/components/Sidebar";
import { Send, Loader2, FileText, Copy, Check, Mic, Square } from "lucide-react";

// Add proper TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  isNotes?: boolean;
}

interface SpeakerSegment {
  speaker: string;
  text: string;
}

const MeetingNotesGenerator = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your meeting notes assistant. You can paste a transcript or use voice dictation to capture your meeting.",
      sender: "bot",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [speakerName, setSpeakerName] = useState("Speaker 1");
  const [speakerSegments, setSpeakerSegments] = useState<SpeakerSegment[]>([]);
  const [transcript, setTranscript] = useState("");
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  // Replace with your actual OpenRouter API key
  const OPENROUTER_API_KEY = "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";
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Check if Speech Recognition is supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isSpeechRecognitionSupported = 
        'SpeechRecognition' in window || 
        'webkitSpeechRecognition' in window;
      
      setRecognitionSupported(isSpeechRecognitionSupported);
      
      if (isSpeechRecognitionSupported) {
        initSpeechRecognition();
      }
    }
  }, []);

  // Initialize Speech Recognition
  const initSpeechRecognition = () => {
    // Get the correct constructor based on browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          // Add the spoken text to the current speaker segment
          setSpeakerSegments(prev => {
            const updatedSegments = [...prev];
            if (updatedSegments.length > 0) {
              const lastIndex = updatedSegments.length - 1;
              updatedSegments[lastIndex].text += ' ' + finalTranscript;
            } else {
              updatedSegments.push({ speaker: speakerName, text: finalTranscript });
            }
            return updatedSegments;
          });
          
          // Update the transcript
          updateTranscript();
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
      };
    }
  };

  // Setup speech recognition when speaker changes
  useEffect(() => {
    // No need to reinitialize, just make sure the current segments reflect current speaker
    if (isRecording && speakerSegments.length > 0) {
      const lastSegment = speakerSegments[speakerSegments.length - 1];
      if (lastSegment.speaker !== speakerName) {
        setSpeakerSegments(prev => [...prev, { speaker: speakerName, text: "" }]);
      }
    }
  }, [speakerName]);

  // Timer for recording duration
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const startRecording = async () => {
    if (!recognitionSupported) {
      alert("Speech recognition is not supported in your browser. Try using Chrome, Edge, or Safari.");
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      
      // Create initial speaker segment if none exists
      if (speakerSegments.length === 0) {
        setSpeakerSegments([{ speaker: speakerName, text: "" }]);
      }
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Unable to access microphone. Please check your browser permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Stop all audio tracks
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      
      // Stop speech recognition
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.error("Error stopping speech recognition:", err);
        }
      }
      
      setIsRecording(false);
      updateTranscript();
    }
  };

  const changeSpeaker = () => {
    // Don't allow changing speaker if there are no segments yet
    if (speakerSegments.length === 0 && !isRecording) return;
    
    // Get the current speaker number if it follows the pattern "Speaker X"
    let currentNum = 1;
    const match = speakerName.match(/Speaker (\d+)/);
    if (match) {
      currentNum = parseInt(match[1]);
    }
    
    // Create next speaker name
    const nextSpeakerName = `Speaker ${currentNum + 1}`;
    setSpeakerName(nextSpeakerName);
    
    // Add a new segment for the new speaker
    if (isRecording) {
      setSpeakerSegments(prev => [...prev, { speaker: nextSpeakerName, text: "" }]);
    }
  };

  const updateTranscript = () => {
    // Build transcript from all speaker segments
    const fullTranscript = speakerSegments.map(segment => 
      `${segment.speaker}: ${segment.text.trim()}`
    ).join('\n\n');
    
    setTranscript(fullTranscript);
    setInput(fullTranscript);
  };

  const generateMeetingNotes = async (meetingContent: string) => {
    setIsLoading(true);
    try {
      const prompt = `I need you to create organized meeting notes from the following meeting discussion. Please format the notes with clear headings, action items, decisions made, and key discussion points:

${meetingContent}

Please format the meeting notes in a professional, organized structure.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Meeting Notes Generator"
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-5-haiku",
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: 0.3, // Lower temperature for more structured output
          max_tokens: 2048
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("Error generating meeting notes:", error);
      return "Sorry, I encountered an error while generating your meeting notes.";
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: input,
      sender: "user",
    };

    setMessages(prevMessages => [...prevMessages, userMessage]);
    const meetingContent = input;
    setInput("");
    
    // Show loading message
    const loadingMessage: Message = {
      id: messages.length + 2,
      text: "Generating your meeting notes...",
      sender: "bot"
    };
    
    setMessages(prevMessages => [...prevMessages, loadingMessage]);
    
    // Generate meeting notes
    const notesContent = await generateMeetingNotes(meetingContent);
    
    // Replace loading message with generated notes
    const notesMessage: Message = {
      id: messages.length + 2,
      text: notesContent,
      sender: "bot",
      isNotes: true
    };

    setMessages(prevMessages => 
      prevMessages.filter(msg => msg.id !== loadingMessage.id).concat(notesMessage)
    );
    
    // Reset speaker segments after sending
    setSpeakerSegments([]);
    setTranscript("");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <div className="p-4 bg-white border-b">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" /> Meeting Notes Generator
          </h1>
        </div>
        
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`relative max-w-[80%] p-4 rounded-lg ${
                  message.sender === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white border border-gray-200"
                } ${message.isNotes ? "whitespace-pre-wrap" : ""}`}
              >
                {message.text}
                {message.isNotes && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="absolute top-2 right-2 p-1 h-8" 
                    onClick={() => copyToClipboard(message.text)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-4 border-t bg-white">
          {/* Voice Recording Controls */}
          <div className="mb-4 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">Voice Dictation</h3>
                {!recognitionSupported && (
                  <span className="text-sm text-red-500">
                    (Not supported in this browser)
                  </span>
                )}
                {isRecording && (
                  <div className="flex items-center">
                    <span className="animate-pulse h-2 w-2 bg-red-500 rounded-full mr-2"></span>
                    <span className="text-sm text-gray-500">{formatTime(recordingTime)}</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant={isRecording ? "destructive" : "default"} 
                  size="sm"
                  onClick={isRecording ? stopRecording : startRecording}
                  className="flex items-center gap-1"
                  disabled={!recognitionSupported}
                >
                  {isRecording ? (
                    <>
                      <Square className="h-4 w-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Start
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={changeSpeaker}
                  disabled={(!isRecording && speakerSegments.length === 0) || !recognitionSupported}
                  className="flex items-center gap-1"
                >
                  {speakerName} →
                </Button>
              </div>
            </div>
            
            {speakerSegments.length > 0 && (
              <div className="mb-3 text-sm text-gray-600 max-h-32 overflow-y-auto border p-2 rounded">
                {speakerSegments.map((segment, index) => (
                  <div key={index} className="mb-2">
                    <strong>{segment.speaker}:</strong> {segment.text || "(silence)"}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <form onSubmit={handleSend}>
            <div className="mb-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your meeting transcript or use voice dictation..."
                className="w-full min-h-32 resize-y"
                disabled={isLoading}
              />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading || !input.trim()} className="flex items-center gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating Notes...
                  </>
                ) : (
                  <>
                    Generate Notes
                    <Send className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MeetingNotesGenerator;
