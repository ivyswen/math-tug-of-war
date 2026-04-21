import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, RotateCcw, Clock, Volume2, VolumeX, Check, X } from 'lucide-react';

// --- Audio System (Web Audio API Synthesizer) ---
let audioContext: AudioContext | null = null;
const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (Ctx) audioContext = new Ctx();
  }
  if (audioContext?.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
};

export const playSound = (type: 'beep' | 'correct' | 'wrong' | 'win' | 'pull' | 'start') => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  const playOsc = (freq: number, oscType: OscillatorType, startTime: number, duration: number, vol = 0.1, slideFreq?: number) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = oscType;
      osc.frequency.setValueAtTime(freq, startTime);
      if (slideFreq) {
         osc.frequency.exponentialRampToValueAtTime(slideFreq, startTime + duration);
      }
      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {
      console.warn("Audio synthesis error:", e);
    }
  };

  const now = ctx.currentTime;

  switch (type) {
    case 'beep':
      playOsc(600, 'sine', now, 0.05, 0.05);
      break;
    case 'correct':
      playOsc(600, 'sine', now, 0.1, 0.1);
      playOsc(800, 'sine', now + 0.1, 0.2, 0.15);
      break;
    case 'wrong':
      playOsc(250, 'sawtooth', now, 0.15, 0.1);
      playOsc(180, 'sawtooth', now + 0.15, 0.25, 0.1);
      break;
    case 'pull':
      playOsc(150, 'triangle', now, 0.3, 0.1, 70);
      break;
    case 'win':
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
         playOsc(freq, 'sine', now + i * 0.15, 0.4, 0.15);
      });
      playOsc(1046.50, 'sine', now + 0.6, 0.6, 0.2);
      break;
    case 'start':
      playOsc(440, 'sine', now, 0.1, 0.1);
      playOsc(660, 'sine', now + 0.1, 0.2, 0.1);
      playOsc(880, 'sine', now + 0.25, 0.4, 0.15);
      break;
  }
};

const createBGMLoop = (ctx: AudioContext) => {
  const sampleRate = ctx.sampleRate;
  const loopDuration = 4; 
  const bufferLength = sampleRate * loopDuration;
  const buffer = ctx.createBuffer(1, bufferLength, sampleRate);
  const data = buffer.getChannelData(0);
  
  const freqs = [
    261.63, 329.63, 392.00, 523.25, 392.00, 329.63, 261.63, 196.00,
    349.23, 440.00, 523.25, 698.46, 523.25, 440.00, 349.23, 261.63
  ];
  
  const notesLength = bufferLength / freqs.length;
  
  for (let i = 0; i < bufferLength; i++) {
    const noteIdx = Math.floor(i / notesLength);
    const freq = freqs[noteIdx];
    const t = (i % notesLength) / sampleRate;
    
    const wave1 = Math.abs((t * freq % 1) * 4 - 2) - 1; 
    const wave2 = (t * freq % 1) < 0.5 ? 0.5 : -0.5;    
    
    const env = Math.exp(-t * 8); 
    
    data[i] = (wave1 * 0.6 + wave2 * 0.4) * env * 0.05; 
  }
  return buffer;
};

let bgmSource: AudioBufferSourceNode | null = null;
let bgmGainNode: GainNode | null = null;
let isBgmInitialized = false;

export const setBGMVolume = (isMuted: boolean) => {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (!isBgmInitialized) {
    bgmGainNode = ctx.createGain();
    bgmGainNode.connect(ctx.destination);
    
    const buffer = createBGMLoop(ctx);
    bgmSource = ctx.createBufferSource();
    bgmSource.buffer = buffer;
    bgmSource.loop = true;
    bgmSource.connect(bgmGainNode);
    bgmSource.start();
    isBgmInitialized = true;
  }
  
  if (bgmGainNode) {
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    bgmGainNode.gain.cancelScheduledValues(ctx.currentTime);
    bgmGainNode.gain.linearRampToValueAtTime(isMuted ? 0 : 0.6, ctx.currentTime + 0.1);
  }
};
// ------------------------------------------------

type GameState = 'start' | 'playing' | 'gameover';
type Team = 'left' | 'right';
type Winner = 'left' | 'right' | 'tie' | null;
type Difficulty = 'easy' | 'medium' | 'hard';

interface Problem {
  n1: number;
  n2: number;
  op: '+' | '-';
  ans: number;
}

const MAX_PULLS = 6; // Win threshold

const createRandomProblem = (difficulty: Difficulty): Problem => {
  const operators = ['+', '-'];
  const op = operators[Math.floor(Math.random() * operators.length)] as '+' | '-';
  
  let maxNum = 20;
  if (difficulty === 'medium') maxNum = 50;
  else if (difficulty === 'hard') maxNum = 100;

  let n1 = Math.floor(Math.random() * maxNum) + 1;
  let n2 = Math.floor(Math.random() * maxNum) + 1;

  if (op === '-' && n2 > n1) {
    const temp = n1;
    n1 = n2;
    n2 = temp;
  }

  return { n1, n2, op, ans: op === '+' ? n1 + n2 : n1 - n2 };
};

const formatTime = (sec: number) => {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export default function App() {
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState>('start');
  const [ropePosition, setRopePosition] = useState<number>(0);
  const [winner, setWinner] = useState<Winner>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('math_tug_difficulty') as Difficulty) || 'easy';
    }
    return 'easy';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('math_tug_difficulty', difficulty);
    }
  }, [difficulty]);

  useEffect(() => {
    const handleInteraction = () => setBGMVolume(isMuted);
    window.addEventListener('pointerdown', handleInteraction, { once: true });
    return () => window.removeEventListener('pointerdown', handleInteraction);
  }, [isMuted]);

  useEffect(() => {
    setBGMVolume(isMuted);
  }, [isMuted, gameState]);
  
  // Timer settings
  const [timeSetting, setTimeSetting] = useState<number>(60);
  const [timeLeft, setTimeLeft] = useState<number>(60);

  // Left Team (Team 1 - Blue) States
  const [leftProblem, setLeftProblem] = useState<Problem>({ n1: 0, n2: 0, op: '+', ans: 0 });
  const [leftInput, setLeftInput] = useState<string>('');
  const [leftFeedback, setLeftFeedback] = useState<{ type: 'correct' | 'incorrect' } | null>(null);
  const [leftPulling, setLeftPulling] = useState<boolean>(false);
  const [leftStreak, setLeftStreak] = useState<number>(0);
  const [leftScore, setLeftScore] = useState<number>(0);

  // Right Team (Team 2 - Red) States
  const [rightProblem, setRightProblem] = useState<Problem>({ n1: 0, n2: 0, op: '+', ans: 0 });
  const [rightInput, setRightInput] = useState<string>('');
  const [rightFeedback, setRightFeedback] = useState<{ type: 'correct' | 'incorrect' } | null>(null);
  const [rightPulling, setRightPulling] = useState<boolean>(false);
  const [rightStreak, setRightStreak] = useState<number>(0);
  const [rightScore, setRightScore] = useState<number>(0);

  // Watch rope position & Instant Win (Knockout)
  useEffect(() => {
    if (gameState === 'playing') {
      if (ropePosition <= -MAX_PULLS) {
        setWinner('left');
        setGameState('gameover');
        playSound('win');
      } else if (ropePosition >= MAX_PULLS) {
        setWinner('right');
        setGameState('gameover');
        playSound('win');
      }
    }
  }, [ropePosition, gameState]);

  // Timer Effect
  useEffect(() => {
    if (gameState === 'playing') {
      if (timeLeft > 0) {
        const timerObj = setTimeout(() => {
          setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearTimeout(timerObj);
      } else {
        // Time's up
        if (ropePosition < 0) {
          setWinner('left');
        } else if (ropePosition > 0) {
          setWinner('right');
        } else {
          setWinner('tie');
        }
        setGameState('gameover');
        playSound('win');
      }
    }
  }, [gameState, timeLeft, ropePosition]);

  const startGame = () => {
    playSound('start');
    setGameState('playing');
    setRopePosition(0);
    setWinner(null);
    setTimeLeft(timeSetting);
    
    setLeftInput('');
    setRightInput('');
    setLeftFeedback(null);
    setRightFeedback(null);
    setLeftStreak(0);
    setRightStreak(0);
    setLeftScore(0);
    setRightScore(0);
    
    setLeftProblem(createRandomProblem(difficulty));
    setRightProblem(createRandomProblem(difficulty));
  };

  const handleKeypad = (team: Team, val: string | number) => {
    if (gameState !== 'playing') return;
    playSound('beep');
    
    const setInput = team === 'left' ? setLeftInput : setRightInput;
    const currentInput = team === 'left' ? leftInput : rightInput;
    
    if (val === 'del') {
      setInput('');
    } else {
      if (currentInput.length < 3) {
        setInput((prev) => prev + val);
      }
    }
  };

  const submitAnswer = (team: Team) => {
    if (gameState !== 'playing') return;
    
    const currentInput = team === 'left' ? leftInput : rightInput;
    const problem = team === 'left' ? leftProblem : rightProblem;
    const setFeedback = team === 'left' ? setLeftFeedback : setRightFeedback;
    const setInput = team === 'left' ? setLeftInput : setRightInput;
    const setProblem = team === 'left' ? setLeftProblem : setRightProblem;
    const setPulling = team === 'left' ? setLeftPulling : setRightPulling;
    const setStreak = team === 'left' ? setLeftStreak : setRightStreak;
    const setScore = team === 'left' ? setLeftScore : setRightScore;

    if (currentInput === '') return;

    const isCorrect = parseInt(currentInput) === problem.ans;
    
    if (isCorrect) {
      playSound('correct');
      setTimeout(() => playSound('pull'), 150);

      setFeedback({ type: 'correct' });
      setStreak((prev) => prev + 1);
      setScore((prev) => prev + 1);
      setRopePosition((prev) => team === 'left' ? prev - 1 : prev + 1);
      
      setPulling(true);
      setTimeout(() => setPulling(false), 500);

      setTimeout(() => {
        setFeedback(null);
        setInput('');
        setProblem(createRandomProblem(difficulty));
      }, 700);
    } else {
      playSound('wrong');
      setFeedback({ type: 'incorrect' });
      setStreak(0);
      setTimeout(() => {
        setFeedback(null);
        setInput('');
      }, 700);
    }
  };

  const renderPlayerPanel = (team: Team) => {
    const isLeft = team === 'left';
    const title = isLeft ? 'Team 1' : 'Team 2';
    
    const baseColorClass = isLeft ? 'bg-[#3B82F6]' : 'bg-[#EF4444]'; // Blue 500 : Red 500
    const lightBgClass = isLeft ? 'bg-[#DBEAFE]' : 'bg-[#FEE2E2]'; // Blue 100 : Red 100
    const panelBorder = isLeft ? 'border-[#BFDBFE]' : 'border-[#FECACA]'; // Blue 200 : Red 200
    const textColor = isLeft ? 'text-[#1E3A8A]' : 'text-[#7F1D1D]'; // Blue 900 : Red 900
    const checkBtnClass = isLeft ? 'bg-[#3B82F6] hover:bg-[#2563EB]' : 'bg-[#3B82F6] hover:bg-[#2563EB]'; // Blue confirm button on both for consistency with img, or match theme
    
    const problem = isLeft ? leftProblem : rightProblem;
    const inputVal = isLeft ? leftInput : rightInput;
    const feedback = isLeft ? leftFeedback : rightFeedback;
    const score = isLeft ? leftScore : rightScore;

    return (
      <div className={`w-full h-full flex flex-col ${lightBgClass} rounded-[32px] overflow-hidden shadow-sm border-[6px] border-white relative`}>
        {/* Header Tab */}
        <div className={`${baseColorClass} text-white px-5 py-3 rounded-b-2xl mx-6 flex justify-between items-center shadow-sm`}>
          <span className="font-bold text-lg md:text-xl tracking-wide">{title}</span>
          <div className="bg-white text-slate-800 rounded-full w-8 h-8 flex items-center justify-center font-black shadow-sm shrink-0">
            {score}
          </div>
        </div>

        {/* Question Area */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[140px]">
          <div className={`text-4xl md:text-5xl lg:text-[56px] font-black ${textColor} mb-6 tracking-tight drop-shadow-sm`}>
            {problem.n1} {problem.op} {problem.n2} = ?
          </div>
          
          <div className="w-[85%] bg-white rounded-2xl h-16 border-2 border-slate-200 shadow-inner flex items-center justify-center relative overflow-hidden">
            <span className="text-3xl font-black text-slate-700">{inputVal}</span>
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className={`absolute inset-0 flex items-center justify-center ${feedback.type === 'correct' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} text-3xl`}
                >
                  {feedback.type === 'correct' ? <Check size={36} strokeWidth={4} /> : <X size={36} strokeWidth={4} />}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Keypad */}
        <div className="px-6 pb-6 pt-2 h-auto grid grid-cols-3 gap-3 md:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              disabled={feedback !== null || gameState !== 'playing'}
              onClick={() => handleKeypad(team, num)}
              className="bg-white rounded-2xl aspect-[4/3] flex items-center justify-center text-3xl font-bold text-slate-600 shadow-sm active:scale-95 transition-transform disabled:opacity-50"
            >
              {num}
            </button>
          ))}
          <button
            disabled={feedback !== null || gameState !== 'playing'}
            onClick={() => handleKeypad(team, 'del')}
            className="bg-[#EF4444] rounded-2xl aspect-[4/3] flex items-center justify-center text-3xl font-bold text-white shadow-sm active:scale-95 transition-transform disabled:opacity-50"
          >
            <X size={32} strokeWidth={3} />
          </button>
          <button
            disabled={feedback !== null || gameState !== 'playing'}
            onClick={() => handleKeypad(team, 0)}
            className="bg-white rounded-2xl aspect-[4/3] flex items-center justify-center text-3xl font-bold text-slate-600 shadow-sm active:scale-95 transition-transform disabled:opacity-50"
          >
            0
          </button>
          <button
            disabled={feedback !== null || gameState !== 'playing'}
            onClick={() => submitAnswer(team)}
            className="bg-[#3B82F6] rounded-2xl aspect-[4/3] flex items-center justify-center text-3xl font-bold text-white shadow-sm active:scale-95 transition-transform disabled:opacity-50"
          >
            <Check size={32} strokeWidth={3} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] flex flex-col font-sans overflow-hidden select-none p-2 md:p-4">
      
      {/* Top Navigation / Header */}
      <header className="flex justify-between items-center px-2 py-1 shrink-0 mb-2">
        <div className="text-xl md:text-2xl font-bold text-[#1E3A8A] flex items-center gap-2">
          TUG OF WAR: MATHEMATICS
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full text-slate-500 bg-white shadow-sm border border-slate-200 active:scale-95 transition-transform"
            title={isMuted ? "Unmute BGM" : "Mute BGM"}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </header>

      {/* Overlays */}
      <AnimatePresence>
        {gameState === 'start' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/70 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-2xl text-center max-w-lg border-2 border-slate-100 flex flex-col gap-6 mx-4 w-full">
              <h2 className="text-4xl font-extrabold text-[#1E3A8A] mb-2">Ready to Race?</h2>
              
              <div className="w-full bg-[#F0F9FF] p-4 rounded-3xl border border-blue-100">
                <label className="text-[#1E3A8A] font-bold mb-3 block text-sm uppercase tracking-widest text-left">Difficulty</label>
                <div className="flex gap-2">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                    <button 
                      key={d} onClick={() => {
                        setDifficulty(d);
                        if (d === 'easy') setTimeSetting(60);
                        if (d === 'medium') setTimeSetting(90);
                        if (d === 'hard') setTimeSetting(120);
                      }}
                      className={`flex-1 py-3 rounded-2xl font-bold transition-all ${
                        difficulty === d ? 'bg-[#3B82F6] text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full bg-[#F0F9FF] p-4 rounded-3xl border border-blue-100 mb-4">
                <label className="text-[#1E3A8A] font-bold mb-3 block text-sm uppercase tracking-widest text-left">Time Limit</label>
                <div className="flex gap-2">
                  {[30, 60, 90, 120].map(t => (
                    <button 
                      key={t} onClick={() => setTimeSetting(t)}
                      className={`flex-1 py-3 rounded-2xl font-bold transition-all ${
                        timeSetting === t ? 'bg-[#3B82F6] text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {t >= 60 ? `${t/60}m` : `${t}s`}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={startGame} className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white text-2xl font-bold py-5 rounded-3xl transition-all shadow-lg flex items-center justify-center gap-3">
                <Play fill="currentColor" size={28} /> START GAME
              </button>
            </div>
          </motion.div>
        )}

        {gameState === 'gameover' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/80 backdrop-blur-md z-50 flex items-center justify-center"
          >
            <motion.div 
               initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }}
               className={`p-10 md:p-14 rounded-[40px] shadow-2xl text-center max-w-lg border-4 ${
                 winner === 'left' ? 'bg-[#EFF6FF] border-[#BFDBFE]' 
                 : winner === 'right' ? 'bg-[#FEF2F2] border-[#FECACA]' 
                 : 'bg-slate-50 border-slate-200'
               } flex flex-col items-center gap-6 mx-4 w-full`}
            >
              <h2 className={`text-4xl md:text-5xl font-black uppercase tracking-tight ${
                winner === 'left' ? 'text-[#2563EB]' : winner === 'right' ? 'text-[#DC2626]' : 'text-slate-600'
              }`}>
                {winner === 'tie' ? "IT'S A TIE!" : `TEAM ${winner === 'left' ? '1' : '2'} WINS!`}
              </h2>
              {winner === 'tie' && <p className="text-xl font-medium text-slate-500">You pulled with equal strength!</p>}
              
              <div className="flex gap-8 my-4 w-full justify-center">
                 <div className="text-center">
                    <p className="text-slate-500 font-bold uppercase text-sm">Team 1</p>
                    <p className="text-4xl font-black text-blue-500">{leftScore}</p>
                 </div>
                 <div className="text-center">
                    <p className="text-slate-500 font-bold uppercase text-sm">Team 2</p>
                    <p className="text-4xl font-black text-red-500">{rightScore}</p>
                 </div>
              </div>

              <button onClick={startGame} className="w-full bg-[#3B82F6] hover:bg-[#2563EB] text-white text-2xl font-bold py-5 rounded-3xl transition-all shadow-lg flex items-center justify-center gap-3">
                <RotateCcw strokeWidth={3} size={28} /> PLAY AGAIN
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main 3-Column Layout */}
      <div className="flex-1 w-full max-w-[1400px] mx-auto flex flex-row gap-2 md:gap-4 relative z-10 min-h-[400px] items-stretch pb-2">
        
        {/* Left Team Panel (Blue) */}
        <div className="w-[30%] max-w-[360px] min-w-[260px]">
          {renderPlayerPanel('left')}
        </div>
        
        {/* Middle Tug of War Arena */}
        <div className="flex-1 h-full bg-white rounded-[32px] overflow-hidden flex flex-col border-[6px] border-white shadow-sm relative min-h-[400px]">
          
          {/* Header Bar inside Arena */}
          <div className="h-16 bg-[#F8FAFC] border-b-2 border-slate-100 flex justify-between items-center px-4 md:px-6 shrink-0 z-20 shadow-sm relative">
             <div className="flex flex-col items-center min-w-[60px]">
               <span className="text-[10px] uppercase font-bold text-slate-400">Team 1</span>
               <span className="text-2xl font-black text-[#3B82F6] leading-none">{leftScore}</span>
             </div>

             <div className={`flex items-center gap-2 font-bold text-lg px-4 py-1.5 rounded-full ${timeLeft <= 10 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-[#E2E8F0] text-slate-600'}`}>
                <Clock size={18} />
                <span className="tabular-nums">{formatTime(timeLeft)}</span>
             </div>

             <div className="flex flex-col items-center min-w-[60px]">
               <span className="text-[10px] uppercase font-bold text-slate-400">Team 2</span>
               <span className="text-2xl font-black text-[#EF4444] leading-none">{rightScore}</span>
             </div>
          </div>

          {/* Visualization Area */}
          <div className="flex-1 relative bg-[#F1F5F9] w-full flex items-center justify-center overflow-hidden min-h-[300px]">
             
             {/* Center Line */}
             <div className="absolute top-0 bottom-0 left-1/2 w-0 border-l-[4px] border-dashed border-slate-300 -translate-x-1/2 z-0" />
             
             {/* Rope System */}
             <motion.div 
                className="w-full absolute inset-0 flex items-center justify-center z-10"
                animate={{ x: `${ropePosition * (35 / MAX_PULLS)}%` }} // Move base percentage relative to container
                transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
             >
                {/* Visual Rope */}
                <div className="w-[300%] h-2 md:h-3 bg-slate-800 absolute top-1/2 -translate-y-1/2 z-10 shrink-0 shadow-sm" />
                
                {/* Red center indicator ribbon */}
                <div className="w-3 h-14 bg-red-500 absolute top-1/2 -translate-y-1/2 z-20 rounded-full border-2 border-white shadow-sm" />

                {/* Team 1 Characters (Left) */}
                <div className="absolute right-[calc(50%+45px)] md:right-[calc(50%+70px)] xl:right-[calc(50%+110px)] top-1/2 -translate-y-1/2 flex flex-row-reverse items-center z-20 -mt-2">
                  <motion.div 
                    animate={
                      leftPulling ? { x: -25, rotate: -20, scale: 1.15, y: -5 } 
                      : gameState === 'playing' ? { x: [-1, 2, -1], rotate: [-2, 1, -2], y: [0, -3, 0], scale: 1 } 
                      : { x: 0, rotate: 0, scale: 1, y: 0 }
                    }
                    transition={
                      leftPulling ? { type: "spring", bounce: 0.6 } 
                      : gameState === 'playing' ? { repeat: Infinity, duration: 0.4, ease: "easeInOut" } 
                      : {}
                    }
                    className="text-[45px] md:text-[60px] xl:text-[80px] origin-bottom scale-x-[-1] leading-none drop-shadow-md"
                  >
                    🦁
                  </motion.div>
                  <motion.div 
                    animate={
                      leftPulling ? { x: -25, rotate: -20, scale: 1.15, y: -5 } 
                      : gameState === 'playing' ? { x: [2, -1, 2], rotate: [1, -2, 1], y: [-2, 0, -2], scale: 1 } 
                      : { x: 0, rotate: 0, scale: 1, y: 0 }
                    }
                    transition={
                      leftPulling ? { type: "spring", bounce: 0.6, delay: 0.05 } 
                      : gameState === 'playing' ? { repeat: Infinity, duration: 0.45, ease: "easeInOut" } 
                      : {}
                    }
                    className="text-[45px] md:text-[60px] xl:text-[80px] origin-bottom scale-x-[-1] leading-none drop-shadow-md -mr-4 md:-mr-8"
                  >
                    🦁
                  </motion.div>
                </div>

                {/* Team 2 Characters (Right) */}
                <div className="absolute left-[calc(50%+45px)] md:left-[calc(50%+70px)] xl:left-[calc(50%+110px)] top-1/2 -translate-y-1/2 flex items-center z-20 -mt-2">
                  <motion.div 
                    animate={
                      rightPulling ? { x: 25, rotate: 20, scale: 1.15, y: -5 } 
                      : gameState === 'playing' ? { x: [-1, 2, -1], rotate: [-1, 2, -1], y: [0, -3, 0], scale: 1 } 
                      : { x: 0, rotate: 0, scale: 1, y: 0 }
                    }
                    transition={
                      rightPulling ? { type: "spring", bounce: 0.6 } 
                      : gameState === 'playing' ? { repeat: Infinity, duration: 0.4, ease: "easeInOut" } 
                      : {}
                    }
                    className="text-[45px] md:text-[60px] xl:text-[80px] origin-bottom leading-none drop-shadow-md"
                  >
                    🐻
                  </motion.div>
                  <motion.div 
                    animate={
                      rightPulling ? { x: 25, rotate: 20, scale: 1.15, y: -5 } 
                      : gameState === 'playing' ? { x: [2, -1, 2], rotate: [2, -1, 2], y: [-2, 0, -2], scale: 1 } 
                      : { x: 0, rotate: 0, scale: 1, y: 0 }
                    }
                    transition={
                      rightPulling ? { type: "spring", bounce: 0.6, delay: 0.05 } 
                      : gameState === 'playing' ? { repeat: Infinity, duration: 0.45, ease: "easeInOut" } 
                      : {}
                    }
                    className="text-[45px] md:text-[60px] xl:text-[80px] origin-bottom leading-none drop-shadow-md -ml-4 md:-ml-8"
                  >
                    🐻
                  </motion.div>
                </div>

             </motion.div>

          </div>
        </div>

        {/* Right Team Panel (Red) */}
        <div className="w-[30%] max-w-[360px] min-w-[260px]">
          {renderPlayerPanel('right')}
        </div>

      </div>

    </div>
  );
}
