import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, Moon, Sun, ClipboardList, Clock, CalendarCheck, LayoutGrid, CheckCircle2, Circle, Edit2, X, Save, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';
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
  DELETED: { id: 'deleted', label: '삭제', icon: <Trash2 size={14} /> },
};

function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [priority, setPriority] = useState(PRIORITIES.NORMAL.id);
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  // Edit & Alert states
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    fetchTodos();
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error('Error fetching todos:', error.message);
    } finally {
      setLoading(false);
    }
  };

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

  const addTodo = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setShowAlert(true);
      return;
    }

    const newTodo = {
      text: inputValue.trim(),
      completed: false,
      priority: priority,
      created_at: new Date().toISOString(),
      is_deleted: false
    };

    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([newTodo])
        .select();

      if (error) throw error;
      setTodos([data[0], ...todos]);
      setInputValue('');
      setPriority(PRIORITIES.NORMAL.id);
    } catch (error) {
      console.error('Error adding todo:', error.message);
    }
  };

  const toggleTodo = async (id) => {
    const todoToToggle = todos.find(t => t.id === id);
    const updates = {
      completed: !todoToToggle.completed,
      completed_at: !todoToToggle.completed ? new Date().toISOString() : null
    };

    try {
      const { error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setTodos(todos.map(t => t.id === id ? { ...t, ...updates } : t));
    } catch (error) {
      console.error('Error toggling todo:', error.message);
    }
    if (editingId === id) cancelEdit();
  };

  const deleteTodo = async (id) => {
    const updates = {
      is_deleted: true,
      deleted_at: new Date().toISOString()
    };

    try {
      const { error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setTodos(todos.map(t => t.id === id ? { ...t, ...updates } : t));
    } catch (error) {
      console.error('Error deleting todo:', error.message);
    }
    if (editingId === id) cancelEdit();
  };

  const startEdit = (todo) => {
    if (todo.completed) return;
    setEditingId(todo.id);
    setEditingText(todo.text);
  };

  const saveEdit = async () => {
    if (!editingText.trim()) {
      setShowAlert(true);
      return;
    }

    try {
      const { error } = await supabase
        .from('todos')
        .update({ text: editingText.trim() })
        .eq('id', editingId);

      if (error) throw error;
      setTodos(todos.map(t => t.id === editingId ? { ...t, text: editingText.trim() } : t));
      cancelEdit();
    } catch (error) {
      console.error('Error saving edit:', error.message);
    }
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
    
    // Status Filter Logic
    if (statusFilter === 'deleted') {
      return matchesPriority && todo.is_deleted;
    } else {
      // If not viewing 'deleted', exclude deleted items
      if (todo.is_deleted) return false;
      
      const matchesStatus = 
        statusFilter === 'all' || 
        (statusFilter === 'completed' && todo.completed) || 
        (statusFilter === 'pending' && !todo.completed);
      
      return matchesPriority && matchesStatus;
    }
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
                  className={`checkbox ${todo.completed ? 'checked' : ''} ${todo.is_deleted ? 'disabled' : ''}`}
                  onClick={() => !todo.is_deleted && toggleTodo(todo.id)}
                  disabled={todo.is_deleted}
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
                    <span className={`todo-text ${todo.completed ? 'completed' : ''} ${todo.is_deleted ? 'deleted' : ''}`}>
                      {todo.text}
                    </span>
                  )}
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`priority-badge ${todo.priority || 'normal'}`}>
                      {PRIORITIES[(todo.priority || 'normal').toUpperCase()]?.label}
                    </span>
                    <div className="timestamp">
                      <span><Clock size={12} /> {formatDate(todo.created_at)} 등록</span>
                      {todo.completed_at && !todo.is_deleted && (
                        <span style={{ color: 'var(--success-color)' }}>
                          <CalendarCheck size={12} /> {formatDate(todo.completed_at)} 완료
                        </span>
                      )}
                      {todo.is_deleted && (
                        <span style={{ color: 'var(--danger-color)' }}>
                          <Trash2 size={12} /> {formatDate(todo.deleted_at)} 삭제됨
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="todo-actions">
                   {!todo.is_deleted && (
                    editingId === todo.id ? (
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
                    )
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

      {/* Custom Alert Modal */}
      <AnimatePresence>
        {showAlert && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAlert(false)}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-icon">
                <AlertCircle size={32} />
              </div>
              <p>내용을 입력해 주세요!</p>
              <button className="modal-btn" onClick={() => setShowAlert(false)}>
                확인
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
