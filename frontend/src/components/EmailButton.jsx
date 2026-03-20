import './EmailButton.css';

export default function EmailButton() {
  return (
    <div className="email-card">
      <div className="email-card-title">
        <span className="email-icon">📧</span>
        <h2>야후 메일</h2>
      </div>
      <p className="email-desc">받은 편지함 확인하기</p>
      <a
        href="https://mail.yahoo.com"
        target="_blank"
        rel="noopener noreferrer"
        className="email-btn"
      >
        메일 열기 →
      </a>
    </div>
  );
}
