import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { LANGUAGES } from "../constants";
import {
  aiRobotSendMessage,
  aiRobotStt,
  aiRobotTts,
  getAiRobotHistory,
  getAiRobotVoices,
  renameAiRobotVoice,
  uploadAiRobotVoice,
} from "../lib/api";

const MODULES = [
  { key: "general", label: "Start", icon: "🚀", color: "bg-blue-500" },
  { key: "interview", label: "Interview", icon: "💼", color: "bg-green-500" },
  { key: "english_fluency", label: "English Fluency", icon: "🇬🇧", color: "bg-purple-500" },
  { key: "language_learning", label: "Language Learning", icon: "🌍", color: "bg-yellow-500" },
  { key: "programming", label: "Programming", icon: "💻", color: "bg-red-500" },
];

const AiRobotPage = () => {
  const [moduleKey, setModuleKey] = useState("general");
  const [language, setLanguage] = useState("English");

  const [voices, setVoices] = useState([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");

  const [historyMessages, setHistoryMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isResponding, setIsResponding] = useState(false);

  const [uploadVoiceName, setUploadVoiceName] = useState("");
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadingVoice, setUploadingVoice] = useState(false);

  const [renameVoiceId, setRenameVoiceId] = useState("");
  const [renameVoiceName, setRenameVoiceName] = useState("");
  const [renamingVoice, setRenamingVoice] = useState(false);

  const audioRef = useRef(null);

  const moduleLabel = useMemo(() => {
    return MODULES.find((m) => m.key === moduleKey)?.label || "Start";
  }, [moduleKey]);

  const loadVoices = async () => {
    try {
      const res = await getAiRobotVoices();
      const list = Array.isArray(res?.voices) ? res.voices : [];
      setVoices(list);
      if (!selectedVoiceId && list.length) {
        setSelectedVoiceId(String(list[0]?.voiceId || ""));
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to load voices");
    }
  };

  const loadHistory = async (nextModuleKey) => {
    try {
      setLoadingHistory(true);
      const res = await getAiRobotHistory({ module: nextModuleKey });
      const msgs = Array.isArray(res?.messages) ? res.messages : [];
      setHistoryMessages(msgs);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to load history");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadVoices();
  }, []);

  useEffect(() => {
    setHistoryMessages([]);
    setRecordedBlob(null);
  }, [moduleKey]);

  const startRecording = async () => {
    try {
      if (isRecording) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const prefer = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/mpeg"];
      const mimeType = prefer.find((t) => {
        try {
          return MediaRecorder.isTypeSupported(t);
        } catch {
          return false;
        }
      });

      const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      const chunks = [];

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      rec.onstop = () => {
        try {
          stream.getTracks().forEach((t) => t.stop());
        } catch {
          // ignore
        }
        const blob = new Blob(chunks, { type: mimeType || "audio/webm" });
        setRecordedBlob(blob);
      };

      rec.start();
      setRecorder(rec);
      setIsRecording(true);
    } catch (e) {
      toast.error(e?.message || "Microphone access denied");
    }
  };

  const stopRecording = () => {
    try {
      if (!recorder) return;
      recorder.stop();
    } catch {
      // ignore
    } finally {
      setIsRecording(false);
      setRecorder(null);
    }
  };

  const playAudioBuffer = (buffer) => {
    try {
      const blob = new Blob([buffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
    } catch {
      // ignore
    }
  };

  const handleVoiceChat = async () => {
    try {
      if (!recordedBlob) {
        toast.error("Record your voice first");
        return;
      }
      if (!selectedVoiceId) {
        toast.error("Please choose a voice");
        return;
      }

      setIsTranscribing(true);
      const sttRes = await aiRobotStt({ audioBlob: recordedBlob });
      const text = String(sttRes?.text || "").trim();
      if (!text) {
        toast.error("Could not transcribe audio");
        return;
      }

      setHistoryMessages((prev) => [...prev, { role: "user", text }]);

      setIsResponding(true);
      const chatRes = await aiRobotSendMessage({ message: text, module: moduleKey, language });
      const reply = String(chatRes?.reply || "").trim();

      setHistoryMessages((prev) => [...prev, { role: "assistant", text: reply }]);

      const ttsRes = await aiRobotTts({ text: reply, voiceId: selectedVoiceId });
      playAudioBuffer(ttsRes);

      setRecordedBlob(null);
    } catch (e) {
      toast.error(e?.response?.data?.message || e?.message || "Voice chat failed");
    } finally {
      setIsTranscribing(false);
      setIsResponding(false);
    }
  };

  const onUploadFilesChange = (e) => {
    const files = Array.from(e.target.files || []);
    setUploadFiles(files);
  };

  const handleUploadVoice = async (e) => {
    e.preventDefault();
    try {
      if (!uploadVoiceName.trim()) {
        toast.error("Please enter a voice name");
        return;
      }
      if (!uploadFiles.length) {
        toast.error("Please select at least one audio file");
        return;
      }

      setUploadingVoice(true);
      await uploadAiRobotVoice({ voiceName: uploadVoiceName.trim(), audioFiles: uploadFiles });
      toast.success("Voice created");
      setUploadVoiceName("");
      setUploadFiles([]);
      await loadVoices();
    } catch (e2) {
      toast.error(e2?.response?.data?.message || e2?.message || "Failed to upload voice");
    } finally {
      setUploadingVoice(false);
    }
  };

  const handleRenameVoice = async (e) => {
    e.preventDefault();
    try {
      if (!renameVoiceId) {
        toast.error("Choose a voice to rename");
        return;
      }
      if (!renameVoiceName.trim()) {
        toast.error("Enter a new name");
        return;
      }

      setRenamingVoice(true);
      await renameAiRobotVoice({ voiceId: renameVoiceId, voiceName: renameVoiceName.trim() });
      toast.success("Voice renamed");
      setRenameVoiceId("");
      setRenameVoiceName("");
      await loadVoices();
    } catch (e2) {
      toast.error(e2?.response?.data?.message || e2?.message || "Failed to rename voice");
    } finally {
      setRenamingVoice(false);
    }
  };

  // Stats data for the dashboard
  const statsData = [
    { label: "Avg First Reply Time", value: "30, 15 min", color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Avg Full Resolve Time", value: "22, 40 min", color: "text-green-600", bg: "bg-green-50" },
    { label: "B Message", value: "20%", color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Emails", value: "33%", color: "text-yellow-600", bg: "bg-yellow-50" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">AI Robot Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Module: <span className="font-semibold text-gray-700">{moduleLabel}</span></p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="form-control">
            <select
              className="select select-bordered select-sm w-full md:w-40 bg-white border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-control">
            <select
              className="select select-bordered select-sm w-full md:w-48 bg-white border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={selectedVoiceId}
              onChange={(e) => setSelectedVoiceId(e.target.value)}
            >
              <option value="" disabled>
                Select a voice
              </option>
              {voices.map((v) => (
                <option key={v.voiceId} value={v.voiceId}>
                  {v.voiceName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Modules Section - Square Cards */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">AI Modules</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {MODULES.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setModuleKey(m.key)}
              className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                moduleKey === m.key 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              <div className={`${m.color} w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-3`}>
                {m.icon}
              </div>
              <span className={`font-medium ${moduleKey === m.key ? 'text-blue-700' : 'text-gray-700'}`}>
                {m.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, index) => (
          <div key={index} className={`${stat.bg} rounded-xl p-4 border border-gray-200`}>
            <p className="text-sm font-medium text-gray-600">{stat.label}</p>
            <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Voice Chat Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Voice Chat</h2>
              {recordedBlob && (
                <span className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-full">
                  Audio Recorded ✓
                </span>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                {!isRecording ? (
                  <button
                    type="button"
                    className="btn btn-primary px-6 rounded-lg flex items-center gap-2"
                    onClick={startRecording}
                  >
                    <span className="text-xl">🎤</span>
                    Start Recording
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-error px-6 rounded-lg flex items-center gap-2"
                    onClick={stopRecording}
                  >
                    <span className="text-xl">⏹️</span>
                    Stop Recording
                  </button>
                )}
                
                <button
                  type="button"
                  className="btn bg-gray-800 text-white hover:bg-gray-900 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isTranscribing || isResponding || !recordedBlob}
                  onClick={handleVoiceChat}
                >
                  {isTranscribing ? "Transcribing..." : isResponding ? "Responding..." : "Send Message"}
                </button>
              </div>
              
              <div className="text-sm text-gray-500">
                <p>• Record your voice first, then send to AI</p>
                <p>• Select a voice and language for the response</p>
              </div>
              
              <audio ref={audioRef} className="w-full" />
            </div>
          </div>

          {/* Chat History Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Chat History</h2>
              <button
                type="button"
                className="btn btn-sm bg-gray-100 hover:bg-gray-200 border-gray-300 rounded-lg"
                onClick={() => loadHistory(moduleKey)}
                disabled={loadingHistory}
              >
                {loadingHistory ? (
                  <span className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-xs"></span>
                    Loading...
                  </span>
                ) : (
                  "Load History"
                )}
              </button>
            </div>
            
            <div className="h-80 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
              {historyMessages.length ? (
                historyMessages.map((m, idx) => (
                  <div
                    key={`${m.role}-${idx}`}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        m.role === "user"
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-gray-200 text-gray-800 rounded-bl-none"
                      }`}
                    >
                      <div className="font-medium text-xs mb-1 opacity-80">
                        {m.role === "user" ? "You" : "AI Assistant"}
                      </div>
                      <p className="text-sm">{m.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <div className="text-4xl mb-2">💬</div>
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs mt-1">Start a voice chat to see history</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Voice Management */}
        <div className="space-y-6">
          {/* Upload Voice Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Your Voice</h2>
            
            <form className="space-y-4" onSubmit={handleUploadVoice}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voice Name
                </label>
                <input
                  className="input input-bordered w-full bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg"
                  value={uploadVoiceName}
                  onChange={(e) => setUploadVoiceName(e.target.value)}
                  placeholder="Enter a name for your voice"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Audio Samples
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                  <input 
                    type="file" 
                    className="hidden" 
                    id="voice-upload" 
                    accept="audio/*" 
                    multiple 
                    onChange={onUploadFilesChange}
                  />
                  <label htmlFor="voice-upload" className="cursor-pointer block">
                    <div className="text-3xl mb-2">🎵</div>
                    <p className="text-sm text-gray-600">
                      Click to upload audio files
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Supports MP3, WAV, M4A formats
                    </p>
                  </label>
                  {uploadFiles.length > 0 && (
                    <p className="text-sm text-green-600 mt-2">
                      {uploadFiles.length} file(s) selected
                    </p>
                  )}
                </div>
              </div>
              
              <button
                type="submit"
                className="btn btn-primary w-full rounded-lg disabled:opacity-50"
                disabled={uploadingVoice}
              >
                {uploadingVoice ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="loading loading-spinner loading-sm"></span>
                    Creating Voice...
                  </span>
                ) : (
                  "Create Custom Voice"
                )}
              </button>
            </form>
            
            <div className="divider my-6">OR</div>
            
            {/* Rename Voice Section */}
            <h3 className="text-md font-semibold text-gray-800 mb-4">Rename Existing Voice</h3>
            <form className="space-y-4" onSubmit={handleRenameVoice}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Voice to Rename
                </label>
                <select
                  className="select select-bordered w-full bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg"
                  value={renameVoiceId}
                  onChange={(e) => setRenameVoiceId(e.target.value)}
                >
                  <option value="">Choose a custom voice</option>
                  {voices
                    .filter((v) => !v.isDefault)
                    .map((v) => (
                      <option key={v.voiceId} value={v.voiceId}>
                        {v.voiceName}
                      </option>
                    ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Voice Name
                </label>
                <input
                  className="input input-bordered w-full bg-white border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg"
                  value={renameVoiceName}
                  onChange={(e) => setRenameVoiceName(e.target.value)}
                  placeholder="Enter new name"
                />
              </div>
              
              <button
                type="submit"
                className="btn bg-gray-800 text-white hover:bg-gray-900 w-full rounded-lg disabled:opacity-50"
                disabled={renamingVoice}
              >
                {renamingVoice ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="loading loading-spinner loading-sm"></span>
                    Renaming...
                  </span>
                ) : (
                  "Save New Name"
                )}
              </button>
            </form>
          </div>
          
          {/* Info Panel */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <h3 className="text-md font-semibold text-blue-800 mb-3 flex items-center gap-2">
              <span>ℹ️</span> Information
            </h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Each module has separate chat history stored in MongoDB</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>If no module is selected, "Start" module is used by default</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Upload at least 3 audio samples for best voice cloning results</span>
              </li>
              <li className="flex items-start gap-2">
                <span>•</span>
                <span>Voice responses use the selected voice from dropdown</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiRobotPage;