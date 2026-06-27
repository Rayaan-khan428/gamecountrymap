import { formatTime } from '../hooks/useTimer';
import { TOTAL } from '../data/countries';

const MAX_PAUSES = 3;

export default function QuizInput({
  value,
  onChange,
  score,
  timeLeft,
  status,
  mode,
  onSetMode,
  paused,
  pausesLeft,
  onPause,
  onResume,
  onGiveUp,
  onReset,
  zen,
  onToggleZen,
}) {
  const ended = status === 'ended';
  const idle = status === 'idle';
  const running = status === 'running';

  const timeDisplay = mode === 'unlimited' ? '∞' : formatTime(timeLeft);
  const timeLabel = mode === 'unlimited' ? 'no limit' : 'remaining';
  const low = mode === 'timed' && timeLeft <= 30;

  return (
    <nav className="navbar">
      <div className="nav-top">
        <div className="nav-brand">
          Atlas<span>Quiz</span>
        </div>

        <div className="nav-mode" role="group" aria-label="Game mode">
          <button
            className={'seg' + (mode === 'timed' ? ' active' : '')}
            onClick={() => onSetMode('timed')}
            disabled={!idle}
          >
            Timed
          </button>
          <button
            className={'seg' + (mode === 'unlimited' ? ' active' : '')}
            onClick={() => onSetMode('unlimited')}
            disabled={!idle}
          >
            Unlimited
          </button>
        </div>

        <div className="nav-actions">
          {!paused ? (
            <button
              className="nav-btn"
              onClick={onPause}
              disabled={!running || pausesLeft <= 0}
              title="Pause (blocks the map)"
            >
              <span>Pause</span>
              <span className="pips" aria-label={`${pausesLeft} pauses left`}>
                {Array.from({ length: MAX_PAUSES }).map((_, i) => (
                  <span key={i} className={'pip' + (i < pausesLeft ? ' on' : '')} />
                ))}
              </span>
            </button>
          ) : (
            <button className="nav-btn primary" onClick={onResume}>
              Resume
            </button>
          )}

          <button
            className={'nav-btn' + (zen ? ' focus-on' : '')}
            onClick={onToggleZen}
            title="Focus mode (Esc to exit)"
          >
            ⤢ Focus
          </button>

          {!ended ? (
            <button className="nav-btn danger" onClick={onGiveUp}>
              Give Up
            </button>
          ) : (
            <button className="nav-btn primary" onClick={onReset}>
              Play Again
            </button>
          )}
        </div>
      </div>

      <div className="nav-main">
        <div className="nav-stat score">
          <span className="big">
            <span key={score} className="stat-number">
              {score}
            </span>
            <span className="stat-total"> / {TOTAL}</span>
          </span>
          <span className="lbl">found</span>
        </div>

        <div className="nav-input">
          <input
            type="text"
            className="guess-input"
            placeholder={
              ended ? 'Game over' : paused ? 'Paused' : 'Type a country…'
            }
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={ended || paused}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </div>

        <div className={'nav-stat timer' + (low ? ' low' : '')}>
          <span className="big">{timeDisplay}</span>
          <span className="lbl">{timeLabel}</span>
        </div>
      </div>
    </nav>
  );
}
