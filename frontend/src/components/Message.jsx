function Message({ message }) {
  const { role, text, typing = false, time } = message;

  return (
    <article className={`message-row ${role === "user" ? "user" : "bot"}`}>
      <div className={`message-bubble ${role === "user" ? "user-bubble" : "bot-bubble"}`}>
        <p className={typing ? "message-text loading-text" : "message-text"}>
          {typing ? "Typing" : text}
        </p>
        {typing ? (
          <div className="typing-indicator" aria-label="Assistant is typing">
            <span />
            <span />
            <span />
          </div>
        ) : null}
        {time ? <div className="message-time">{time}</div> : null}
      </div>
    </article>
  );
}

export default Message;
