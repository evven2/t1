import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Moon, Sun, ClipboardList, Clock, CalendarCheck, LayoutGrid, CheckCircle2, Circle, Edit2, X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

const PRIORITIES = {
  URGENT: { id: 'urgent', label: '긴급', color: 'urgent' },
  MEDIUM: { id: 'medium', label: '중간', color: 'medium' },
  NORMAL: { id: 'normal', label: '일반', color: 'normal' },
};

const STATUS_FILTERS = {
  ALL: { id: 'all', label: '전체', icon: <LayoutGrid size={14} /> },
  PENDING: { id: 'pending', label: '진행 중', icon: <Circle size={14} /> },
  COMPLETED: { id: 'completed', label: '완료', icon: <CheckCircle2 size={14} /> },
};

function App() {
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputValue, setInputValue] = useState('');
  const [priority, setPriority] = useState(PRIORITIES.NORMAL.id);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  // Edit states
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const addTodo = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newTodo = {
      id: Date.now(),
      text: inputValue.trim(),
      completed: false,
      priority: priority,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    setTodos([newTodo, ...todos]);
    setInputValue('');
    setPriority(PRIORITIES.NORMAL.id);
  };

  const toggleTodo = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id 
          ? { 
              ...todo, 
              completed: !todo.completed, 
              completedAt: !todo.completed ? new Date().toISOString() : null 
            } 
          : todo
      )
    );
    if (editingId === id) cancelEdit();
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
    if (editingId === id) cancelEdit();
  };

  const startEdit = (todo) => {
    if (todo.completed) return;
    setEditingId(todo.id);
    setEditingText(todo.text);
  };

  const saveEdit = () => {
    if (!editingText.trim()) return;
    setTodos(
      todos.map((todo) =>
        todo.id === editingId ? { ...todo, text: editingText.trim() } : todo
      )
    );
    cancelEdit();
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const filteredTodos = todos.filter((todo) => {
    const matchesPriority = priorityFilter === 'all' || (todo.priority || 'normal') === priorityFilter;
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'completed' && todo.completed) || 
      (statusFilter === 'pending' && !todo.completed);
    
    return matchesPriority && matchesStatus;
  });

  return (
    <div className="app-container">
      <header className="header">
        <h1>To-Do</h1>
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle Theme">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </header>

      <form className="input-group glass-card" onSubmit={addTodo}>
        <div className="input-row" style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="새로운 할 일을 입력하세요..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{ flex: 1 }}
          />
          <div className="priority-selector">
            {Object.values(PRIORITIES).map((p) => (
              <button
                key={p.id}
                type="button"
                className={`priority-option ${p.color} ${priority === p.id ? 'active' : ''}`}
                onClick={() => setPriority(p.id)}
                title={p.label}
              />
            ))}
          </div>
          <button type="submit" className="add-btn">
            <Plus size={24} />
          </button>
        </div>
      </form>

      <div className="filters-container">
        <div className="filter-section">
          <span className="filter-label">진행 상태</span>
          <div className="filter-bar">
            {Object.values(STATUS_FILTERS).map((s) => (
              <button
                key={s.id}
                className={`filter-btn ${statusFilter === s.id ? 'active' : ''}`}
                onClick={() => setStatusFilter(s.id)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {s.icon} {s.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <span className="filter-label">중요도</span>
          <div className="filter-bar">
            <button 
              className={`filter-btn ${priorityFilter === 'all' ? 'active' : ''}`}
              onClick={() => setPriorityFilter('all')}
            >
              전체
            </button>
            {Object.values(PRIORITIES).map((p) => (
              <button
                key={p.id}
                className={`filter-btn ${priorityFilter === p.id ? 'active' : ''}`}
                onClick={() => setPriorityFilter(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="todo-list">
        <AnimatePresence mode='popLayout'>
          {filteredTodos.length > 0 ? (
            filteredTodos.map((todo) => (
              <motion.div
                key={todo.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: -50, transition: { duration: 0.2 } }}
                className="todo-item glass-card"
              >
                <button
                  className={`checkbox ${todo.completed ? 'checked' : ''}`}
                  onClick={() => toggleTodo(todo.id)}
                >
                  {todo.completed && <Check size={16} strokeWidth={3} />}
                </button>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {editingId === todo.id ? (
                    <input
                      className="edit-input"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      autoFocus
                    />
                  ) : (
                    <span className={`todo-text ${todo.completed ? 'completed' : ''}`}>
                      {todo.text}
                    </span>
                  )}
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`priority-badge ${todo.priority || 'normal'}`}>
                      {PRIORITIES[(todo.priority || 'normal').toUpperCase()]?.label}
                    </span>
                    <div className="timestamp">
                      <span><Clock size={12} /> {formatDate(todo.createdAt)} 등록</span>
                      {todo.completedAt && (
                        <span style={{ color: 'var(--success-color)' }}>
                          <CalendarCheck size={12} /> {formatDate(todo.completedAt)} 완료
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="todo-actions">
                  {editingId === todo.id ? (
                    <>
                      <button className="action-btn save" onClick={saveEdit}>
                        <Save size={18} />
                      </button>
                      <button className="action-btn" onClick={cancelEdit}>
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      {!todo.completed && (
                        <button className="action-btn edit" onClick={() => startEdit(todo)}>
                          <Edit2 size={18} />
                        </button>
                      )}
                      <button className="action-btn delete" onClick={() => deleteTodo(todo.id)}>
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="empty-state"
            >
              <ClipboardList size={64} />
              <p>
                조건에 맞는 항목이 없습니다.
                <br />필터를 변경하거나 새로운 할 일을 추가해 보세요!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;
