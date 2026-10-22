export function LoadingState({ message = 'جارٍ التحميل...' }: { message?: string }) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-state" role="alert">
      <p className="error-title">حدث خطأ</p>
      <p className="error-message">{message}</p>
      {onRetry ? (
        <button type="button" className="btn btn-outline" onClick={onRetry}>
          إعادة المحاولة
        </button>
      ) : null}
    </div>
  );
}
