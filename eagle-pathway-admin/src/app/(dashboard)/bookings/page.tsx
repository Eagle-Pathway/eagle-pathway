export default function BookingsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage tutoring sessions and bookings</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
         <div className="mx-auto h-16 w-16 bg-brand-gold/20 rounded-full flex items-center justify-center mb-4">
            <span className="text-brand-gold text-2xl">📅</span>
         </div>
         <h2 className="text-xl font-bold text-gray-900">Coming Soon</h2>
         <p className="mt-2 text-gray-500 max-w-sm mx-auto">Bookings management is still under development. You will be able to track and manage student-tutor sessions here.</p>
      </div>
    </div>
  );
}
