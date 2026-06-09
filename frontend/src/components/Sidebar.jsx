/**
 * File Purpose:
 * Displays saved chats and account actions for the chat workspace.
 */
function Sidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  user,
  onLogout,
  darkMode,
  sidebarOpen,
  onCloseSidebar,
}) {
  /**
   * Unique Chat List
   * Deduplicates chats by id before rendering recent history items
   */
  const uniqueChats = [...new Map(chats.map((chat) => [chat._id, chat])).values()];

  return (
    <aside className={`chat-sidebar ${darkMode ? "theme-dark" : "theme-light"} ${sidebarOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <p className="sidebar-label">Workspace</p>
          <h2>Chats</h2>
        </div>
        <button className="sidebar-close-button" type="button" onClick={onCloseSidebar}>
          &times;
        </button>
        <button className="sidebar-action" type="button" onClick={onNewChat}>
          + New Chat
        </button>
      </div>

      <div className="chat-list">
        <p className="sidebar-label">Recent</p>
        <div className="sidebar-history">
          {uniqueChats.length > 0 ? (
            uniqueChats.map((chat) => (
              <div
                key={chat._id}
                className={`history-item chat-item ${chat._id === activeChatId ? "active" : ""}`}
              >
                <button className="history-main" type="button" onClick={() => onSelectChat(chat._id)}>
                  <span className="history-title">{chat.title}</span>
                  <span className="history-count">{chat.messages.length} messages</span>
                </button>
                <button
                  className="history-delete-btn"
                  type="button"
                  aria-label={`Delete ${chat.title}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteChat(chat._id);
                  }}
                >
                  🗑️
                </button>
              </div>
            ))
          ) : (
            <div className="sidebar-empty">No chats yet</div>
          )}
        </div>
      </div>

      <div className="sidebar-footer">
        <div>
          <p className="sidebar-label">Signed in</p>
          <p className="sidebar-user">{user?.username || "User"}</p>
        </div>
        <button className="sidebar-logout" type="button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
