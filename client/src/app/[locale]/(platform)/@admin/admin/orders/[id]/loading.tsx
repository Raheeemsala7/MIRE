export default function OrderDetailsLoading() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-pulse">
      <div className="h-10 w-48 rounded-xl bg-muted/60" />
      <div className="h-44 rounded-2xl bg-muted/40" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 h-96 rounded-2xl bg-muted/40" />
        <div className="lg:col-span-7 h-96 rounded-2xl bg-muted/40" />
      </div>
    </div>
  );
}
