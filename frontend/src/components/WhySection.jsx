import { Gift, Send, Timer } from "lucide-react";

export default function WhySection() {
  return (
    <section className="bg-[#A6E7F2] py-16 px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center md:items-start gap-10">
        
        {/* LEFT TEXT */}
        <div className="flex-1 text-left">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            WHY TheLùůpa?
          </h2>

          <p className="text-gray-700 mb-4">
            Because we believe every trip can be more than a destination.
          </p>

          <p className="text-gray-700 mb-4">
            TheLùůpa started with a simple idea – to bring joy back into everyday travel.
          </p>

          <p className="text-gray-700">
            Our system helps you book buses easily, discover new destinations,
            or even surprise someone with a ticket.
          </p>
        </div>

        {/* RIGHT ICON CARDS */}
        <div className="flex flex-col gap-4 w-full md:w-1/3">

          <div className="bg-white shadow-md rounded-lg p-4 flex items-center gap-4">
            <Gift size={32} />
            <div>
              <h4 className="text-lg font-semibold">Gift a Ticket</h4>
              <p className="text-sm text-gray-600">share the road with your friends</p>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-4 flex items-center gap-4">
            <Send size={32} />
            <div>
              <h4 className="text-lg font-semibold">Surprise Route</h4>
              <p className="text-sm text-gray-600">let the journey choose you</p>
            </div>
          </div>

          <div className="bg-white shadow-md rounded-lg p-4 flex items-center gap-4">
            <Timer size={32} />
            <div>
              <h4 className="text-lg font-semibold">Fast Booking</h4>
              <p className="text-sm text-gray-600">because your time matters</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
