
import React from 'react';

interface StartExperienceButtonProps {
    onClick: () => void;
}

const StartExperienceButton: React.FC<StartExperienceButtonProps> = ({ onClick }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <button
                onClick={onClick}
                className="px-8 py-4 bg-gray-900/80 text-white text-lg font-semibold border border-white/20 rounded-xl shadow-lg shadow-black/50 transition-all duration-300 hover:bg-white hover:text-black hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white"
            >
                Iniciar Experiencia
            </button>
        </div>
    );
};

export default StartExperienceButton;
