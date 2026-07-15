import { useState, useEffect, useRef } from 'react';

function PrivateReminderApp() {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('local_reminders');
    return saved ? JSON.parse(saved) : [];
  });

  const [text, setText] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeAlarm, setActiveAlarm] = useState(null);
  
  // DARK MODE HOOK STATE: Initialized from storage preferences
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme_preference') === 'dark';
  });

  const wakeLockRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('local_reminders', JSON.stringify(todos));
  }, [todos]);

  // THEME TRACKING MECHANISM EFFECT
  useEffect(() => {
    localStorage.setItem('theme_preference', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    async function requestWakeLock() {
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen');
        } catch (err) {
          console.log('Wake lock suspended:', err.message);
        }
      }
    }
    requestWakeLock();
    return () => {
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, []);

  const startAlarmSound = () => {
    if (window.audioInterval) return;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    window.audioInterval = setInterval(() => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); 
      gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.stop(audioCtx.currentTime + 0.15);
    }, 400);
  };

  const stopAlarmSound = () => {
    if (window.audioInterval) {
      clearInterval(window.audioInterval);
      window.audioInterval = null;
      setActiveAlarm(null);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      todos.forEach((todo, index) => {
        if (todo.deadline && !todo.alerted) {
          const todoDate = new Date(todo.deadline);
          if (now >= todoDate) {
            setActiveAlarm(todo.text);
            startAlarmSound();
            const updatedTodos = [...todos];
            updatedTodos[index].alerted = true;
            setTodos(updatedTodos);
          }
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [todos]);

  const addTodo = () => {
    if (!text.trim() || !dateTime) {
      alert('Please fill out both the assignment field and due date parameters.');
      return;
    }
    setTodos([...todos, { id: Date.now(), text, deadline: dateTime, alerted: false }]);
    setText('');
    setDateTime('');
  };

  const deleteTodo = (idToDelete) => {
    setTodos(todos.filter(todo => todo.id !== idToDelete));
  };

  return (
    // Dynamic Main Background Container Wrapper Wrapper
    <div className={`min-h-screen py-10 px-4 transition-colors duration-300 ${darkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800'}`}>
      
      <div className={`max-w-md mx-auto rounded-2xl p-6 shadow-xl border transition-all duration-300 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        
        {/* HEADER BLOCK WITH INTERACTIVE GRAPHICAL TOGGLE ACTION */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">⏰ QuickAlarms</h2>
            <p className="text-xs opacity-60 mt-0.5">Secure sandbox localized reminder hub</p>
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2.5 rounded-xl border text-lg transition-all active:scale-95 ${darkMode ? 'bg-slate-700 border-slate-600 hover:bg-slate-600 text-yellow-400' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-indigo-600'}`}
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        {/* ALARM TRIGGERED BLAZING SCREEN BANNER OVERLAY EFFECT */}
        {activeAlarm && (
          <div className="bg-rose-500 text-white p-4 rounded-xl mb-5 text-center animate-pulse shadow-lg shadow-rose-500/20">
            <h3 className="font-extrabold text-lg tracking-wide">🚨 TIMER ALERT DUE</h3>
            <p className="font-semibold text-sm my-1 italic">"{activeAlarm}"</p>
            <button 
              onClick={stopAlarmSound} 
              className="mt-2.5 px-5 py-1.5 bg-white text-rose-600 font-bold text-xs rounded-lg shadow hover:bg-slate-50 transition-all uppercase tracking-wider"
            >
              Silence Buzzer
            </button>
          </div>
        )}

        {/* CLOCK METRIC DISPLAY PANEL UNIT */}
        <div className={`p-4 rounded-xl mb-6 text-center font-mono font-semibold text-base border ${darkMode ? 'bg-slate-900/50 border-slate-700/50 text-emerald-400' : 'bg-slate-50 border-slate-100 text-indigo-600'}`}>
          🕒 System Time: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
        </div>
        
        {/* USER CONFIGURATION INPUT FORM ELEMENT LAYOUT BLOCK */}
        <div className="flex flex-col gap-3.5 mb-6">
          <input 
            type="text" 
            value={text} 
            onChange={(e) => setText(e.target.value)} 
            placeholder="What should we track for you?"
            className={`w-full p-3 rounded-xl border text-sm font-medium transition-all outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-slate-300'}`}
          />
          
          <input 
            type="datetime-local" 
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className={`w-full p-3 rounded-xl border text-sm font-semibold transition-all outline-none focus:ring-2 focus:ring-emerald-500 ${darkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-slate-600' : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-slate-300'}`}
          />
          
          <button 
            onClick={addTodo} 
            className="w-full p-3.5 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/10 hover:bg-emerald-600 active:scale-[0.99] transition-all tracking-wide"
          >
            Deploy Safe Localized Timer
          </button>
        </div>

        {/* ALARMS RENDER ARRAY FEED WRAPPER PANEL */}
        <div className="border-t pt-4 border-slate-100 dark:border-slate-700">
          <h4 className="text-xs font-bold uppercase tracking-widest opacity-50 mb-3">Active Pipeline ({todos.filter(t => !t.alerted).length})</h4>
          <ul className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {todos.length === 0 && <p className="text-sm opacity-40 text-center py-4 italic">No trackers initialized inside local device storage.</p>}
            {todos.map((todo) => (
              <li 
                key={todo.id} 
                className={`flex justify-between items-center p-3 rounded-xl border transition-all ${todo.alerted ? 'opacity-40 border-dashed' : 'shadow-sm'} ${darkMode ? 'bg-slate-900/30 border-slate-700/60' : 'bg-slate-50/50 border-slate-200/60'}`}
              >
                <div className="truncate max-w-[80%]">
                  <div className={`text-sm font-semibold truncate ${todo.alerted ? 'line-through opacity-70' : ''}`}>{todo.text}</div>
                  <small className="text-[11px] font-medium opacity-50 block mt-0.5">
                    {new Date(todo.deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
                  </small>
                </div>
                <button 
                  onClick={() => deleteTodo(todo.id)} 
                  className="p-1 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 text-base active:scale-90 transition-all"
                >
                  ❌
                </button>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}

export default PrivateReminderApp;
