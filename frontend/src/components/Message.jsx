function Message({ role, text, loading = false }) {
  return (
    <article className={`message-row ${role === "user" ? "user" : "bot"}`}>
      {role === "bot" ? <div className="message-avatar">AI</div> : null}
      <div className={`message-bubble ${role === "user" ? "user-bubble" : "bot-bubble"}`}>
        <span className="message-role">{role === "user" ? "You" : "Assistant"}</span>
        <p className={loading ? "message-text loading-text" : "message-text"}>{text}</p>
        {loading ? (
          <div className="typing-indicator" aria-label="Assistant is typing">
            <span />
            <span />
            <span />
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default Message;
