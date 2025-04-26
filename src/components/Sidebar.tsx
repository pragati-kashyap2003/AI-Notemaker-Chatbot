
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Book, LogIn } from "lucide-react";

const Sidebar = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900">Meeting Notes</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => navigate("/dashboard")}
        >
          <Book className="mr-2 h-4 w-4" />
          Notes
        </Button>
        
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => navigate("/chat")}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Chat
        </Button>
      </nav>
      
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => navigate("/")}
        >
          <LogIn className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
