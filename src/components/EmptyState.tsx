interface Props {
  title: string;
  message?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, message, action }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">🗓️</div>
      <p className="empty-title">{title}</p>
      {message ? <p className="empty-message">{message}</p> : null}
      {action}
    </div>
  );
}
