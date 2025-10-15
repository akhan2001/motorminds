'use client'

import { useState, useEffect } from 'react'
import { Nav } from '@/app/components/nav'
import Link from 'next/link'
import { Users } from 'lucide-react'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb'
import AdminNav from '../../../components/AdminNav'
import MigrationsNav from '../../../components/migrations/MigrationsNav'
import { AdminService } from '../../../lib/admin-service'
import { useCustomerMigration } from '../../../hooks/use-customer-migration'
import { CustomerMigrationFormData } from '../../../schemas/customer-migration'

// Import all the existing components
import FileUploadComponent from '../../../components/file-upload'
import CustomerConfigurationFormComponent from '../../../components/customer-configuration-form'
import ColumnMappingComponent from '../../../components/column-mapping'
import ImportPreviewComponent from '../../../components/import-preview'
import ImportCompleteComponent from '../../../components/import-complete'
import ProgressSteps from '../../../components/progress-steps'

export default function CustomerMigrationPage() {
    const [shops, setShops] = useState<any[]>([])
    const [loadingShops, setLoadingShops] = useState(true)
    const [formData, setFormData] = useState<CustomerMigrationFormData | null>(null)
    
    const {
        selectedFile,
        csvAnalysis,
        columnMappings,
        preview,
        importResult,
        currentStep,
        analyzing,
        previewing,
        importing,
        analyzeFile,
        updateMapping,
        generatePreview,
        approveImport,
        reset,
        setCurrentStep
    } = useCustomerMigration()

    // Fetch shops
    useEffect(() => {
        const fetchShops = async () => {
            try {
                const adminService = new AdminService()
                const shopsData = await adminService.getAllShops()
                setShops(shopsData)
            } catch (error) {
                console.error('Error fetching shops:', error)
            } finally {
                setLoadingShops(false)
            }
        }
        fetchShops()
    }, [])

    const handleFileSelect = async (file: File) => {
        try {
            await analyzeFile(file)
        } catch (error) {
            console.error('Error analyzing file:', error)
            alert('Failed to analyze CSV file. Please check the file format.')
        }
    }

    const handleConfigureSubmit = (data: CustomerMigrationFormData) => {
        setFormData(data)
        setCurrentStep('mapping')
    }

    const handleMappingComplete = async () => {
        if (!formData) {
            alert('Configuration data is missing')
            return
        }
        
        try {
            await generatePreview(formData)
        } catch (error: any) {
            alert(error.message || 'Failed to generate preview')
        }
    }

    const handleApprove = async () => {
        if (!formData) {
            alert('Configuration data is missing')
            return
        }
        
        try {
            await approveImport(formData)
        } catch (error) {
            alert('Failed to import customers')
        }
    }

    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 max-w-7xl mx-auto w-full">
                        {/* Breadcrumb */}
                        <Breadcrumb className="mb-4">
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/admin" className="text-gray-400 hover:text-white">
                                            Admin
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <Users className="text-gray-600" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link href="/admin/migrations" className="text-gray-400 hover:text-white">
                                            Migrations
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator>
                                    <Users className="text-gray-600" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    <BreadcrumbPage className="text-white">Customer Migration</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        {/* Admin Navigation */}
                        <AdminNav />

                        {/* Header */}
                        <div className="mb-6">
                            <h1 className="text-3xl font-bold text-white mb-2">
                                Customer Data Migration
                            </h1>
                            <p className="text-gray-400">
                                Import customer data from CSV files with AI-powered column mapping and data concatenation
                            </p>
                        </div>

                        {/* Migrations Navigation */}
                        <MigrationsNav />

                        {/* Progress Steps */}
                        <ProgressSteps currentStep={currentStep} />

                        {/* Step Components */}
                        {currentStep === 'upload' && (
                            <FileUploadComponent
                                selectedFile={selectedFile}
                                analyzing={analyzing}
                                onFileSelect={handleFileSelect}
                            />
                        )}

                        {currentStep === 'configure' && csvAnalysis && (
                            <CustomerConfigurationFormComponent
                                csvAnalysis={csvAnalysis}
                                shops={shops}
                                loadingShops={loadingShops}
                                onSubmit={handleConfigureSubmit}
                                onBack={() => setCurrentStep('upload')}
                            />
                        )}

                        {currentStep === 'mapping' && csvAnalysis && (
                            <ColumnMappingComponent
                                csvAnalysis={csvAnalysis}
                                columnMappings={columnMappings}
                                updateMapping={updateMapping}
                                onBack={() => setCurrentStep('configure')}
                                onNext={handleMappingComplete}
                                previewing={previewing}
                            />
                        )}

                        {currentStep === 'preview' && preview && (
                            <ImportPreviewComponent
                                preview={preview}
                                importing={importing}
                                onBack={() => setCurrentStep('mapping')}
                                onApprove={handleApprove}
                                onCancel={reset}
                            />
                        )}

                        {currentStep === 'complete' && importResult && (
                            <ImportCompleteComponent
                                importResult={importResult}
                                onReset={reset}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}