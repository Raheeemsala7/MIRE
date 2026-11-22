export default function OrdersLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="h-10 w-64 rounded-xl bg-muted/60" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-muted/40" />
        ))}
      </div>
      <div className="h-96 rounded-2xl bg-muted/40" />
    </div>
  );
}
