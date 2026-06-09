/**
 * File Purpose:
 * Renders a single user or assistant message bubble.
 */
function Message({ message }) {
  const { role, text, typing = false, createdAt } = message;

  /**
   * Message Timestamp
   * Formats persisted message times while allowing untimed messages to omit the label
   */
  const formattedTime = createdAt
    ? new Date(createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

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
        {formattedTime ? <div className="message-time">{formattedTime}</div> : null}
      </div>
    </article>
  );
}

export default Message;
