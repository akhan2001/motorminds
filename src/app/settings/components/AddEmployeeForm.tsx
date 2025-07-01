"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function AddEmployeeForm({ shopId, onAdded }: { shopId: string; onAdded?: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState("");
  const [salary, setSalary] = useState("");
  const [frequency, setFrequency] = useState("hourly");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!firstName || !lastName || !role || !salary || !frequency) {
        alert("Please fill out all fields.");
        return;
    }
    setLoading(true);
    const { error } = await supabase.from("employees").insert({
      shop_id: shopId,
      first_name: firstName,
      last_name: lastName,
      role,
      salary_or_wage: parseFloat(salary),
      pay_frequency: frequency,
    });
    setLoading(false);
    if (!error) {
      setFirstName("");
      setLastName("");
      setRole("");
      setSalary("");
      setFrequency("hourly");
      onAdded?.();
    } else {
      alert(error.message);
    }
  };

  return (
    <div className="space-y-4 border border-[#222] bg-[#131313] p-6 rounded-lg max-w-2xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <Label htmlFor="firstName" className="text-gray-400">First Name</Label>
            <Input id="firstName" placeholder="John" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="bg-black text-white" />
        </div>
        <div>
            <Label htmlFor="lastName" className="text-gray-400">Last Name</Label>
            <Input id="lastName" placeholder="Doe" value={lastName} onChange={(e) => setLastName(e.target.value)} className="bg-black text-white" />
        </div>
      </div>
      <div>
        <Label htmlFor="role" className="text-gray-400">Role</Label>
        <Input id="role" placeholder="Lead Technician" value={role} onChange={(e) => setRole(e.target.value)} className="bg-black text-white" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <Label htmlFor="salary" className="text-gray-400">Salary / Wage</Label>
            <Input id="salary" type="number" placeholder="50000" value={salary} onChange={(e) => setSalary(e.target.value)} className="bg-black text-white" />
        </div>
        <div>
            <Label htmlFor="frequency" className="text-gray-400">Pay Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="bg-black text-white">
                    <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent className="bg-[#131313] border-[#222] text-white">
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>
      <Button disabled={loading} onClick={handleAdd} className="bg-red-600 hover:bg-red-700 text-white w-full">
        {loading ? "Adding Employee..." : "Add Employee"}
      </Button>
    </div>
  );
} 