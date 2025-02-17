"use client";
import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function Forms() {

    const supabase = createClientComponentClient();
    
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

                const embedding = result.embedding;
                const token = result.tokens;

                console.log("This is the token", token);

                const {error} = await supabase.from("documents").insert({
                    content, embedding, token,
                });

                if (error) {
                    toastError("Error inserting dataset" + error);
                } else {
                    toastError("Dataset inserted successfully");
                    inputRef.current.value = "";
                }
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
                        <AiOutlineLoading3Quarters size={12} />
                        <span>Submitting...</span>
                    </>
                )}
                {!loading && (
                    <>Submit</>
                )}
            </Button>
        </>
    )
}
