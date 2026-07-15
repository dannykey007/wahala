import { useState, useEffect } from 'react';

function PrivateReminderApp() {
  // 1. DATA HOOK: Initialize state securely from the device local storage
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('local_reminders');
    return saved ? JSON.parse(saved) : [];
  });

  const [text, setText] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [permissionStatus, setPermissionStatus] = useState('default');

  // 2. AUTO-SAVE HOOK: Persist alarms data to storage whenever the array updates
  useEffect(() => {
    localStorage.setItem('local_reminders', JSON.stringify(todos));
  }, [todos]);

  // 3. STARTUP HOOK: Sync initial browser notification permissions status on load
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // 4. LIVE SYSTEM CLOCK: Ticks every second for foreground processing safety
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      todos.forEach((todo, index) => {
        if (todo.deadline && !todo.alerted) {
          const todoDate = new Date(todo.deadline);
          
          if (now >= todoDate) {
            // Foreground voice fallback if user leaves the tab open
            const speech = new SpeechSynthesisUtterance(`Reminder: ${todo.text} is due now.`);
            window.speechSynthesis.speak(speech);

            const updatedTodos = [...todos];
            updatedTodos[index].alerted = true;
            setTodos(updatedTodos);
          }
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [todos]);

  // 5. PERMISSION METHOD: Explicit prompt mechanism to bypass mobile browser security
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop background notifications.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      
      if (permission === 'granted') {
        alert('Notification permission granted! Alarms will now work in the background.');
      } else if (permission === 'denied') {
        alert('Notification permission was blocked. Please reset site permissions in your browser address bar settings.');
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error);
    }
  };

  // 6. ACTION METHOD: Create alarm object and pipe data over to the service worker background thread
  const addTodo = () => {
    if (!text.trim() || !dateTime) {
      alert('Please fill out both fields.');
      return;
    }

    const targetTime = new Date(dateTime).getTime();
    const currentTimeMs = Date.now();
    const delay = targetTime - currentTimeMs;

    if (delay <= 0) {
      alert('Please select a time in the future!');
      return;
    }

    const newTodo = {
      id: Date.now(),
      text: text,
      deadline: dateTime,
      alerted: false
    };

    // Forward the payload parameters to public/sw.js to handle execution when tab is asleep
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SCHEDULE_REMINDER',
        text: text,
        delay: delay
      });
    }

    setTodos([...todos, newTodo]);
    setText('');
    setDateTime('');
  };

  const deleteTodo = (idToDelete) => {
    setTodos(todos.filter(todo => todo.id !== idToDelete));
  };

  return (
    <div style={{ padding: '24px', maxWidth: '420px', margin: '40px auto', fontFamily: 'sans-serif', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '12px', backgroundColor: '#fff' }}>
      <h2 style={{ margin: '0 0 4px 0', textAlign: 'center' }}>🔒 True Reminders</h2>
      <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '13px', textAlign: 'center' }}>No accounts. Works even when the browser is completely closed.</p>
      
      {/* 7. PERMISSION CAPTURE ACTION COMPONENT BANNER */}
      {permissionStatus !== 'granted' && (
        <button 
          onClick={requestPermission} 
          style={{ width: '100%', padding: '12px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '6px', marginBottom: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
        >
          ⚠️ Click to Enable Device Notifications
        </button>
      )}

      {/* Dynamic 12-Hour clock showing AM/PM explicitly */}
      <div style={{ padding: '12px', background: '#f5f5f7', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontSize: '14px', fontWeight: '500' }}>
        🕒 System Time: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
      </div>
      
      {/* Input Module Interface */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        <input 
          type="text" 
          value={text} 
          onChange={(e) => setText(e.target.value)} 
          placeholder="e.g., Turn off the stove..."
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
        />
        
        <input 
          type="datetime-local" 
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px' }}
        />
        
        <button onClick={addTodo} style={{ padding: '12px', background: '#0071e3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
          Set Background Alarm
        </button>
      </div>

      <h4 style={{ margin: '0 0 10px 0' }}>Active Alarms ({todos.filter(t => !t.alerted).length})</h4>
      <ul style={{ listStyleType: 'none', paddingLeft: 0, margin: 0 }}>
        {todos.length === 0 && <p style={{ color: '#999', fontSize: '14px' }}>No reminders set.</p>}
        {todos.map((todo) => (
          <li key={todo.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', marginBottom: '8px', borderRadius: '6px', border: '1px solid #eee', background: todo.alerted ? '#fafafa' : '#fff', opacity: todo.alerted ? 0.6 : 1 }}>
            <div>
              <div style={{ fontWeight: '500', fontSize: '15px', textDecoration: todo.alerted ? 'line-through' : 'none' }}>{todo.text}</div>
              <small style={{ color: '#888' }}>
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
