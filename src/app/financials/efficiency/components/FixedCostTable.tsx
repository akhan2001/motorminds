import React, { useState } from 'react';

// ... existing code ...

const FixedCostTable: React.FC<FixedCostTableProps> = ({ fixedCosts, onCostDeleted }) => {
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const handleDelete = async (costId: string) => {
        if (!confirm('Are you sure you want to delete this fixed cost? This action cannot be undone.')) {
            return;
        }

        setDeletingId(costId);
        setDeleteError(null);

        try {
            const response = await fetch('/api/financials/efficiency', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: costId }),
            });

            if (!response.ok) {
                // Now we can safely parse the JSON body for an error message
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete cost.');
            }
            
            // Re-fetch or filter out locally
            onCostDeleted(costId);

        } catch (err: any) {
            console.error(err);
            setDeleteError(err.message);
        } finally {
            setDeletingId(null);
        }
    };

    const formatCurrency = (value: number) => {
        // ... existing code ...
    };

    // ... existing code ...
};

export default FixedCostTable;