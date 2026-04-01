function Sidebar({
  chats,
  activeChatId,
  onNewChat,
  onSelectChat,
  user,
  onLogout,
  darkMode,
  sidebarOpen,
  onCloseSidebar,
}) {
  return (
    <aside className={`chat-sidebar ${darkMode ? "theme-dark" : "theme-light"} ${sidebarOpen ? "open" : ""}`}>
      <div className="sidebar-top">
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

      <div className="sidebar-history">
        <p className="sidebar-label">Recent</p>
        {chats.length > 0 ? (
          chats.map((chat) => (
            <button
              key={chat.id}
              className={`history-item ${chat.id === activeChatId ? "active" : ""}`}
              type="button"
              onClick={() => onSelectChat(chat.id)}
            >
              <span className="history-title">{chat.title}</span>
              <span className="history-count">{chat.messages.length} messages</span>
            </button>
          ))
        ) : (
          <div className="sidebar-empty">No chats yet</div>
        )}
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
