"use client";

import { useState, useEffect, useCallback } from 'react';

export function useModalState<T>() {
    const [isOpen, setIsOpen] = useState(false);
    const [modalData, setModalData] = useState<T | null>(null);

    const openModal = useCallback((data: T) => {
        setModalData(data);
        setIsOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
    }, []);

    useEffect(() => {
        if (!isOpen) {
            const timer = setTimeout(() => {
                setModalData(null);
            }, 500); // Animation duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    return {
        isOpen,
        modalData,
        openModal,
        closeModal,
    };
} 