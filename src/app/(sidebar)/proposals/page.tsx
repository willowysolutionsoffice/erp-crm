'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Filter, Eye, Edit, Trash2, MoreVertical, Plus, FileText } from 'lucide-react';
import { Proposal, ProposalStatus } from '@/types/proposal';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

// Mock Data
const MOCK_PROPOSALS: Proposal[] = [
    {
        id: '1',
        proposalNo: 'PROP-2024-0001',
        clientName: 'Acme Corp',
        clientEmail: 'contact@acme.com',
        clientPhone: '123-456-7890',
        status: ProposalStatus.DRAFT,
        totalAmount: 5000,
        createdByUser: 'John Doe',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },
    {
        id: '2',
        proposalNo: 'PROP-2024-0002',
        clientName: 'Globex Inc',
        clientEmail: 'info@globex.com',
        status: ProposalStatus.SENT,
        totalAmount: 12500,
        createdByUser: 'Jane Smith',
        items: [],
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
        id: '3',
        proposalNo: 'PROP-2024-0003',
        clientName: 'Soylent Corp',
        status: ProposalStatus.ACCEPTED,
        totalAmount: 3000,
        createdByUser: 'John Doe',
        items: [],
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString(),
    }
];

export default function ProposalsPage() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        // Client side filtering for visual demo
        if (!value) {
            setProposals(MOCK_PROPOSALS);
        } else {
            const lower = value.toLowerCase();
            setProposals(MOCK_PROPOSALS.filter(p =>
                p.proposalNo.toLowerCase().includes(lower) ||
                p.clientName.toLowerCase().includes(lower)
            ));
        }
    };

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

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const handleDelete = (id: string) => {
        toast.success("Proposal deleted (mock)");
        setProposals(prev => prev.filter(p => p.id !== id));
    };

    return (
        <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Proposals</h1>
                    <p className="text-gray-600">Manage and track proposals</p>
                </div>
                <Button onClick={() => router.push('/proposals/create')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Proposal
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                    <CardDescription>
                        Search proposals by number or client name
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                className="pl-8"
                                value={search}
                                onChange={(e) => handleSearchChange(e.target.value)}
                            />
                        </div>
                        <Button variant="outline">
                            <Filter className="mr-2 h-4 w-4" />
                            Filter
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* List */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Proposal No</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead>Created By</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {proposals.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No proposals found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                proposals.map((proposal) => (
                                    <TableRow key={proposal.id}>
                                        <TableCell className="font-medium">{proposal.proposalNo}</TableCell>
                                        <TableCell>{proposal.clientName}</TableCell>
                                        <TableCell>{formatDate(proposal.createdAt)}</TableCell>
                                        <TableCell>
                                            <Badge className={getStatusColor(proposal.status)}>
                                                {proposal.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{formatCurrency(proposal.totalAmount)}</TableCell>
                                        <TableCell>{proposal.createdByUser}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => router.push(`/proposals/${proposal.id}`)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => router.push(`/proposals/${proposal.id}/edit`)}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => toast.info('Preview PDF (mock)')}>
                                                        <FileText className="mr-2 h-4 w-4" />
                                                        Preview PDF
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(proposal.id)}>
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
