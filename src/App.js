import { useState, useEffect, useRef } from 'react';

function dannysReminderApp() {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('local_reminders');
    return saved ? JSON.parse(saved) : [];
  });

  const [text, setText] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeAlarm, setActiveAlarm] = useState(null);
  
  // Pure React state to track if dark mode is turned on
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme_preference') === 'dark';
  });

  const wakeLockRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('local_reminders', JSON.stringify(todos));
  }, [todos]);

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
      alert('Please fill out both fields.');
      return;
    }
    setTodos([...todos, { id: Date.now(), text, deadline: dateTime, alerted: false }]);
    setText('');
    setDateTime('');
  };

  const deleteTodo = (idToDelete) => {
    setTodos(todos.filter(todo => todo.id !== idToDelete));
  };

  // Defining style themes using pure JavaScript objects
  const themeContainer = {
    padding: '24px',
    maxWidth: '420px',
    margin: '40px auto',
    fontFamily: 'sans-serif',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    borderRadius: '12px',
    transition: 'background-color 0.3s, color 0.3s',
    backgroundColor: darkMode ? '#1e293b' : '#ffffff',
    color: darkMode ? '#ffffff' : '#334155'
  };

  const inputStyle = {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
    backgroundColor: darkMode ? '#334155' : '#ffffff',
    color: darkMode ? '#ffffff' : '#000000'
  };

  return (
    <div style={themeContainer}>
      
      {/* Header section with theme toggle button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0 }}>🔒 Private Reminders</h2>
        <button 
          onClick={() => setDarkMode(!darkMode)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', cursor: 'pointer', background: darkMode ? '#334155' : '#f1f5f9', color: darkMode ? '#fff' : '#000' }}
        >
          {darkMode ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      <p style={{ margin: '0 0 20px 0', color: darkMode ? '#94a3b8' : '#666', fontSize: '13px', textAlign: 'center' }}>
        No accounts. Keep this tab open on mobile to keep screen awake.
      </p>
      
      {/* Alarm overlay block */}
      {activeAlarm && (
        <div style={{ padding: '16px', background: '#ef4444', color: 'white', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>🚨 ALARM RINGING!</h3>
          <p style={{ margin: '0 0 12px 0', fontWeight: 'bold' }}>{activeAlarm}</p>
          <button onClick={stopAlarmSound} style={{ padding: '8px 16px', background: 'white', color: '#ef4444', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
            DISMISS ALARM
          </button>
        </div>
      )}

      {/* Clock section */}
      <div style={{ padding: '12px', background: darkMode ? '#0f172a' : '#f5f5f7', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontSize: '14px', fontWeight: '500' }}>
        🕒 System Time: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
      </div>
      
      {/* Input panel block */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        <input 
          type="text" 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder="e.g., Turn off the stove..."
          style={inputStyle}
        />
        
        <input 
          type="datetime-local" 
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          style={inputStyle}
        />
        
        <button onClick={addTodo} style={{ padding: '12px', background: '#0071e3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
          Set Audio Alarm
        </button>
      </div>

      <h4 style={{ margin: '0 0 10px 0' }}>Active Alarms ({todos.filter(t => !t.alerted).length})</h4>
      <ul style={{ listStyleType: 'none', paddingLeft: 0, margin: 0 }}>
        {todos.length === 0 && <p style={{ color: '#999', fontSize: '14px' }}>No reminders set.</p>}
        {todos.map((todo) => (
          <li key={todo.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #eee', background: todo.alerted ? (darkMode ? '#334155' : '#fafafa') : 'transparent', opacity: todo.alerted ? 0.6 : 1 }}>
            <div>
              <div style={{ fontWeight: '500', fontSize: '15px', textDecoration: todo.alerted ? 'line-through' : 'none' }}>{todo.text}</div>
              <small style={{ color: darkMode ? '#94a3b8' : '#888' }}>
                {new Date(todo.deadline).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}
              </small>
            </div>
            <button onClick={() => deleteTodo(todo.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>❌</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PrivateReminderApp;
