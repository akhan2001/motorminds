'use client';

import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function EmbeddingPage() {
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        try {
            setIsLoading(true);
            setStatus('Processing...');
            
            // Call the API endpoint
            const response = await fetch('/api/embeddings', {
                method: 'POST',
            });
            
            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('API result:', result);
            
            setStatus(`Completed: ${result.message || 'Success'}`);
        } catch (error) {
            // Safe error logging
            console.error('Error calling API:', 
                error instanceof Error ? error.message : 'Unknown error');
            
            setStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <Button 
                onClick={handleClick} 
                disabled={isLoading}
            >
                {isLoading ? 'Processing...' : 'Generate Embeddings'}
            </Button>
            {status && (
                <p className={`mt-4 p-2 ${status.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
                    {status}
                </p>
            )}
        </div>
    );
}

// Import the function directly for client-side usage
async function generateEmbeddings() {
    try {
        const response = await fetch('/api/embeddings', {
            method: 'POST',
        });
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    } catch (err) {
        console.error('Fetch error:', err);
        throw err;
    }
}
