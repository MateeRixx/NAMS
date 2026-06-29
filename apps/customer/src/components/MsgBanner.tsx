interface Props {
  msg: string;
  variant?: 'error' | 'success' | 'info' | 'warning';
  onDismiss?: () => void;
}

const variantMap = {
  error: ['failed', 'could not', 'already', 'error', 'not found'],
  success: ['successful', 'generated', 'complete'],
  info: [],
  warning: [],
} as const;

function detectVariant(msg: string): 'error' | 'success' | 'info' {
  const lower = msg.toLowerCase();
  if (variantMap.error.some((k) => lower.includes(k))) return 'error';
  if (variantMap.success.some((k) => lower.includes(k))) return 'success';
  return 'info';
}

export default function MsgBanner({ msg, variant, onDismiss }: Props) {
  const v = variant || detectVariant(msg);

  return (
    <div className={`msg-banner ${v}`} role="alert">
      <span>{msg}</span>
      {onDismiss && (
        <button className="dismiss" onClick={onDismiss} aria-label="Dismiss message">
          &times;
        </button>
      )}
    </div>
  );
}
