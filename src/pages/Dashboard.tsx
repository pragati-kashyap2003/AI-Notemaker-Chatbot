
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Sidebar from "@/components/Sidebar";
import { useState } from "react";

interface Note {
  id: number;
  title: string;
  date: string;
  content: string;
}

const Dashboard = () => {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 1,
      title: "Pragati's notes",
      date: "2025-04-22",
      content: "Pragati kashyap (01)",
    },
    {
      id: 2,
      title: "Shaina's notes",
      date: "2025-04-21",
      content: "Shaina Choudhary (03)",
    },
    {
      id: 3,
      title: "Uday's notes",
      date: "2025-04-22",
      content: "Uday sankar Chintha (17)",
    },
  ]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Sidebar />
      
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Your Meeting Notes
            </h1>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              Create New Note
            </Button>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {notes.map((note) => (
              <Card 
                key={note.id} 
                className="p-6 bg-white/80 backdrop-blur-lg shadow-lg hover:shadow-xl transition-all duration-300 border border-blue-100/50 rounded-xl"
              >
                <h3 className="font-semibold text-lg text-gray-900 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                  {note.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4">{note.date}</p>
                <p className="text-gray-600 mb-4 line-clamp-3">{note.content}</p>
                <Button 
                  variant="outline" 
                  className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  View Note
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
