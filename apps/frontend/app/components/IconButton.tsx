import { ReactNode } from "react";

export function IconButton({
    icon, onClick, activated
}: {
    icon: ReactNode,
    onClick: () => void,
    activated: boolean
}) {
    return <div className={`
        pointer p-2 
        hover:bg-gray-200/20 
        hover:rounded-md
        backdrop-blur-md 
        shadow-md 
        ${activated ? "text-red-400 bg-white/20 rounded-md" : "text-white "}
      `} onClick={onClick}>
        {icon}
    </div>
}
