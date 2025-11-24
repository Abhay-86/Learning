"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import axiosInstance from "@/utils/axiosInstance";

export default function BulkUploadPage() {
    const { user, isAdmin } = useAuth();

    const [companyFile, setCompanyFile] = useState<File | null>(null);
    const [hrFile, setHRFile] = useState<File | null>(null);
    const [companyUploading, setCompanyUploading] = useState(false);
    const [hrUploading, setHRUploading] = useState(false);
    const [companyResult, setCompanyResult] = useState<any>(null);
    const [hrResult, setHRResult] = useState<any>(null);

    if (!user) {
        return <div className="p-8">Loading...</div>;
    }

    if (!isAdmin()) {
        return (
            <div className="p-8">
                <Alert variant="destructive">
                    <AlertDescription>
                        ⛔ Admin access required. This page is only accessible to administrators.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const handleCompanyUpload = async () => {
        if (!companyFile) return;

        setCompanyUploading(true);
        setCompanyResult(null);

        try {
            const formData = new FormData();
            formData.append('file', companyFile);

            const response = await axiosInstance.post('referly/bulk-upload/companies/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setCompanyResult(response.data);
        } catch (error: any) {
            setCompanyResult({
                success: false,
                error: error.response?.data?.error || 'Upload failed'
            });
        } finally {
            setCompanyUploading(false);
        }
    };

    const handleHRUpload = async () => {
        if (!hrFile) return;

        setHRUploading(true);
        setHRResult(null);

        try {
            const formData = new FormData();
            formData.append('file', hrFile);

            const response = await axiosInstance.post('referly/bulk-upload/hr-contacts/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setHRResult(response.data);
        } catch (error: any) {
            setHRResult({
                success: false,
                error: error.response?.data?.error || 'Upload failed'
            });
        } finally {
            setHRUploading(false);
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Bulk Data Upload</h1>
                <p className="text-muted-foreground mt-2">
                    Upload Excel files to bulk import companies and HR contacts
                </p>
            </div>

            {/* Company Upload Section */}
            <Card>
                <CardHeader>
                    <CardTitle>📊 Upload Companies</CardTitle>
                    <CardDescription>
                        Upload an Excel file (.xlsx, .xls) with company data
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground mb-2">
                            <strong>Required columns:</strong> company_name, domain<br />
                            <strong>Optional columns:</strong> company_id, industry, location, company_size, employee_count_range, linkedin_url
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <input
                            type="file"
                            id="company-file-input"
                            accept=".xlsx,.xls"
                            onChange={(e) => setCompanyFile(e.target.files?.[0] || null)}
                            className="hidden"
                        />
                        <Button
                            variant="outline"
                            onClick={() => document.getElementById('company-file-input')?.click()}
                            className="flex-1"
                        >
                            📁 {companyFile ? companyFile.name : 'Choose Excel File'}
                        </Button>
                        <Button
                            onClick={handleCompanyUpload}
                            disabled={!companyFile || companyUploading}
                        >
                            {companyUploading ? 'Uploading...' : 'Upload Companies'}
                        </Button>
                    </div>

                    {companyResult && (
                        <Alert variant={companyResult.success ? "default" : "destructive"}>
                            <AlertDescription>
                                {companyResult.success ? (
                                    <div>
                                        <p className="font-semibold">✅ {companyResult.message}</p>
                                        <p className="text-sm mt-2">
                                            Total rows: {companyResult.total_rows} |
                                            Created: {companyResult.created} |
                                            Errors: {companyResult.errors}
                                        </p>
                                        {companyResult.error_details && companyResult.error_details.length > 0 && (
                                            <details className="mt-2">
                                                <summary className="cursor-pointer text-sm font-medium">
                                                    Show errors ({companyResult.error_details.length})
                                                </summary>
                                                <ul className="mt-2 text-xs space-y-1 list-disc list-inside">
                                                    {companyResult.error_details.map((error: string, i: number) => (
                                                        <li key={i}>{error}</li>
                                                    ))}
                                                </ul>
                                            </details>
                                        )}
                                    </div>
                                ) : (
                                    <p>❌ {companyResult.error}</p>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* HR Contact Upload Section */}
            <Card>
                <CardHeader>
                    <CardTitle>👥 Upload HR Contacts</CardTitle>
                    <CardDescription>
                        Upload an Excel file (.xlsx, .xls) with HR contact data
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground mb-2">
                            <strong>Required columns:</strong> company_name (or company_id), first_name, last_name, email<br />
                            <strong>Optional columns:</strong> phone, linkedin_url
                        </p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                            ⚠️ Note: All HR contacts will be created with email_verified=False and linkedin_verified=False
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <input
                            type="file"
                            id="hr-file-input"
                            accept=".xlsx,.xls"
                            onChange={(e) => setHRFile(e.target.files?.[0] || null)}
                            className="hidden"
                        />
                        <Button
                            variant="outline"
                            onClick={() => document.getElementById('hr-file-input')?.click()}
                            className="flex-1"
                        >
                            📁 {hrFile ? hrFile.name : 'Choose Excel File'}
                        </Button>
                        <Button
                            onClick={handleHRUpload}
                            disabled={!hrFile || hrUploading}
                        >
                            {hrUploading ? 'Uploading...' : 'Upload HR Contacts'}
                        </Button>
                    </div>

                    {hrResult && (
                        <Alert variant={hrResult.success ? "default" : "destructive"}>
                            <AlertDescription>
                                {hrResult.success ? (
                                    <div>
                                        <p className="font-semibold">✅ {hrResult.message}</p>
                                        <p className="text-sm mt-2">
                                            Total rows: {hrResult.total_rows} |
                                            Created: {hrResult.created} |
                                            Errors: {hrResult.errors}
                                        </p>
                                        {hrResult.error_details && hrResult.error_details.length > 0 && (
                                            <details className="mt-2">
                                                <summary className="cursor-pointer text-sm font-medium">
                                                    Show errors ({hrResult.error_details.length})
                                                </summary>
                                                <ul className="mt-2 text-xs space-y-1 list-disc list-inside">
                                                    {hrResult.error_details.map((error: string, i: number) => (
                                                        <li key={i}>{error}</li>
                                                    ))}
                                                </ul>
                                            </details>
                                        )}
                                    </div>
                                ) : (
                                    <p>❌ {hrResult.error}</p>
                                )}
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* Info Section */}
            <Card>
                <CardHeader>
                    <CardTitle>📝 Excel Format Examples</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div>
                        <h4 className="font-semibold mb-2">Company Excel Format:</h4>
                        <div className="bg-muted p-2 rounded text-xs overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-1">company_name</th>
                                        <th className="text-left p-1">domain</th>
                                        <th className="text-left p-1">industry</th>
                                        <th className="text-left p-1">location</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="p-1">Google</td>
                                        <td className="p-1">google.com</td>
                                        <td className="p-1">Technology</td>
                                        <td className="p-1">Mountain View, CA</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2">HR Contact Excel Format:</h4>
                        <div className="bg-muted p-2 rounded text-xs overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-1">company_name</th>
                                        <th className="text-left p-1">first_name</th>
                                        <th className="text-left p-1">last_name</th>
                                        <th className="text-left p-1">email</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="p-1">Google</td>
                                        <td className="p-1">John</td>
                                        <td className="p-1">Doe</td>
                                        <td className="p-1">john.doe@google.com</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}