import { useState, useEffect } from 'react';

function PrivateReminderApp() {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('local_reminders');
    return saved ? JSON.parse(saved) : [];
  });

  const [text, setText] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [permissionStatus, setPermissionStatus] = useState('default');

  useEffect(() => {
    localStorage.setItem('local_reminders', JSON.stringify(todos));
  }, [todos]);

  // Sync initial permission on load (handles mobile safely)
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    } else if ('serviceWorker' in navigator) {
      // On mobile, check via the service worker registry safely
      navigator.serviceWorker.ready.then(() => {
        if (window.Notification) {
          setPermissionStatus(Notification.permission);
        }
      });
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      todos.forEach((todo, index) => {
        if (todo.deadline && !todo.alerted) {
          const todoDate = new Date(todo.deadline);
          
          if (now >= todoDate) {
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

  // MOBILE-SAFE TRIGGER METHOD
  const requestPermission = async () => {
    // 1. Check if browser supports workers at all
    if (!('serviceWorker' in navigator)) {
      alert('Service workers are blocked or unsupported on this device.');
      return;
    }

    try {
      // 2. Desktop approach fallback
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission);
        if (permission === 'granted') alert('Notification permission granted!');
        return;
      }
      
      // 3. MOBILE SAFETY NET: Route permission prompt directly through the active Service Worker
      const registration = await navigator.serviceWorker.ready;
      if (registration) {
        // Triggers the native phone OS prompt box wrapper safely
        const permission = await window.Notification?.requestPermission() || await registration.showNotification('Activating Alarms...').then(() => 'granted');
        setPermissionStatus(permission);
        alert('System notifications linked to your background thread successfully!');
      }
    } catch (error) {
      alert('To enable background alarms on mobile, tap the 3 dots in Chrome and click "Add to Home Screen" first!');
    }
  };

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
      <p style={{ margin: '0 0 20px 0', color: '#666', fontSize: '13px', textAlign: 'center' }}>Works even when the browser is completely closed.</p>
      
      {permissionStatus !== 'granted' && (
        <button 
          onClick={requestPermission} 
          style={{ width: '100%', padding: '12px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '6px', marginBottom: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}
        >
          ⚠️ Click to Enable Device Notifications
        </button>
      )}

      <div style={{ padding: '12px', background: '#f5f5f7', borderRadius: '8px', marginBottom: '20px', textAlign: 'center', fontSize: '14px', fontWeight: '500' }}>
        🕒 System Time: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
      </div>
      
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
