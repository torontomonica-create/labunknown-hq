import { useState } from 'react';
import { Plus, X, ArrowRight, Circle } from 'lucide-react';
import './Schedule.css';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Schedule({ items, onAdd, onDelete, todayOnly = false, onViewAll }) {
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState('');
  const [date, setDate] = useState(todayStr());
  const [time, setTime] = useState('');

  const displayItems = (
    todayOnly
      ? items.filter(i => i.date === todayStr())
      : items.filter(i => i.date >= todayStr())
          .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))
  ).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd({ text: text.trim(), date, time });
    setText(''); setTime(''); setDate(todayStr());
    setShowForm(false);
  };

  return (
    <div className="schedule-card">
      <div className="schedule-header">
        <div className="schedule-header-left">
          <h2 className="schedule-title">Today's Schedule</h2>
          {todayOnly && onViewAll && (
            <button className="view-all-btn" onClick={onViewAll}>
              View all <ArrowRight size={12} strokeWidth={2} />
            </button>
          )}
        </div>
        <button className="add-btn" onClick={() => setShowForm(v => !v)}>
          {showForm ? <X size={14} strokeWidth={2} /> : <Plus size={14} strokeWidth={2} />}
          {showForm ? 'Cancel' : 'Add'}
        </button>
      </div>

      {showForm && (
        <form className="schedule-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="What's on your schedule?"
            value={text}
            onChange={e => setText(e.target.value)}
            autoFocus
          />
          <div className="schedule-form-row">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} />
            <input type="time" value={time} onChange={e => setTime(e.target.value)} />
          </div>
          <button type="submit" className="submit-btn">Save</button>
        </form>
      )}

      <div className="schedule-list">
        {displayItems.length === 0 ? (
          <p className="empty-msg">No events today</p>
        ) : (
          displayItems.map(item => (
            <div key={item.id} className="schedule-item">
              <Circle size={6} strokeWidth={0} fill="#f5b942" className="schedule-dot" />
              <div className="schedule-item-info">
                {item.time && <span className="schedule-time">{item.time}</span>}
                <span className="schedule-text">{item.text}</span>
              </div>
              <button className="delete-btn" onClick={() => onDelete(item.id)}>
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
