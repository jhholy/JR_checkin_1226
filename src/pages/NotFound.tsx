import { Link } from 'react-router-dom';
import { MuayThaiIcon } from '../components/icons/MuayThaiIcon';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <MuayThaiIcon className="mx-auto text-muaythai-red" />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          404
        </h1>
        
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          页面未找到
          <br />
          Page Not Found
        </h2>
        
        <p className="text-gray-600 mb-8">
          抱歉，您访问的页面不存在。
          <br />
          Sorry, the page you are looking for does not exist.
        </p>
        
        <Link
          to="/"
          className="inline-block bg-muaythai-red hover:bg-red-700 text-white font-medium py-2 px-6 rounded-md transition-colors"
        >
          返回首页
          <br />
          Return Home
        </Link>
      </div>
    </div>
  );
} 