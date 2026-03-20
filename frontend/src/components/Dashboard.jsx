import Header from './Header.jsx';
import InboxPanel from './InboxPanel.jsx';
import Schedule from './Schedule.jsx';
import Tasks from './Tasks.jsx';
import './Dashboard.css';

export default function Dashboard({
  weather, schedule, sessions,
  onDefer, onUndefer, onComplete,
  onAddSchedule, onDeleteSchedule,
  onNavigateCalendar,
}) {
  return (
    <div className="dashboard">
      <Header weather={weather} />
      <div className="dashboard-body">
        <InboxPanel />
        <div className="dashboard-grid">
          <Schedule
            items={schedule}
            todayOnly
            onAdd={onAddSchedule}
            onDelete={onDeleteSchedule}
            onViewAll={onNavigateCalendar}
          />
          <Tasks
            sessions={sessions}
            onDefer={onDefer}
            onUndefer={onUndefer}
            onComplete={onComplete}
          />
        </div>
      </div>
    </div>
  );
}
