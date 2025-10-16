import { useState } from 'react'
import { customerMigrationService } from '../lib/customer-migration-service'
import { CSVAnalysis, MigrationPreview, ImportResult } from '../types/migrations'
import { CustomerMigrationFormData } from '../schemas/customer-migration'

export function useCustomerMigration() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [csvAnalysis, setCsvAnalysis] = useState<CSVAnalysis | null>(null)
    const [columnMappings, setColumnMappings] = useState<Record<string, string>>({})
    const [preview, setPreview] = useState<MigrationPreview | null>(null)
    const [importResult, setImportResult] = useState<ImportResult | null>(null)
    
    const [analyzing, setAnalyzing] = useState(false)
    const [previewing, setPreviewing] = useState(false)
    const [importing, setImporting] = useState(false)
    
    const [currentStep, setCurrentStep] = useState<'upload' | 'configure' | 'mapping' | 'preview' | 'complete'>('upload')

    const analyzeFile = async (file: File) => {
        setSelectedFile(file)
        setAnalyzing(true)
        
        try {
            const analysis = await customerMigrationService.analyzeCSVHeaders(file)
            setCsvAnalysis(analysis)
            
            // Initialize empty mappings (auto-apply will happen in the component)
            setColumnMappings({})
            setCurrentStep('configure')
        } catch (error) {
            console.error('Error analyzing file:', error)
            throw error
        } finally {
            setAnalyzing(false)
        }
    }

    const updateMapping = (stagingField: string, csvColumn: string) => {
        setColumnMappings(prev => ({
            ...prev,
            [stagingField]: csvColumn
        }))
    }

    const generatePreview = async (formData: CustomerMigrationFormData) => {
        if (!selectedFile) {
            throw new Error('No file selected')
        }

        // Validate mappings
        const validation = customerMigrationService.validateMappings(columnMappings)
        if (!validation.valid) {
            throw new Error(validation.errors.join(', '))
        }

        setPreviewing(true)
        try {
            const previewData = await customerMigrationService.generatePreview(
                selectedFile,
                columnMappings,
                formData
            )
            setPreview(previewData)
            setCurrentStep('preview')
        } catch (error) {
            console.error('Error generating preview:', error)
            throw error
        } finally {
            setPreviewing(false)
        }
    }

    const approveImport = async (formData: CustomerMigrationFormData) => {
        if (!selectedFile) {
            throw new Error('No file selected')
        }

        setImporting(true)
        try {
            const result = await customerMigrationService.importToStaging(
                selectedFile,
                columnMappings,
                formData
            )
            setImportResult(result)
            setCurrentStep('complete')
            return result
        } catch (error) {
            console.error('Error importing:', error)
            throw error
        } finally {
            setImporting(false)
        }
    }

    const reset = () => {
        setSelectedFile(null)
        setCsvAnalysis(null)
        setColumnMappings({})
        setPreview(null)
        setImportResult(null)
        setCurrentStep('upload')
    }

    return {
        // State
        selectedFile,
        csvAnalysis,
        columnMappings,
        preview,
        importResult,
        currentStep,
        
        // Loading states
        analyzing,
        previewing,
        importing,
        
        // Actions
        analyzeFile,
        updateMapping,
        generatePreview,
        approveImport,
        reset,
        setCurrentStep
    }
}
