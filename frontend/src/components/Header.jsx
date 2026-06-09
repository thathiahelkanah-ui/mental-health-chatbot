/**
 * File Purpose:
 * Renders mobile chat controls for navigation and theme switching.
 */
function Header({ title = "Mental Chat", darkMode, onToggleTheme, onToggleSidebar }) {
  return (
    <header className="mobile-chat-header">
      <button className="header-icon-button" type="button" onClick={onToggleSidebar} aria-label="Open chats">
        &#9776;
      </button>

      <h2 className="mobile-chat-title">{title}</h2>

      <button className="header-icon-button" type="button" onClick={onToggleTheme} aria-label="Toggle theme">
        {darkMode ? "Light" : "Dark"}
      </button>
    </header>
  );
}

export default Header;
