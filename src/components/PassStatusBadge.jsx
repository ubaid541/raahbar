export default function PassStatusBadge({ status }) {
  const isOpen = status === 'open';
  return (
    <span className={`font-label text-xs font-black px-3 py-1.5 rounded-lg tracking-tighter uppercase ring-1 ${isOpen ? 'bg-secondary-container text-secondary ring-secondary/20' : 'bg-error-container text-error ring-error/20'}`}>
      {isOpen ? 'OPEN' : 'CLOSED'}
    </span>
  );
}
