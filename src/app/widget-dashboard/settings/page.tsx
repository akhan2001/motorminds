"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function WidgetSettingsPage() {
    const { register, handleSubmit, control, reset, formState: { isSubmitting } } = useForm({
        defaultValues: {
            widget_config: {
                primaryColor: "#3b82f6",
                logoUrl: "",
                headerText: "",
                welcomeMessage: ""
            },
            authorized_domains: ""
        }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dashboard/widget/settings')
            .then(res => res.json())
            .then(data => {
                if (data) {
                    const preparedData = {
                        widget_config: {
                            primaryColor: data.widget_config?.primaryColor || "#3b82f6",
                            logoUrl: data.widget_config?.logoUrl || "",
                            headerText: data.widget_config?.headerText || "",
                            welcomeMessage: data.widget_config?.welcomeMessage || "",
                        },
                        authorized_domains: (data.authorized_domains || []).join(", ")
                    };
                    reset(preparedData);
                }
                setLoading(false);
            });
    }, [reset]);
    
    const onSubmit = (data: any) => {
        const payload = {
            ...data,
            authorized_domains: data.authorized_domains.split(',').map((d:string) => d.trim()).filter(Boolean)
        };
        
        toast.promise(
            fetch('/api/dashboard/widget/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }),
            {
                loading: 'Saving settings...',
                success: 'Settings saved successfully!',
                error: 'Failed to save settings.',
            }
        );
    };

    if (loading) return <div className="text-white">Loading settings...</div>

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <Card className="bg-[#131313] border-gray-800 text-white">
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription className="text-gray-400">Customize the look and feel of your chat widget.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <Controller
                            name="widget_config.primaryColor"
                            control={control}
                            render={({ field }) => <Input {...field} type="color" className="w-24 p-1"/>}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="logoUrl">Logo URL</Label>
                        <Input id="logoUrl" {...register("widget_config.logoUrl")} placeholder="https://example.com/logo.png" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="headerText">Header Text</Label>
                        <Input id="headerText" {...register("widget_config.headerText")} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="welcomeMessage">Welcome Message</Label>
                        <Textarea id="welcomeMessage" {...register("widget_config.welcomeMessage")} />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-[#131313] border-gray-800 text-white">
                <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription className="text-gray-400">Control where your widget can be embedded.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="authorized_domains">Authorized Domains</Label>
                        <Textarea 
                            id="authorized_domains" 
                            {...register("authorized_domains")} 
                            placeholder="example.com, my-other-site.com" 
                        />
                        <p className="text-sm text-muted-foreground">
                            A comma-separated list of domains where you want to allow your widget to be embedded.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {isSubmitting ? "Saving..." : "Save Settings"}
                </Button>
            </div>
        </form>
    );
}
