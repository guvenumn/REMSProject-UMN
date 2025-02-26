export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-blue-600 p-6">
            <h1 className="text-3xl font-bold text-white">Real Estate Management System by Titans</h1>
            <p className="text-blue-100 mt-2">Frontend Application</p>
          </div>
          
          <div className="p-6">
            <div className="flex items-center justify-center mb-6">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-2xl font-semibold text-gray-800">System Status: Online</h2>
                <p className="text-gray-600">Next.js application is running successfully</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="font-medium text-gray-700">Server Information</h3>
                <p className="text-gray-600 text-sm">Running on Next.js</p>
                <p className="text-gray-600 text-sm">With TypeScript & Tailwind CSS</p>
              </div>
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <h3 className="font-medium text-gray-700">Current Time</h3>
                <p className="text-gray-600 text-sm">{new Date().toLocaleString()}</p>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Development in progress...</h3>
              <p className="text-gray-600">
             
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}