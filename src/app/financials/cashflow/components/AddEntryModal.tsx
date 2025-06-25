"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface AddEntryModalProps {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
}

export default function AddEntryModal({ open, onClose, onAdded }: AddEntryModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "revenue" as "revenue" | "cost",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    description: "",
    costType: "other" as "inventory" | "fixed" | "other"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.date) return;

    setIsSubmitting(true);
    try {
      const amount = parseFloat(formData.amount);
      
      if (formData.type === "revenue") {
        const { error } = await supabase
          .from("revenue")
          .insert({
            date: formData.date,
            amount: amount,
            description: formData.description || null
          });
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cost")
          .insert({
            date: formData.date,
            amount: amount,
            type: formData.costType,
            description: formData.description || null
          });
        
        if (error) throw error;
      }

      // Reset form
      setFormData({
        type: "revenue",
        amount: "",
        date: new Date().toISOString().slice(0, 10),
        description: "",
        costType: "other"
      });

      onAdded();
      onClose();
    } catch (error) {
      console.error("Error adding entry:", error);
      alert("Failed to add entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#131313] border-[#222] text-white">
        <DialogHeader>
          <DialogTitle>Add New Entry</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "revenue" | "cost") => 
                  setFormData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="bg-[#131313] border-[#222]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#131313] border-[#222]">
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="cost">Cost</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                className="bg-[#131313] border-[#222]"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="bg-[#131313] border-[#222]"
              required
            />
          </div>

          {formData.type === "cost" && (
            <div>
              <Label htmlFor="costType">Cost Type</Label>
              <Select
                value={formData.costType}
                onValueChange={(value: "inventory" | "fixed" | "other") => 
                  setFormData(prev => ({ ...prev, costType: value }))
                }
              >
                <SelectTrigger className="bg-[#131313] border-[#222]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#131313] border-[#222]">
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="fixed">Fixed Costs</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-[#131313] border-[#222]"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 flex-1"
            >
              {isSubmitting ? "Adding..." : "Add Entry"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-[#222] hover:bg-[#222]"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 