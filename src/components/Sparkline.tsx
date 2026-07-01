const Sparkline = ({
  data,
  color = "var(--primary)",
}: {
  data: number[];
  color?: string;
}) => {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-px pointer-events-none" style={{ height: 48 }}>
      {data.map((val, i) => (
        <div
          key={i}
          className="flex-1 transition-all duration-300"
          style={{
            height: `${(val / max) * 100}%`,
            backgroundColor: i === data.length - 1 ? color : "currentColor",
            opacity: i === data.length - 1 ? 1 : 0.3,
          }}
        />
      ))}
    </div>
  );
};

export default Sparkline;
