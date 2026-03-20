import { useState } from 'react';
import './CalendarView.css';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return d.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function CalendarView({ schedule, onAdd, onDelete }) {
  const [view, setView] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [newText, setNewText] = useState('');
  const [newTime, setNewTime] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthLabel = currentDate.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });

  const prevPeriod = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextPeriod = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const openForm = (dateStr = todayStr()) => {
    setSelectedDate(dateStr);
    setNewText('');
    setNewTime('');
    setShowForm(true);
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    onAdd({ text: newText.trim(), date: selectedDate, time: newTime });
    setShowForm(false);
  };

  return (
    <div className="cal-page">
      {/* Toolbar */}
      <div className="cal-toolbar">
        <h1 className="cal-heading">Calendar</h1>
        <div className="cal-controls">
          <div className="view-toggle">
            {['month', 'week', 'list'].map(v => (
              <button
                key={v}
                className={`view-btn ${view === v ? 'view-btn--active' : ''}`}
                onClick={() => setView(v)}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button className="today-btn" onClick={goToday}>Today</button>
          <div className="nav-group">
            <button className="nav-btn" onClick={prevPeriod}>‹</button>
            <span className="nav-label">{monthLabel}</span>
            <button className="nav-btn" onClick={nextPeriod}>›</button>
          </div>
          <button className="add-event-btn" onClick={() => openForm()}>+ Add event</button>
        </div>
      </div>

      {/* Add event modal */}
      {showForm && (
        <div className="form-overlay" onClick={() => setShowForm(false)}>
          <form className="event-form" onClick={e => e.stopPropagation()} onSubmit={handleAddEvent}>
            <h3>Add Event</h3>
            <input
              type="text"
              placeholder="Event title"
              value={newText}
              onChange={e => setNewText(e.target.value)}
              autoFocus
            />
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
            <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} />
            <div className="form-actions">
              <button type="submit" className="form-save">Save</button>
              <button type="button" className="form-cancel" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Views */}
      {view === 'month' && (
        <MonthView year={year} month={month} schedule={schedule} onDayClick={openForm} onDelete={onDelete} />
      )}
      {view === 'week' && (
        <WeekView currentDate={currentDate} schedule={schedule} onDayClick={openForm} onDelete={onDelete} />
      )}
      {view === 'list' && (
        <ListView schedule={schedule} onDelete={onDelete} />
      )}
    </div>
  );
}

/* ─── Month View ─────────────────────────────── */
function MonthView({ year, month, schedule, onDayClick, onDelete }) {
  const today = todayStr();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="month-view">
      <div className="month-day-names">
        {DAY_NAMES.map(d => <div key={d} className="day-name">{d}</div>)}
      </div>
      <div className="month-grid">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e${idx}`} className="day-cell day-cell--empty" />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const events = schedule.filter(e => e.date === dateStr);
          const isToday = dateStr === today;
          return (
            <div
              key={dateStr}
              className={`day-cell ${isToday ? 'day-cell--today' : ''}`}
              onClick={() => onDayClick(dateStr)}
            >
              <span className={`day-num ${isToday ? 'day-num--today' : ''}`}>{day}</span>
              <div className="day-events">
                {events.slice(0, 3).map(ev => (
                  <div key={ev.id} className="day-event" onClick={e => e.stopPropagation()}>
                    <span className="day-event-dot" />
                    <span className="day-event-text">{ev.time ? `${ev.time} ` : ''}{ev.text}</span>
                    <button className="day-event-del" onClick={e => { e.stopPropagation(); onDelete(ev.id); }}>✕</button>
                  </div>
                ))}
                {events.length > 3 && <span className="day-more">+{events.length - 3}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Week View ──────────────────────────────── */
function WeekView({ currentDate, schedule, onDayClick, onDelete }) {
  const today = todayStr();
  const start = new Date(currentDate);
  start.setDate(currentDate.getDate() - currentDate.getDay());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="week-view">
      {days.map((d, i) => {
        const dateStr = d.toISOString().split('T')[0];
        const events = schedule
          .filter(e => e.date === dateStr)
          .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
        const isToday = dateStr === today;
        return (
          <div key={dateStr} className={`week-col ${isToday ? 'week-col--today' : ''}`}>
            <div className="week-col-header" onClick={() => onDayClick(dateStr)}>
              <span className="week-day-name">{DAY_NAMES[i]}</span>
              <span className={`week-day-num ${isToday ? 'week-day-num--today' : ''}`}>{d.getDate()}</span>
            </div>
            <div className="week-events">
              {events.length === 0
                ? <p className="week-empty">—</p>
                : events.map(ev => (
                    <div key={ev.id} className="week-event">
                      {ev.time && <span className="week-event-time">{ev.time}</span>}
                      <span className="week-event-text">{ev.text}</span>
                      <button className="week-event-del" onClick={() => onDelete(ev.id)}>✕</button>
                    </div>
                  ))
              }
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── List View ──────────────────────────────── */
function ListView({ schedule, onDelete }) {
  const today = todayStr();
  const upcoming = schedule
    .filter(e => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''));

  const grouped = {};
  for (const ev of upcoming) {
    if (!grouped[ev.date]) grouped[ev.date] = [];
    grouped[ev.date].push(ev);
  }

  if (upcoming.length === 0) {
    return <p className="list-empty">No upcoming events</p>;
  }

  return (
    <div className="list-view">
      {Object.entries(grouped).map(([date, events]) => (
        <div key={date} className="list-group">
          <div className="list-date-row">
            <span className="list-date">{formatDateLabel(date)}</span>
            {date === today && <span className="today-chip">Today</span>}
          </div>
          {events.map(ev => (
            <div key={ev.id} className="list-event">
              {ev.time && <span className="list-time">{ev.time}</span>}
              <span className="list-text">{ev.text}</span>
              <button className="list-del" onClick={() => onDelete(ev.id)}>✕</button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
