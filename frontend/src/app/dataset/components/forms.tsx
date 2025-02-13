"use client";
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiOutlineLoading3Quarters } from "react-icons/ai";

export default function Forms() {
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const [loading, setLoading] = useState(false);

    const toastError = (message: string) => {
        alert(message);
    };

    const handleSubmit = async () => {
        setLoading(true);
        if (!inputRef.current) return;
        
        const content = inputRef.current.value;

        if (content && content.trim()) {
            const res = await fetch(location.origin + "/embedding", {
                method: "POST",
                body: JSON.stringify({ text: content.replace(/\n/g, " ") }),
            });

            if (res.status !== 200) {
                toastError("Error embedding");
            } else {
                const result = await res.json();
                console.log(result);
                inputRef.current.value = "";
            }

        } else {
            console.log("Content is empty");
        }
        setLoading(false);
    };

    return (
        <>
            <Textarea placeholder="Enter your prompt here" className="resize-none" ref={inputRef} />
            <Button className="w-full flex gap-2" onClick={handleSubmit}>
                {loading && (
                    <>
                        <AiOutlineLoading3Quarters className="w-3 h-3 animate-spin"/>
                        <span>Submitting...</span>
                    </>
                )}
                {!loading && (
                    <>
                        Submit
                    </>
                )}
            </Button>
        </>
    )
}
