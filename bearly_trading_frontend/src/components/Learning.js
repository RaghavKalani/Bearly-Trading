import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, ChevronRight, Award, Compass, PlayCircle } from 'lucide-react';

const MODULES = [
  {
    id: 1,
    title: "Intro to Stock Market & Trading",
    description: "Learn the foundational concepts of stock exchanges, tickers, and standard trading terminology.",
    content: `A stock market represents a public marketplace where shares of publicly held companies are issued, bought, and sold. The primary mechanism is the matching of buyers and sellers through brokerages.

### Key Concepts:
1. **Shares / Equities**: Pieces of ownership in a corporation.
2. **Tickers / Symbols**: Short abbreviations of letters representing public companies (e.g., AAPL for Apple Inc.).
3. **Market Order**: An order to execute a transaction immediately at the current market price.
4. **Limit Order**: An order to buy/sell at a specified price or better.
    `,
    quiz: {
      question: "Which of the following ticker symbols belongs to Apple Inc.?",
      options: ["APPL", "AAPL", "APLE", "APP"],
      answer: 1
    }
  },
  {
    id: 2,
    title: "Technical Analysis & Chart Reading",
    description: "Understand candlestick charts, volume metrics, and basic moving averages to analyze trends.",
    content: `Technical analysis focuses on historical price movements and charts to forecast future price directions, rather than examining a company's financial balance sheet.

### Key Tools:
1. **Candlesticks**: Graphically display the high, low, opening, and closing price for a specific timeframe.
2. **Support & Resistance**: Price areas that tend to act as barriers, preventing price from going lower (support) or higher (resistance).
3. **Moving Averages (MA)**: Smooth out price trends by filtering noise. Standard indicators are the 50-day and 200-day moving averages.
    `,
    quiz: {
      question: "What does a candlestick's wick represent?",
      options: [
        "The highest and lowest traded prices during that period",
        "The opening and closing price of the day",
        "The total trading volume",
        "The average price of the stock"
      ],
      answer: 0
    }
  },
  {
    id: 3,
    title: "Risk Management & Cost Basis Strategy",
    description: "How to calculate position sizes, set stop losses, and understand portfolio diversification.",
    content: `Risk management is the most important concept in trading. It dictates how much capital you are willing to risk on a single position to prevent catastrophic portfolio losses.

### Pillars of Risk Management:
1. **The 2% Rule**: Never risk more than 2% of your total capital on a single trade.
2. **Stop-Loss Orders**: Automatic sell orders triggered when a stock drops to a certain price limit to cap losses.
3. **Diversification**: Spreading capital across different industries to minimize systemic risk.
4. **Cost Basis (Average Price)**: Calculating average purchase costs when adding shares to a position over time.
    `,
    quiz: {
      question: "According to the 2% Rule, how much total capital should you risk on a single trade?",
      options: ["At least 20%", "Exactly 10%", "No more than 2%", "0.5% max"],
      answer: 2
    }
  }
];

const Learning = () => {
  const [selectedModule, setSelectedModule] = useState(null);
  const [progress, setProgress] = useState({});
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [quizResult, setQuizResult] = useState(null);

  // Load progress from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('learning_progress');
    if (saved) {
      setProgress(JSON.parse(saved));
    }
  }, []);

  const handleCompleteModule = () => {
    if (!selectedModule) return;
    
    const updatedProgress = { ...progress, [selectedModule.id]: true };
    setProgress(updatedProgress);
    localStorage.setItem('learning_progress', JSON.stringify(updatedProgress));
    setQuizResult({ success: true, message: "Excellent! You've mastered this educational module." });
  };

  const handleQuizSubmit = (e) => {
    e.preventDefault();
    if (selectedAnswer === null || !selectedModule) return;

    if (selectedAnswer === selectedModule.quiz.answer) {
      handleCompleteModule();
    } else {
      setQuizResult({ success: false, message: "Incorrect answer. Re-read the module materials and try again!" });
    }
  };

  const completedCount = Object.keys(progress).filter(k => progress[k]).length;
  const progressPercent = Math.round((completedCount / MODULES.length) * 100);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 text-white font-sans bg-gray-950 min-h-screen">
      
      {/* Header banner */}
      <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-10"></div>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-blue-500" />
            Academy & Training
          </h1>
          <p className="text-gray-400 mt-1">Master simulated trading mechanisms and portfolio management strategies.</p>
        </div>

        {/* Progress Tracker Widget */}
        <div className="flex items-center space-x-4 bg-gray-950 p-4 border border-gray-800 rounded-2xl w-max">
          <Award className="w-10 h-10 text-yellow-500 fill-yellow-500/10" />
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Course Progress</p>
            <p className="text-lg font-bold">{completedCount} / {MODULES.length} Modules</p>
            <div className="w-32 bg-gray-800 h-2 rounded-full mt-1.5 overflow-hidden">
              <div 
                className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Module List Panel */}
        <div className="lg:col-span-5 bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2 pb-2 border-b border-gray-850">
            <Compass className="w-5 h-5 text-gray-400" />
            Curriculum
          </h3>
          
          <div className="space-y-3">
            {MODULES.map((mod) => {
              const isCompleted = progress[mod.id];
              const isSelected = selectedModule?.id === mod.id;
              
              return (
                <button
                  key={mod.id}
                  onClick={() => {
                    setSelectedModule(mod);
                    setSelectedAnswer(null);
                    setQuizResult(null);
                  }}
                  className={`w-full p-4 rounded-xl text-left border transition-all flex justify-between items-center ${
                    isSelected 
                      ? 'bg-blue-600/10 border-blue-500 text-white shadow-md' 
                      : 'bg-gray-950 border-gray-800 hover:bg-gray-850 text-gray-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-blue-400">Module {mod.id}</span>
                      {isCompleted && <CheckCircle className="w-4 h-4 text-green-500 fill-green-500/10" />}
                    </div>
                    <h4 className="font-bold text-sm text-white">{mod.title}</h4>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-500" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Module Detail Panel */}
        <div className="lg:col-span-7 bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl min-h-[400px]">
          {selectedModule ? (
            <div className="space-y-6">
              
              <div className="border-b border-gray-850 pb-4">
                <span className="text-xs font-semibold text-blue-400 tracking-wider uppercase">Lesson Materials</span>
                <h2 className="text-2xl font-extrabold text-white mt-1">{selectedModule.title}</h2>
                <p className="text-sm text-gray-400 mt-2 font-medium">{selectedModule.description}</p>
              </div>

              {/* Lesson Text */}
              <div className="prose prose-invert max-w-none text-gray-300 text-sm leading-relaxed space-y-4 font-normal whitespace-pre-wrap">
                {selectedModule.content}
              </div>

              {/* Lesson Quiz Form */}
              <div className="bg-gray-950 border border-gray-850 p-6 rounded-xl space-y-4">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-blue-400" />
                  Module Knowledge Check
                </h4>

                <form onSubmit={handleQuizSubmit} className="space-y-4">
                  <p className="text-sm font-semibold text-gray-300">{selectedModule.quiz.question}</p>
                  
                  <div className="space-y-2">
                    {selectedModule.quiz.options.map((opt, i) => (
                      <label 
                        key={i} 
                        className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          selectedAnswer === i 
                            ? 'bg-blue-600/10 border-blue-500 text-white' 
                            : 'bg-gray-900 border-gray-850 text-gray-400 hover:text-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="quiz-option"
                          checked={selectedAnswer === i}
                          onChange={() => {
                            setSelectedAnswer(i);
                            setQuizResult(null);
                          }}
                          className="text-blue-500 focus:ring-0 focus:ring-offset-0"
                        />
                        <span className="text-sm font-medium">{opt}</span>
                      </label>
                    ))}
                  </div>

                  <button
                    type="submit"
                    disabled={selectedAnswer === null}
                    className="py-2.5 px-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-bold rounded-xl shadow-lg transition-colors text-sm"
                  >
                    Submit Answer
                  </button>
                </form>

                {quizResult && (
                  <div className={`p-4 rounded-xl text-sm border font-medium ${
                    quizResult.success 
                      ? 'bg-green-950/40 border-green-900 text-green-300' 
                      : 'bg-red-950/40 border-red-900 text-red-300'
                  }`}>
                    {quizResult.success ? '✅' : '❌'} {quizResult.message}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[350px] text-gray-500 text-center">
              <BookOpen className="w-12 h-12 text-gray-750 mb-3" />
              <h3 className="font-bold text-lg text-gray-400">Select a Curriculum Module</h3>
              <p className="text-sm text-gray-600 mt-1">Select a module from the left list to begin studying lessons and taking knowledge checks.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Learning;
