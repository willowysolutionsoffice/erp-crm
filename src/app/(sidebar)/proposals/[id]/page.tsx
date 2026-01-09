'use client';

import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, FileText, Trash2, Send, CheckCircle, XCircle } from 'lucide-react';
import { ProposalStatus, Proposal } from '@/types/proposal';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

// Mock Data for View
const MOCK_PROPOSAL: Proposal = {
    id: '1',
    proposalNo: 'PROP-2024-0001',
    clientName: 'Acme Corp',
    clientEmail: 'contact@acme.com',
    clientPhone: '123-456-7890',
    status: ProposalStatus.DRAFT,
    totalAmount: 5000,
    createdByUser: 'John Doe',
    items: [
        { id: '1', proposalId: '1', description: 'Web Development', quantity: 1, unitPrice: 3000, total: 3000 },
        { id: '2', proposalId: '1', description: 'SEO Optimization', quantity: 1, unitPrice: 2000, total: 2000 },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
};

export default function ProposalDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;

    // In a real app, fetch proposal by id. Here we just use the mock.
    const proposal = MOCK_PROPOSAL; // We'd simulate fetching here

    const getStatusColor = (status: ProposalStatus) => {
        switch (status) {
            case ProposalStatus.DRAFT:
                return 'bg-gray-100 text-gray-800';
            case ProposalStatus.SENT:
                return 'bg-blue-100 text-blue-800';
            case ProposalStatus.ACCEPTED:
                return 'bg-green-100 text-green-800';
            case ProposalStatus.REJECTED:
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleStatusChange = (newStatus: ProposalStatus) => {
        toast.success(`Status updated to ${newStatus}`);
        // Update local state if needed
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold text-gray-900">{proposal.proposalNo}</h1>
                            <Badge className={getStatusColor(proposal.status)}>{proposal.status}</Badge>
                        </div>
                        <p className="text-gray-600">Created on {new Date(proposal.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => toast.info('Generating PDF...')}>
                        <FileText className="mr-2 h-4 w-4" />
                        PDF
                    </Button>
                    {proposal.status === ProposalStatus.DRAFT && (
                        <>
                            <Button variant="outline" onClick={() => router.push(`/proposals/${id}/edit`)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                            <Button variant="default" onClick={() => handleStatusChange(ProposalStatus.SENT)}>
                                <Send className="mr-2 h-4 w-4" />
                                Send
                            </Button>
                        </>
                    )}
                    {proposal.status === ProposalStatus.SENT && (
                        <>
                            <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleStatusChange(ProposalStatus.ACCEPTED)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark Accepted
                            </Button>
                            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatusChange(ProposalStatus.REJECTED)}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Mark Rejected
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-2 space-y-6">
                    {/* Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Proposal Items</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="relative w-full overflow-auto">
                                <table className="w-full caption-bottom text-sm text-left">
                                    <thead className="[&_tr]:border-b">
                                        <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[50%]">Description</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Qty</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Unit Price</th>
                                            <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        {proposal.items.map((item) => (
                                            <tr key={item.id} className="border-b transition-colors hover:bg-muted/50">
                                                <td className="p-4 align-middle">{item.description}</td>
                                                <td className="p-4 align-middle text-right">{item.quantity}</td>
                                                <td className="p-4 align-middle text-right">{formatCurrency(item.unitPrice)}</td>
                                                <td className="p-4 align-middle text-right">{formatCurrency(item.total)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-end p-4">
                                <div className="flex gap-8 text-lg font-semibold">
                                    <span>Total</span>
                                    <span>{formatCurrency(proposal.totalAmount)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Client Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Client Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-gray-500">Name</div>
                                <div className="text-base">{proposal.clientName}</div>
                            </div>
                            {proposal.clientEmail && (
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Email</div>
                                    <div className="text-base">{proposal.clientEmail}</div>
                                </div>
                            )}
                            {proposal.clientPhone && (
                                <div>
                                    <div className="text-sm font-medium text-gray-500">Phone</div>
                                    <div className="text-base">{proposal.clientPhone}</div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Meta Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-gray-500">Proposal ID</div>
                                <div className="text-sm font-mono text-muted-foreground">{id}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Created By</div>
                                <div className="text-base">{proposal.createdByUser || 'Unknown'}</div>
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-500">Last Updated</div>
                                <div className="text-sm text-muted-foreground">{new Date(proposal.updatedAt).toLocaleDateString()}</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Button
                        variant="ghost"
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                            toast.success("Proposal deleted");
                            router.push('/proposals');
                        }}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Proposal
                    </Button>
                </div>
            </div>
        </div>
    );
}
