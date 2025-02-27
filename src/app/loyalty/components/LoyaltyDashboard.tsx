"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { sql } from '@vercel/postgres';
import { createServerClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export default function LoyaltyDashboard() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const supabase = await createClient();
      const { data, error } = await supabase.from('users').select('*');
      if (error) {
        console.error('Error fetching users:', error.message);
      } else {
        setUsers(data || []);
      }
    };
    fetchUsers();
  }, []);

  const adjustPoints = async (userId: number, points: number) => {
    const supabase = await createClient();
    const { error } = await supabase
      .from('users')
      .update({ points: sql`points + ${points}` })
      .eq('id', userId);

    if (error) {
      console.error('Error adjusting points:', error.message);
    } else {
      // Refresh user data
      const { data } = await supabase.from('users').select('*');
      setUsers(data || []);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Loyalty Dashboard</h1>
      <table className="min-w-full bg-white">
        <thead>
          <tr>
            <th className="py-2">Email</th>
            <th className="py-2">Points</th>
            <th className="py-2">Redeemed Points</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="text-center">
              <td className="py-2">{user.email}</td>
              <td className="py-2">{user.points}</td>
              <td className="py-2">{user.redeemed_points}</td>
              <td className="py-2">
                <button
                  className="bg-green-500 text-white px-2 py-1 rounded mr-2"
                  onClick={() => adjustPoints(user.id, 10)}
                >
                  Add 10 Points
                </button>
                <button
                  className="bg-red-500 text-white px-2 py-1 rounded"
                  onClick={() => adjustPoints(user.id, -10)}
                >
                  Remove 10 Points
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
