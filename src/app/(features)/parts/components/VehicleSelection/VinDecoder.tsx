'use client'

import React from 'react'

interface VinDecoderProps {
    vinInput: string
    setVinInput: (value: string) => void
    vinDecoding: boolean
    vinDecodeError: string | null
    setVinDecodeError: (error: string | null) => void
    vinDecodeSuccess: string | null
    showVinInput: boolean
    setShowVinInput: (show: boolean) => void
    onVinDecode: () => void
}

export const VinDecoder: React.FC<VinDecoderProps> = ({
    vinInput,
    setVinInput,
    vinDecoding,
    vinDecodeError,
    setVinDecodeError,
    vinDecodeSuccess,
    showVinInput,
    setShowVinInput,
    onVinDecode
}) => {
    const handleVinInputChange = (value: string) => {
        setVinInput(value.toUpperCase())
        setVinDecodeError(null)
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onVinDecode()
        }
    }

    return (
        <div className="bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#b22222]">
                    Quick Start with VIN
                </h2>
                <button
                    onClick={() => setShowVinInput(!showVinInput)}
                    className="px-3 py-1 bg-[#b22222] hover:bg-[#a01e1e] text-white text-sm rounded transition-colors"
                >
                    {showVinInput ? 'Hide VIN' : 'Use VIN'}
                </button>
            </div>
            
            <p className="text-[#979797] text-sm mb-4">
                Have your vehicle's VIN? We can automatically fill in your vehicle details.
            </p>

            {showVinInput && (
                <div className="space-y-4">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={vinInput}
                            onChange={(e) => handleVinInputChange(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Enter VIN (17 characters)"
                            maxLength={17}
                            disabled={vinDecoding}
                            className="flex-1 px-3 py-2 bg-[#3a3a3a] border border-[#4a4a4a] rounded text-white placeholder-[#979797] focus:outline-none focus:border-[#b22222] transition-colors disabled:opacity-50"
                        />
                        <button
                            onClick={onVinDecode}
                            disabled={vinDecoding || !vinInput.trim()}
                            className="px-4 py-2 bg-[#b22222] hover:bg-[#a01e1e] disabled:bg-[#666] disabled:cursor-not-allowed text-white rounded transition-colors"
                        >
                            {vinDecoding ? 'Decoding...' : 'Decode VIN'}
                        </button>
                    </div>

                    {vinDecodeError && (
                        <div className="p-3 bg-red-900/20 border border-red-700 rounded text-red-300 text-sm">
                            {vinDecodeError}
                        </div>
                    )}

                    {vinDecodeSuccess && (
                        <div className="p-3 bg-green-900/20 border border-green-700 rounded text-green-300 text-sm">
                            {vinDecodeSuccess}
                        </div>
                    )}

                    <div className="text-xs text-[#979797]">
                        <p>VIN should be 17 characters and contain both letters and numbers.</p>
                        <p>VIN Decoding is only available for vehicles made in the North American region. If there is no match, please manually select your vehicle.</p>
                    </div>
                </div>
            )}
        </div>
    )
}
