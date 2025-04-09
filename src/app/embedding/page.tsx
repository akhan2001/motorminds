'use client';

import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function EmbeddingPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [recordCount, setRecordCount] = useState(0);
    
    // Function to fetch and display records
    async function generateEmbeddings() {
        setIsLoading(true);
        setStatus('Fetching records...');
        
        try {
            const { data, error } = await supabase
                .from('toyota-table')
                .select('id, content, make, model, year')
                .limit(1);
            
            if (error) {
                console.error('Supabase error:', error);
                setStatus('Error fetching data: ' + error.message);
                return;
            }

            setRecordCount(data.length);
            setStatus(`Found ${data.length} Toyota records from 2013`);
            
            // Log each record with detailed information
            for (const record of data) {
                if (typeof record.content === 'object' && record.content !== null) {
                    // console.log(record.year, record.make, record.model);
                    const sectionKeys = Object.keys(record.content);

                    const firstSection = sectionKeys[0];
                    console.log("Section: ", firstSection);

                    if (firstSection === 'text') {
                        console.log(record.content.text);
                    } else{
                        // Access the text property within that section
                        if (record.content[firstSection] && record.content[firstSection].text) {
                            console.log(record.content[firstSection].text);
                        } else {
                            // Check if the section has sub-sections
                            const subSectionKeys = Object.keys(record.content[firstSection]);
                            if (subSectionKeys.length > 0) {
                                for (const subSection of subSectionKeys) {
                                    console.log("Subsection: ", subSection);
                                    console.log("-" +record.content[firstSection][subSection].text);
                                }
                            }
                        }
                    }
                }
                console.log('----------------------------------');
            }
            
            // Return the data for further use if needed
            return data;
        } catch (error) {
            console.error('Error processing records:', error);
            setStatus('Error: ' + (error instanceof Error ? error.message : String(error)));
        } finally {
            setIsLoading(false);
        }
    }

    // Handler for the button click
    const handleClick = async () => {
        try {
            await generateEmbeddings();
        } catch (error) {
            console.error('Error in handler:', error);
            setStatus('Failed to process records');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-5">
            <h1 className="text-2xl font-bold mb-6">Toyota 2013 Data Explorer</h1>
            
            <Button 
                onClick={handleClick} 
                disabled={isLoading}
                className="px-6 py-2"
            >
                {isLoading ? 'Processing...' : 'View Toyota 2013 Records'}
            </Button>
            
            {status && (
                <div className={`mt-6 p-4 rounded-md ${status.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {status}
                </div>
            )}
        </div>
    );
}

