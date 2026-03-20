import { CloudSun } from 'lucide-react';
import './Header.css';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function Header({ weather }) {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="greeting">{getGreeting()}, Miyoung</h1>
        <p className="date">{formatDate()}</p>
      </div>

      <div className="header-right">
        {weather && !weather.error ? (
          <div className="weather">
            {weather.icon
              ? <img src={weather.icon} alt={weather.description} className="weather-icon" />
              : <CloudSun size={32} strokeWidth={1.5} color="#f5b942" />
            }
            <div className="weather-info">
              <span className="weather-temp">{weather.temp}°C</span>
              <span className="weather-details">{weather.description} · {weather.city}</span>
            </div>
          </div>
        ) : (
          <div className="weather weather--error">
            <CloudSun size={20} strokeWidth={1.5} />
            <span>{weather?.error || 'Loading weather...'}</span>
          </div>
        )}
      </div>
    </header>
  );
}
