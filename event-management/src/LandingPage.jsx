import React from 'react';

const LandingPage = () => {

  const daysInMonth = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-[#F9F9F9] font-sans selection:bg-lime-200">
      
      {/* NAV */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        
        <div className="bg-black text-white text-sm font-bold px-3 py-1.5 tracking-wide">
          EventSphere
        </div>


        <div className="flex gap-0">
          <button className="bg-[#C4F249] text-black font-semibold px-5 py-1.5 text-sm hover:opacity-90 transition">
            Login
          </button>
          <button className="bg-black text-white font-semibold px-5 py-1.5 text-sm hover:opacity-80 transition">
            Signup
          </button>
        </div>
      </nav>

      {/* HERO Section */}
      <main className="max-w-7xl mx-auto px-6 pt-10 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        
        <div className="space-y-8">
          
          <h1 className="text-[#C4F249] text-6xl md:text-7xl font-normal leading-[1.1] tracking-tight">
            Your Complete <br />
            Event <br />
            Ecosystem
          </h1>

            <div className="space-y-4 max-w-lg">
              <h2 className="text-3xl font-medium text-black">About</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                EventSphere is a centralized event management platform where organizers create events, 
                administrators review and manage venues, and users discover, track, and book upcoming 
                or ongoing events—simple, structured, and seamless.
              </p>
            </div>

          <button className="bg-[#C4F249] text-black font-bold text-base px-8 py-3 shadow-sm hover:shadow-md transition transform hover:-translate-y-1">
            Get Started
          </button>
        </div>

        {/* RIGHT SIDE: Calendar Visual */}     
        <div className="relative flex justify-center lg:justify-end">
          
          <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md relative z-10">
            
            <div className="flex justify-between items-center mb-6">
              <button className="p-1 hover:bg-gray-100 rounded-full font-bold"> &lt; </button>
              <h3 className="text-xl font-bold text-gray-800">May 2024</h3>
              <button className="p-1 hover:bg-gray-100 rounded-full font-bold"> &gt; </button>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-xs text-gray-400 font-medium uppercase">{day}</div>
              ))}
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-7 gap-2 text-center text-sm text-gray-600 font-medium">
              
              {/* Empty slots for previous month padding (just for visual accuracy)
              <div></div><div></div><div></div> */}

              
              {daysInMonth.map((day) => {
                const isSelected = day === 17; 
                return (
                  <div key={day} className="relative py-2 flex flex-col items-center justify-center">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-md ${isSelected ? 'bg-[#C4F249] text-white font-bold' : 'hover:bg-gray-50 cursor-pointer'}`}>
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Floating "Upcoming Events" Card */}
          {/* <div className="absolute -bottom-10 -right-4 lg:-right-10 bg-white p-5 rounded-xl shadow-2xl z-20 w-64 border border-gray-100">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-800 mb-3">3 upcoming events</p>
              <button className="bg-[#C4F249] text-black text-sm font-semibold w-full py-2 rounded-lg hover:opacity-90">
                View Events
              </button>
            </div>
          </div> */}

        </div>
      </main>
    </div>
  );
};

export default LandingPage;