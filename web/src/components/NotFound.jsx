import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertCircle } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 animate-in fade-in zoom-in duration-500">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-blue-500/20 blur-[100px] rounded-full scale-150" />
        <h1 className="text-[12rem] font-black font-outfit leading-none tracking-tighter text-[var(--accent-secondary)] opacity-10 drop-shadow-2xl">
          404
        </h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <AlertCircle size={80} className="text-[#f1812e] animate-bounce" />
        </div>
      </div>
      
      <h2 className="text-3xl font-black font-outfit text-white mb-4 uppercase tracking-tight">
        Không tìm thấy trang yêu cầu
      </h2>
      <p className="text-[var(--text-secondary)] font-medium max-w-md mb-10 leading-relaxed">
        Có vẻ như đường dẫn bạn đang truy cập không tồn tại hoặc đã được di chuyển. 
        Đừng lo lắng, hãy quay về trang chủ để tiếp tục theo dõi giải đấu.
      </p>
      
      <Link
        to="/"
        className="flex items-center gap-2 px-8 py-4 bg-[#f1812e] hover:bg-[#d86d1b] text-white font-bold rounded-2xl shadow-xl shadow-[#f1812e]/20 transition-all hover:scale-105 active:scale-95 group"
      >
        <Home size={20} className="group-hover:-translate-y-0.5 transition-transform" />
        <span>Quay về Trang chủ</span>
      </Link>
    </div>
  );
};

export default NotFound;
