"use client";

import { useState } from "react";
import { LayoutTemplate, Search, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TemplatesPageProps {
    shopId: string;
}

export default function TemplatesPage({ shopId }: TemplatesPageProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");

    // Placeholder template data - will be replaced with real data later
    const placeholderTemplates = [
        {
            id: 1,
            name: "Oil Change Service",
            category: "Maintenance",
            description: "Standard oil change and fluid check service contract",
            color: "bg-blue-500"
        },
        {
            id: 2,
            name: "Brake Inspection",
            category: "Diagnostic",
            description: "Comprehensive brake system inspection and assessment",
            color: "bg-yellow-500"
        },
        {
            id: 3,
            name: "Engine Repair",
            category: "Repair",
            description: "General engine repair and maintenance contract",
            color: "bg-red-500"
        },
        {
            id: 4,
            name: "Extended Warranty",
            category: "Warranty",
            description: "Extended warranty service agreement template",
            color: "bg-green-500"
        }
    ];

    const categories = ["all", "Maintenance", "Repair", "Diagnostic", "Warranty", "Custom"];

    const filteredTemplates = placeholderTemplates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            template.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Contract Templates</h2>
                    <p className="text-gray-400">
                        Choose from pre-built contract templates to get started quickly
                    </p>
                </div>
                <Button 
                    disabled 
                    className="bg-gray-600 text-gray-300 cursor-not-allowed"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template (Coming Soon)
                </Button>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-[#1A1A1A] border-[#333333] text-white placeholder-gray-400"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[180px] bg-[#1A1A1A] border-[#333333] text-white">
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1A1A1A] border-[#333333] text-white">
                            {categories.map(category => (
                                <SelectItem key={category} value={category} className="hover:bg-[#333333]">
                                    {category === "all" ? "All Categories" : category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Templates Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredTemplates.map((template) => (
                    <Card key={template.id} className="bg-[#1A1A1A] border-[#333333] hover:border-[#444444] transition-all duration-200">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className={`w-10 h-10 rounded-lg ${template.color} flex items-center justify-center mb-3`}>
                                    <LayoutTemplate className="h-5 w-5 text-white" />
                                </div>
                                <Badge variant="outline" className="text-xs border-[#444444] text-gray-300">
                                    {template.category}
                                </Badge>
                            </div>
                            <CardTitle className="text-lg font-semibold text-white">
                                {template.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                                {template.description}
                            </p>
                            <div className="flex justify-end">
                                <Button 
                                    size="sm"
                                    disabled
                                    className="text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Use Template
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Empty State */}
            {filteredTemplates.length === 0 && (
                <div className="text-center py-20">
                    <LayoutTemplate className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No templates found</h3>
                    <p className="text-gray-400 mb-6">
                        {searchQuery || selectedCategory !== "all" 
                            ? "Try adjusting your search or filter criteria" 
                            : "Template system is coming soon"}
                    </p>
                    {(searchQuery || selectedCategory !== "all") && (
                        <Button 
                            variant="outline" 
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedCategory("all");
                            }}
                            className="border-[#444444] hover:bg-[#333333]"
                        >
                            Clear Filters
                        </Button>
                    )}
                </div>
            )}

            {/* Coming Soon Notice */}
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-lg py-6 text-center">
                <div className="flex items-center justify-center mb-4">
                    <div className="bg-blue-600/20 p-3 rounded-full">
                        <LayoutTemplate className="h-8 w-8 text-blue-400" />
                    </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Templates Coming Soon</h3>
                <p className="text-gray-400 max-w-2xl mx-auto">
                    We're working on a comprehensive template system that will include professional contract templates 
                    for oil changes, brake services, diagnostics, warranty work, and more. These templates will help you 
                    create contracts faster and ensure consistency across all your services.
                </p>
            </div>
        </div>
    );
} 