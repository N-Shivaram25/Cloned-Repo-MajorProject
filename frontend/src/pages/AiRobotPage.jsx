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

// Add FontAwesome for icons (install: npm install @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons)
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRobot,
  faMicrophone,
  faStop,
  faPaperPlane,
  faUpload,
  faHistory,
  faLanguage,
  faHeadphones,
  faWaveSquare,
  faBolt,
  faComments,
  faGraduationCap,
  faCode,
  faPlay,
  faPause,
  faVolumeUp,
  faSpinner,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";

const MODULES = [
  { 
    key: "general", 
    label: "Start",
    icon: faBolt,
    description: "General conversation with AI",
    color: "from-blue-500 to-cyan-500"
  },
  { 
    key: "interview", 
    label: "Interview",
    icon: faComments,
    description: "Practice interview scenarios",
    color: "from-purple-500 to-pink-500"
  },
  { 
    key: "english_fluency", 
    label: "English Fluency",
    icon: faLanguage,
    description: "Improve English speaking skills",
    color: "from-green-500 to-emerald-500"
  },
  { 
    key: "language_learning", 
    label: "Language Learning",
    icon: faGraduationCap,
    description: "Learn new languages",
    color: "from-orange-500 to-yellow-500"
  },
  { 
    key: "programming", 
    label: "Programming",
    icon: faCode,
    description: "Code assistance and learning",
    color: "from-red-500 to-rose-500"
  },
];

// Module-specific interfaces
const ModuleInterfaces = {
  general: {
    title: "General Assistant",
    subtitle: "Ask me anything!",
    placeholder: "Speak your message...",
    theme: "bg-gradient-to-br from-gray-900 to-blue-900/30"
  },
  interview: {
    title: "Interview Coach",
    subtitle: "Practice for your next interview",
    placeholder: "Ask an interview question...",
    theme: "bg-gradient-to-br from-gray-900 to-purple-900/30"
  },
  english_fluency: {
    title: "English Fluency Assistant",
    subtitle: "Practice English conversation",
    placeholder: "Speak in English...",
    theme: "bg-gradient-to-br from-gray-900 to-green-900/30"
  },
  language_learning: {
    title: "Language Learning Partner",
    subtitle: "Learn new languages interactively",
    placeholder: "Practice speaking...",
    theme: "bg-gradient-to-br from-gray-900 to-orange-900/30"
  },
  programming: {
    title: "Code Assistant",
    subtitle: "Get help with programming",
    placeholder: "Ask a coding question...",
    theme: "bg-gradient-to-br from-gray-900 to-red-900/30"
  }
};

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);

  const audioRef = useRef(null);
  const wavesRef = useRef([]);
  const animationRef = useRef(null);

  const currentModule = useMemo(() => ModuleInterfaces[moduleKey], [moduleKey]);
  const moduleLabel = useMemo(() => {
    return MODULES.find((m) => m.key === moduleKey)?.label || "Start";
  }, [moduleKey]);

  // Wave animation for listening effect
  useEffect(() => {
    if (isRecording) {
      const waves = wavesRef.current;
      let frame = 0;
      
      const animate = () => {
        frame++;
        waves.forEach((wave, index) => {
          if (wave) {
            const height = 20 + Math.sin(frame * 0.05 + index) * 15;
            wave.style.height = `${height}px`;
            wave.style.opacity = 0.6 + Math.sin(frame * 0.03 + index) * 0.4;
          }
        });
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      wavesRef.current.forEach(wave => {
        if (wave) {
          wave.style.height = "20px";
          wave.style.opacity = "0.3";
        }
      });
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRecording]);

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
    setIsRecording(false);
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
        audioRef.current.volume = volume / 100;
        audioRef.current.play();
        setIsPlaying(true);
        
        audioRef.current.onended = () => setIsPlaying(false);
        audioRef.current.onpause = () => setIsPlaying(false);
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
      toast.success("Voice created successfully!");
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
      toast.success("Voice renamed successfully!");
      setRenameVoiceId("");
      setRenameVoiceName("");
      await loadVoices();
    } catch (e2) {
      toast.error(e2?.response?.data?.message || e2?.message || "Failed to rename voice");
    } finally {
      setRenamingVoice(false);
    }
  };

  const toggleAudioPlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-gray-100 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full blur-lg opacity-30"></div>
            <div className="relative bg-gray-800 p-3 rounded-full">
              <FontAwesomeIcon icon={faRobot} className="text-2xl text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              AI Robot Assistant
            </h1>
            <p className="text-sm text-gray-400">Module: {moduleLabel}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="card bg-gray-800/50 border border-gray-700/50 rounded-xl p-2">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faLanguage} className="text-blue-400" />
              <select
                className="bg-transparent border-none text-sm focus:outline-none focus:ring-0 text-gray-300"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l} className="bg-gray-800">
                    {l}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="card bg-gray-800/50 border border-gray-700/50 rounded-xl p-2">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faHeadphones} className="text-purple-400" />
              <select
                className="bg-transparent border-none text-sm focus:outline-none focus:ring-0 text-gray-300"
                value={selectedVoiceId}
                onChange={(e) => setSelectedVoiceId(e.target.value)}
              >
                <option value="" disabled className="bg-gray-800">
                  Select voice
                </option>
                {voices.map((v) => (
                  <option key={v.voiceId} value={v.voiceId} className="bg-gray-800">
                    {v.voiceName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Module Selection */}
      <div className="card bg-gray-800/40 border border-gray-700/50 rounded-2xl backdrop-blur-sm">
        <div className="card-body p-5">
          <h2 className="card-title text-xl text-gray-200">Select Module</h2>
          <p className="text-sm text-gray-400 mb-4">
            Each module has separate chat history. Switch to explore different functionalities.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {MODULES.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setModuleKey(m.key)}
                className={`relative group transition-all duration-300 ${
                  moduleKey === m.key 
                    ? "scale-[1.02] shadow-2xl" 
                    : "hover:scale-[1.01] hover:shadow-xl"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl blur-xl"></div>
                <div className={`relative p-4 rounded-xl border transition-all duration-300 ${
                  moduleKey === m.key 
                    ? `bg-gradient-to-br ${m.color} border-transparent text-white`
                    : "bg-gray-800/60 border-gray-700/50 hover:border-gray-600/50 text-gray-300"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      moduleKey === m.key 
                        ? "bg-white/20" 
                        : "bg-gray-700/50"
                    }`}>
                      <FontAwesomeIcon 
                        icon={m.icon} 
                        className={`text-lg ${
                          moduleKey === m.key 
                            ? "text-white" 
                            : m.color.split(" ")[1].replace("to-", "text-")
                        }`}
                      />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold">{m.label}</h3>
                      <p className="text-xs opacity-80">{m.description}</p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interface Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Module Interface */}
        <div className={`card border border-gray-700/50 rounded-2xl overflow-hidden transition-all duration-300 ${currentModule.theme}`}>
          <div className="card-body p-5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="card-title text-2xl text-white">{currentModule.title}</h2>
                <p className="text-gray-300">{currentModule.subtitle}</p>
              </div>
              <div className="flex items-center gap-2 text-cyan-400">
                <FontAwesomeIcon icon={faWaveSquare} />
                <span className="text-sm font-medium">Active</span>
              </div>
            </div>

            {/* Voice Chat Section */}
            <div className="space-y-6">
              {/* Listening Animation */}
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl"></div>
                  <div className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isRecording 
                      ? "bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border-2 border-cyan-400/50" 
                      : "bg-gray-800/50 border border-gray-700/50"
                  }`}>
                    <div className="text-center">
                      <FontAwesomeIcon 
                        icon={faRobot} 
                        className={`text-5xl transition-all duration-300 ${
                          isRecording 
                            ? "text-cyan-400 animate-pulse" 
                            : "text-gray-400"
                        }`}
                      />
                      {isRecording && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="absolute inset-0 animate-ping bg-cyan-400/30 rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Wave Animation */}
                {isRecording && (
                  <div className="flex items-center justify-center gap-1 mb-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        ref={el => wavesRef.current[i] = el}
                        className="w-3 bg-gradient-to-t from-cyan-400 to-blue-400 rounded-full transition-all duration-100"
                        style={{ height: '20px', opacity: 0.3 }}
                      />
                    ))}
                  </div>
                )}

                {/* Recording Status */}
                <div className="text-center mb-8">
                  <p className="text-gray-300 mb-2">
                    {isRecording 
                      ? "Listening... Speak now" 
                      : recordedBlob 
                        ? "Recording ready to send" 
                        : currentModule.placeholder}
                  </p>
                  {isRecording && (
                    <div className="flex items-center justify-center gap-2 text-cyan-400 animate-pulse">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                      <span className="text-sm">Recording in progress</span>
                    </div>
                  )}
                </div>

                {/* Voice Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`btn btn-lg rounded-full px-8 transition-all duration-300 ${
                      isRecording 
                        ? "btn-error bg-gradient-to-r from-red-500 to-pink-500 border-0 text-white" 
                        : "btn-primary bg-gradient-to-r from-cyan-500 to-blue-500 border-0 text-white hover:shadow-lg hover:shadow-cyan-500/25"
                    }`}
                  >
                    <FontAwesomeIcon icon={isRecording ? faStop : faMicrophone} className="mr-2" />
                    {isRecording ? "Stop Recording" : "Start Recording"}
                  </button>

                  <button
                    type="button"
                    onClick={handleVoiceChat}
                    disabled={isTranscribing || isResponding || !recordedBlob}
                    className="btn btn-lg rounded-full px-8 bg-gradient-to-r from-green-500 to-emerald-500 border-0 text-white hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTranscribing ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
                        Transcribing...
                      </>
                    ) : isResponding ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
                        Responding...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faPaperPlane} className="mr-2" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Audio Player Controls */}
              <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FontAwesomeIcon icon={faVolumeUp} className="text-gray-400" />
                    <span className="text-sm text-gray-300">Voice Preview</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleAudioPlay}
                      className="btn btn-sm bg-gray-700/50 hover:bg-gray-600/50 border-0"
                    >
                      <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => {
                        setVolume(Number(e.target.value));
                        if (audioRef.current) {
                          audioRef.current.volume = Number(e.target.value) / 100;
                        }
                      }}
                      className="range range-xs w-24"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Voice Management */}
        <div className="space-y-6">
          {/* Upload Voice Card */}
          <div className="card bg-gray-800/40 border border-gray-700/50 rounded-2xl backdrop-blur-sm">
            <div className="card-body p-5">
              <h2 className="card-title text-xl text-gray-200 mb-4">
                <FontAwesomeIcon icon={faUpload} className="mr-2 text-blue-400" />
                Upload Your Voice
              </h2>
              <form className="space-y-4" onSubmit={handleUploadVoice}>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-gray-400">Voice Name</span>
                  </label>
                  <input
                    className="input input-bordered bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={uploadVoiceName}
                    onChange={(e) => setUploadVoiceName(e.target.value)}
                    placeholder="Enter a unique voice name"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-gray-400">Audio Samples</span>
                  </label>
                  <div className="border-2 border-dashed border-gray-700/50 rounded-lg p-6 text-center hover:border-cyan-500/50 transition-colors cursor-pointer">
                    <input
                      className="file-input hidden"
                      id="voice-upload"
                      type="file"
                      accept="audio/*"
                      multiple
                      onChange={onUploadFilesChange}
                    />
                    <label htmlFor="voice-upload" className="cursor-pointer">
                      <div className="mx-auto w-12 h-12 mb-3 rounded-full bg-gray-800/50 flex items-center justify-center">
                        <FontAwesomeIcon icon={faUpload} className="text-2xl text-gray-400" />
                      </div>
                      <p className="text-gray-300 mb-1">Click to upload audio files</p>
                      <p className="text-sm text-gray-500">Supports MP3, WAV, OGG formats</p>
                      {uploadFiles.length > 0 && (
                        <p className="text-cyan-400 text-sm mt-2">
                          {uploadFiles.length} file(s) selected
                        </p>
                      )}
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn w-full bg-gradient-to-r from-blue-500 to-cyan-500 border-0 text-white hover:shadow-lg hover:shadow-cyan-500/25"
                  disabled={uploadingVoice}
                >
                  {uploadingVoice ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Creating Voice...
                    </>
                  ) : (
                    "Create Custom Voice"
                  )}
                </button>
              </form>

              {/* Rename Voice Section */}
              <div className="divider text-gray-500 my-6">Rename Existing Voice</div>

              <form className="space-y-4" onSubmit={handleRenameVoice}>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-gray-400">Select Voice</span>
                  </label>
                  <select
                    className="select select-bordered bg-gray-800/50 border-gray-700 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={renameVoiceId}
                    onChange={(e) => setRenameVoiceId(e.target.value)}
                  >
                    <option value="" className="bg-gray-800">Select a voice to rename</option>
                    {voices
                      .filter((v) => !v.isDefault)
                      .map((v) => (
                        <option key={v.voiceId} value={v.voiceId} className="bg-gray-800">
                          {v.voiceName}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text text-gray-400">New Name</span>
                  </label>
                  <input
                    className="input input-bordered bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    value={renameVoiceName}
                    onChange={(e) => setRenameVoiceName(e.target.value)}
                    placeholder="Enter new voice name"
                  />
                </div>

                <button
                  type="submit"
                  className="btn w-full bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700 text-gray-300 hover:text-white"
                  disabled={renamingVoice}
                >
                  {renamingVoice ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Rename Voice"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Chat History */}
      <div className="card bg-gray-800/40 border border-gray-700/50 rounded-2xl backdrop-blur-sm">
        <div className="card-body p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="card-title text-xl text-gray-200">
                <FontAwesomeIcon icon={faHistory} className="mr-2 text-cyan-400" />
                Chat History ({moduleLabel})
              </h2>
              <p className="text-sm text-gray-400">Conversations are stored per module</p>
            </div>
            <button
              type="button"
              onClick={() => loadHistory(moduleKey)}
              disabled={loadingHistory}
              className="btn bg-gradient-to-r from-gray-800 to-gray-900 border border-gray-700 hover:border-cyan-500/50 text-gray-300 hover:text-white"
            >
              {loadingHistory ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                  Loading...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faHistory} className="mr-2" />
                  Load Previous History
                </>
              )}
            </button>
          </div>

          <div className="min-h-60 max-h-[500px] overflow-y-auto rounded-xl border border-gray-700/50 bg-gray-900/30 p-4 space-y-4">
            {historyMessages.length ? (
              historyMessages.map((m, idx) => (
                <div
                  key={`${m.role}-${idx}`}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 transition-all duration-300 ${
                      m.role === "user"
                        ? "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30"
                        : "bg-gray-800/50 border border-gray-700/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        m.role === "user" 
                          ? "bg-blue-500/20" 
                          : "bg-cyan-500/20"
                      }`}>
                        <FontAwesomeIcon 
                          icon={m.role === "user" ? faMicrophone : faRobot} 
                          className={m.role === "user" ? "text-blue-400" : "text-cyan-400"} 
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-400">
                        {m.role === "user" ? "You" : "AI Assistant"}
                      </span>
                    </div>
                    <p className="text-gray-200">{m.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-gray-800/50 flex items-center justify-center">
                  <FontAwesomeIcon icon={faComments} className="text-2xl text-gray-500" />
                </div>
                <p className="text-gray-400">No messages yet in this module.</p>
                <p className="text-sm text-gray-500 mt-1">Start a conversation using voice chat!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default AiRobotPage;