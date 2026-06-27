import { useState, useCallback, useEffect, useRef } from 'react';
import WorldMap from './components/WorldMap';
import CountryTable from './components/CountryTable';
import QuizInput from './components/QuizInput';
import Results from './components/Results';
import { useTimer } from './hooks/useTimer';
import { matchCountry } from './utils/match';
import { TOTAL } from './data/countries';

const GAME_SECONDS = 15 * 60;
const MAX_PAUSES = 3;

export default function App() {
  const [guessed, setGuessed] = useState(() => new Set());
  const [status, setStatus] = useState('idle'); // idle | running | ended
  const [input, setInput] = useState('');
  const [lastGuessed, setLastGuessed] = useState(null);
  const [zen, setZen] = useState(false);
  const [mode, setMode] = useState('timed'); // timed | unlimited
  const [paused, setPaused] = useState(false);
  const [pausesLeft, setPausesLeft] = useState(MAX_PAUSES);
  const [elapsedSec, setElapsedSec] = useState(0);

  // Wall-clock timing for stats (works for both modes, excludes paused time)
  const startRef = useRef(0);
  const pausedMsRef = useRef(0);
  const pauseStartRef = useRef(0);

  const finishGame = useCallback(() => {
    let pausedMs = pausedMsRef.current;
    if (pauseStartRef.current) pausedMs += Date.now() - pauseStartRef.current;
    const el = startRef.current
      ? (Date.now() - startRef.current - pausedMs) / 1000
      : 0;
    setElapsedSec(Math.max(0, Math.round(el)));
    pauseStartRef.current = 0;
    setPaused(false);
    setStatus('ended');
  }, []);

  const { timeLeft, start, stop, reset } = useTimer(GAME_SECONDS, finishGame);

  // Exit focus mode with Escape
  useEffect(() => {
    if (!zen) return;
    const onKey = (e) => e.key === 'Escape' && setZen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zen]);

  const handleChange = useCallback(
    (raw) => {
      if (status === 'ended' || paused) return;
      if (status === 'idle') {
        startRef.current = Date.now();
        pausedMsRef.current = 0;
        pauseStartRef.current = 0;
        setStatus('running');
        if (mode === 'timed') start();
      }

      const id = matchCountry(raw);
      if (id && !guessed.has(id)) {
        const next = new Set(guessed);
        next.add(id);
        setGuessed(next);
        setLastGuessed(id);
        setInput('');
        if (next.size === TOTAL) {
          stop();
          finishGame();
        }
        return;
      }
      setInput(raw);
    },
    [status, paused, mode, guessed, start, stop, finishGame]
  );

  const handleGiveUp = useCallback(() => {
    stop();
    finishGame();
  }, [stop, finishGame]);

  const handleReset = useCallback(() => {
    reset();
    setGuessed(new Set());
    setInput('');
    setLastGuessed(null);
    setStatus('idle');
    setPaused(false);
    setPausesLeft(MAX_PAUSES);
    setElapsedSec(0);
    startRef.current = 0;
    pausedMsRef.current = 0;
    pauseStartRef.current = 0;
  }, [reset]);

  const handlePause = useCallback(() => {
    if (status !== 'running' || paused || pausesLeft <= 0) return;
    pauseStartRef.current = Date.now();
    setPaused(true);
    setPausesLeft((n) => n - 1);
    if (mode === 'timed') stop();
  }, [status, paused, pausesLeft, mode, stop]);

  const handleResume = useCallback(() => {
    if (!paused) return;
    if (pauseStartRef.current) {
      pausedMsRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = 0;
    }
    setPaused(false);
    if (mode === 'timed') start();
  }, [paused, mode, start]);

  const ended = status === 'ended';

  return (
    <div
      className={
        'app' +
        (status === 'running' && !paused ? ' app--focused' : '') +
        (zen ? ' app--zen' : '')
      }
    >
      <header className="app-header">
        <h1>Countries of the World</h1>
        <p className="subtitle">Can you name every country?</p>
      </header>

      <QuizInput
        value={input}
        onChange={handleChange}
        score={guessed.size}
        timeLeft={timeLeft}
        status={status}
        mode={mode}
        onSetMode={setMode}
        paused={paused}
        pausesLeft={pausesLeft}
        onPause={handlePause}
        onResume={handleResume}
        onGiveUp={handleGiveUp}
        onReset={handleReset}
        zen={zen}
        onToggleZen={() => setZen((z) => !z)}
      />

      {ended && <Results guessed={guessed} elapsedSec={elapsedSec} />}

      <WorldMap
        guessed={guessed}
        ended={ended}
        paused={paused}
        onResume={handleResume}
        interactive={ended}
      />
      <CountryTable guessed={guessed} ended={ended} lastGuessed={lastGuessed} />

      <footer className="app-footer">
        A JetPunk-style quiz · 197 countries · built with React
      </footer>
    </div>
  );
}
