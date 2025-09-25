import React from "react";
import { MessageCircle } from "lucide-react";

interface Props {
  count: number;
  onClick: () => void;
}

const MessageIconWithCounter: React.FC<Props> = ({ count, onClick }) => (
  <div className="relative cursor-pointer" onClick={onClick}>
    <MessageCircle className="h-7 w-7 text-blue-600" />
    {count > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
        {count}
      </span>
    )}
  </div>
);

export default MessageIconWithCounter;
