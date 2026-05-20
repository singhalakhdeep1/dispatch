"use client";

interface Props {
    isOnline: boolean;
    onToggle: () => void;
}

export function StatusToggle({ isOnline, onToggle }: Props) {
    return (
        <div className="flex flex-col items-center gap-3 py-6">
            <button
                onClick={onToggle}
                className={`h-32 w-32 rounded-full text-white font-bold text-lg shadow-lg transition-colors ${isOnline ? "bg-green-500 hover:bg-green-600" : "bg-gray-400 hover:bg-gray-500"
                    }`}
            >
                {isOnline ? "ONLINE" : "OFFLINE"}
            </button>
            <p className="text-sm text-gray-500">
                {isOnline ? "You are accepting orders" : "Tap to go online"}
            </p>
        </div>
    );
}
