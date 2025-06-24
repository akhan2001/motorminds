"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AddEmployeeForm({ shopId, onAdded }: { shopId: string; onAdded?: () => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const handleAdd = async () => {
    if (!name) return;
    setLoading(true);
    const { error } = await supabase.from("shop_staff").insert({ shop_id: shopId, staff_name: name, role });
    setLoading(false);
    if (!error) {
      setName("");
      setRole("");
      onAdded?.();
    } else {
      alert(error.message);
    }
  };
  return (
    <div className="space-y-2 border border-[#222] bg-[#131313] p-4 rounded-lg">
      <h3 className="text-lg font-semibold text-white">Add Employee</h3>
      <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} className="bg-black text-white" />
      <Input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} className="bg-black text-white" />
      <Button disabled={loading} onClick={handleAdd} className="bg-red-600 hover:bg-red-700 text-white w-full">
        {loading ? "Adding..." : "Add"}
      </Button>
    </div>
  );
} 