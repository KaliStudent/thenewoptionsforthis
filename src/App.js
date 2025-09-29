import React, { useState, useEffect } from 'react';
import { Calendar, Brain, Plus, Settings, Home, CheckCircle, Circle, Trash2, Sparkles, Target, TrendingUp, MessageCircle, Moon, Sun } from 'lucide-react';

const PlannerApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [aiApiKey, setAiApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [newGoal, setNewGoal] = useState({ title: '', description: '', targetDate: '' });
  const [showAddGoal, setShowAddGoal] = useState(false);

  // AI Integration
  const callOpenAI = async (prompt, context = '') => {
    if (!aiApiKey) {
      alert('Please configure your OpenAI API key in Settings');
      return null;
    }

    setLoading(true);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: `${context}\n\nUser request: ${prompt}` }]
        })
      });
      
      const data = await response.json();
      return data.content[0].text;
    } catch (error) {
      console.error('AI API Error:', error);
      return "AI service temporarily unavailable. Please try again later.";
    } finally {
      setLoading(false);
    }
  };

  const generateAISuggestions = async () => {
    const context = `Current tasks: ${JSON.stringify(tasks.slice(0, 5))}\nCurrent goals: ${JSON.stringify(goals.slice(0, 3))}`;
    const prompt = "Provide 3 productivity suggestions based on my tasks and goals. Format as JSON array with 'title' and 'description' fields.";
    
    const response = await callOpenAI(prompt, context);
    if (response) {
      try {
        setAiSuggestions(JSON.parse(response));
      } catch {
        setAiSuggestions([{ title: "AI Suggestion", description: response }]);
      }
    }
  };

  const generateTaskFromDescription = async (description) => {
    const prompt = `Convert "${description}" into a structured task. Return JSON with: title, description, priority (high/medium/low), estimatedDuration (minutes), category.`;
    const response = await callOpenAI(prompt);
    
    if (response) {
      try {
        return JSON.parse(response);
      } catch {
        return { title: description, description, priority: 'medium', estimatedDuration: 30, category: 'general' };
      }
    }
    return null;
  };

  // Core Functions
  const addTask = async (taskData) => {
    const newTask = {
      id: Date.now(),
      ...taskData,
      completed: false,
      createdAt: new Date().toISOString(),
      aiGenerated: taskData.aiGenerated || false
    };
    setTasks(prev => [...prev, newTask]);
  };

  const toggleTask = (taskId) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (taskId) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const addGoal = (goalData) => {
    const newGoal = {
      id: Date.now(),
      ...goalData,
      progress: 0,
      createdAt: new Date().toISOString()
    };
    setGoals(prev => [...prev, newGoal]);
  };

  const handleQuickAdd = async () => {
    if (!newTaskInput.trim()) return;
    
    if (aiApiKey) {
      const aiTask = await generateTaskFromDescription(newTaskInput);
      if (aiTask) {
        await addTask({ ...aiTask, aiGenerated: true });
      } else {
        await addTask({ title: newTaskInput, description: newTaskInput });
      }
    } else {
      await addTask({ title: newTaskInput, description: newTaskInput });
    }
    
    setNewTaskInput('');
  };

  const handleAddGoal = () => {
    if (!newGoal.title.trim()) return;
    addGoal(newGoal);
    setNewGoal({ title: '', description: '', targetDate: '' });
    setShowAddGoal(false);
  };

  const sendChatMessage = async (message) => {
    const userMessage = { role: 'user', content: message, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMessage]);

    const context = `Planner app context. Tasks: ${JSON.stringify(tasks.slice(0, 3))}\nGoals: ${JSON.stringify(goals.slice(0, 2))}`;
    const response = await callOpenAI(message, context);
    
    if (response) {
      const aiMessage = { role: 'assistant', content: response, timestamp: new Date() };
      setChatMessages(prev => [...prev, aiMessage]);
    }
  };

  // Dashboard Component
  const Dashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending Tasks</p>
              <p className="text-2xl font-bold">{tasks.filter(task => !task.completed).length}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-green-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completed</p>
              <p className="text-2xl font-bold">{tasks.filter(task => task.completed).length}</p>
            </div>
            <Target className="h-8 w-8 text-green-500" />
          </div>
        </div>
        
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-purple-50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Goals</p>
              <p className="text-2xl font-bold">{goals.length}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            AI Suggestions
          </h3>
          <button
            onClick={generateAISuggestions}
            disabled={loading}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Refresh'}
          </button>
        </div>
        
        {aiSuggestions.length > 0 ? (
          <div className="space-y-2">
            {aiSuggestions.map((suggestion, index) => (
              <div key={index} className={`p-3 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className="font-medium">{suggestion.title}</h4>
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {suggestion.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Click "Refresh" to get AI-powered suggestions based on your tasks and goals.
          </p>
        )}
      </div>
    </div>
  );

  // Tasks Component
  const TaskManager = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Tasks</h2>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={newTaskInput}
          onChange={(e) => setNewTaskInput(e.target.value)}
          placeholder={aiApiKey ? "Describe your task (AI will structure it)..." : "Add a quick task..."}
          className={`flex-1 px-3 py-2 border rounded-lg ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
          onKeyPress={(e) => e.key === 'Enter' && handleQuickAdd()}
        />
        <button
          onClick={handleQuickAdd}
          disabled={!newTaskInput.trim() || loading}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add'}
        </button>
      </div>

      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="flex items-start gap-3">
              <button onClick={() => toggleTask(task.id)}>
                {task.completed ? 
                  <CheckCircle className="h-5 w-5 text-green-500 mt-1" /> : 
                  <Circle className="h-5 w-5 text-gray-400 mt-1" />
                }
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                  </h3>
                  {task.aiGenerated && <Sparkles className="h-4 w-4 text-yellow-500" />}
                </div>
                {task.description && task.description !== task.title && (
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {task.description}
                  </p>
                )}
                <div className="flex gap-4 text-xs text-gray-500 mt-2">
                  {task.priority && <span>Priority: {task.priority}</span>}
                  {task.estimatedDuration && <span>Est: {task.estimatedDuration}min</span>}
                  {task.category && <span>Category: {task.category}</span>}
                </div>
              </div>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Goals Component
  const GoalTracker = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Goals</h2>
        <button
          onClick={() => setShowAddGoal(!showAddGoal)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600"
        >
          <Plus className="h-4 w-4" />
          Add Goal
        </button>
      </div>

      {showAddGoal && (
        <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Goal title"
              value={newGoal.title}
              onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
              className={`w-full px-3 py-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            />
            <textarea
              placeholder="Goal description"
              value={newGoal.description}
              onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
              className={`w-full px-3 py-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              rows="3"
            />
            <input
              type="date"
              value={newGoal.targetDate}
              onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
              className={`w-full px-3 py-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddGoal}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Add Goal
              </button>
              <button
                onClick={() => setShowAddGoal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {goals.map(goal => (
          <div key={goal.id} className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="font-semibold">{goal.title}</h3>
            {goal.description && (
              <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {goal.description}
              </p>
            )}
            {goal.targetDate && (
              <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Target: {new Date(goal.targetDate).toLocaleDateString()}
              </p>
            )}
            <div className="mt-3">
              <div className={`w-full bg-gray-200 rounded-full h-2 ${darkMode ? 'bg-gray-700' : ''}`}>
                <div 
                  className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-1">{goal.progress}% complete</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Settings Component
  const SettingsPage = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Settings</h2>
      
      <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h3 className="text-lg font-semibold mb-4">AI Configuration</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">OpenAI API Key</label>
            <input
              type="password"
              value={aiApiKey}
              onChange={(e) => setAiApiKey(e.target.value)}
              placeholder="Enter your OpenAI API key"
              className={`w-full px-3 py-2 border rounded ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            />
            <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Your API key is stored locally and never shared
            </p>
          </div>
        </div>
      </div>

      <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <h3 className="text-lg font-semibold mb-4">Appearance</h3>
        <div className="flex items-center justify-between">
          <span>Dark Mode</span>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`flex items-center gap-2 px-3 py-1 rounded ${darkMode ? 'bg-yellow-500 text-black' : 'bg-gray-700 text-white'}`}
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {darkMode ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>
    </div>
  );

  // AI Chat Component
  const AIChat = () => (
    <div className={`fixed inset-x-4 bottom-20 top-20 md:inset-x-auto md:right-4 md:w-80 border rounded-lg shadow-lg flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-500" />
          AI Assistant
        </h3>
        <button
          onClick={() => setShowAIChat(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {chatMessages.length === 0 && (
          <div className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <p className="text-sm">Ask me anything about your tasks, goals, or productivity!</p>
          </div>
        )}
        
        {chatMessages.map((msg, index) => (
          <div key={index} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white ml-4' : `${darkMode ? 'bg-gray-700' : 'bg-gray-100'} mr-4`}`}>
            <p className="text-sm">{msg.content}</p>
          </div>
        ))}
        
        {loading && (
          <div className={`p-3 rounded-lg mr-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <p className="text-sm">AI is thinking...</p>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Ask AI anything..."
            className={`flex-1 px-3 py-2 border rounded text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.target.value.trim()) {
                sendChatMessage(e.target.value);
                e.target.value = '';
              }
            }}
          />
          <button
            onClick={(e) => {
              const input = e.target.previousElementSibling;
              if (input.value.trim()) {
                sendChatMessage(input.value);
                input.value = '';
              }
            }}
            className="px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );

  // Navigation
  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'tasks', label: 'Tasks', icon: CheckCircle },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // LocalStorage persistence
  useEffect(() => {
    const savedTasks = localStorage.getItem('plannerTasks');
    const savedGoals = localStorage.getItem('plannerGoals');
    const savedApiKey = localStorage.getItem('aiApiKey');
    const savedDarkMode = localStorage.getItem('darkMode');
    
    if (savedTasks) setTasks(JSON.parse(savedTasks));
    if (savedGoals) setGoals(JSON.parse(savedGoals));
    if (savedApiKey) setAiApiKey(savedApiKey);
    if (savedDarkMode) setDarkMode(JSON.parse(savedDarkMode));
  }, []);

  useEffect(() => {
    localStorage.setItem('plannerTasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('plannerGoals', JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    if (aiApiKey) localStorage.setItem('aiApiKey', aiApiKey);
  }, [aiApiKey]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'tasks': return <TaskManager />;
      case 'goals': return <GoalTracker />;
      case 'calendar': return (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 mx-auto mb-4 text-blue-500" />
          <h3 className="text-lg font-medium">Calendar View</h3>
          <p className="text-gray-500">Calendar functionality coming soon!</p>
        </div>
      );
      case 'settings': return <SettingsPage />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <header className={`border-b ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-blue-500" />
              <h1 className="text-xl font-bold">AI Planner</h1>
            </div>
            
            <button
              onClick={() => setShowAIChat(!showAIChat)}
              className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">AI Chat</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <nav className={`w-64 min-h-screen border-r ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="p-4">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setCurrentView(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        currentView === item.id
                          ? 'bg-blue-500 text-white'
                          : `hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-700' : ''}`
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <main className="flex-1 p-6">
          {renderCurrentView()}
        </main>
      </div>

      {showAIChat && <AIChat />}
    </div>
  );
};

export default PlannerApp;
