export default function Stepper({ steps, currentIndex }) {
  return (
    <div className="stepper">
      {steps.map((label, i) => (
        <div className="stepper-step" key={label} style={{ flex: i === steps.length - 1 ? '0 0 auto' : 1 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div className={`stepper-circle ${i < currentIndex ? 'done' : i === currentIndex ? 'current' : ''}`}>
              {i < currentIndex ? '✓' : i + 1}
            </div>
            <span className={`stepper-label ${i === currentIndex ? 'current' : ''}`}>{label}</span>
          </div>
          {i < steps.length - 1 && <div className={`stepper-line ${i < currentIndex ? 'done' : ''}`} />}
        </div>
      ))}
    </div>
  );
}
