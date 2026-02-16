import React from 'react';
import { Menu } from 'lucide-react';

interface HeaderProps {
    title: string;
    onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, onToggleSidebar }) => {
    return (
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 flex items-center justify-between flex-shrink-0 z-30 sticky top-0">
            <div className="flex items-center gap-4">
                <button onClick={onToggleSidebar} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg">
                    <Menu className="w-6 h-6" />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                </div>
            </div>
        </header>
    );
};

export default Header;