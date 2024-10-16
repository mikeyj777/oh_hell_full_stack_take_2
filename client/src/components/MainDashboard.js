import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from '../utils/config';

const MainDashboard = () => {
  const [dailyLogs, setDailyLogs] = useState([]);
  const [runningAverage, setRunningAverage] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const userId = localStorage.getItem('userId');
      try {
        const response = await fetch(`${API_BASE_URL}/api/daily-logs/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setDailyLogs(data);
          calculateAverages(data);
        } else {
          console.error('Failed to fetch daily logs');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchData();
  }, []);

  const calculateAverages = (logs) => {
    let cumulativeScore = 0;
    let cumulativeHands = 0;
    const runningAvg = logs.map((log) => {
      const dailyAverage = log.points / log.hands_played;
      cumulativeScore += log.points;
      cumulativeHands += log.hands_played;
      const overallAverage = cumulativeScore / cumulativeHands;
      return {
        date: log.date,
        dailyAverage,
        overallAverage
      };
    });
    setRunningAverage(runningAvg);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-purple-600">Oh Hell Dashboard</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Daily Averages</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border-b">Date</th>
                <th className="py-2 px-4 border-b">Points</th>
                <th className="py-2 px-4 border-b">Hands Played</th>
                <th className="py-2 px-4 border-b">Daily Average</th>
              </tr>
            </thead>
            <tbody>
              {dailyLogs.map((log) => (
                <tr key={log.id}>
                  <td className="py-2 px-4 border-b">{log.date}</td>
                  <td className="py-2 px-4 border-b">{log.points}</td>
                  <td className="py-2 px-4 border-b">{log.hands_played}</td>
                  <td className="py-2 px-4 border-b">{(log.points / log.hands_played).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Performance Over Time</h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={runningAverage}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="dailyAverage" 
              stroke="#3b82f6" 
              name="Daily Average" 
              dot={{ r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="overallAverage" 
              stroke="#ef4444" 
              name="Running Average" 
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MainDashboard;