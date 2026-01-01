'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { getUsers, assignEnquiry, bulkAssignEnquiries } from '@/server/actions/enquiry';
import { User } from '@/types/data-management';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface AssignEnquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  enquiryId?: string;
  enquiryIds?: string[];
  currentAssigneeId?: string | null;
  onSuccess?: () => void;
  candidateName?: string;
}

export function AssignEnquiryDialog({
  open,
  onOpenChange,
  enquiryId,
  enquiryIds,
  currentAssigneeId,
  onSuccess,
  candidateName,
}: AssignEnquiryDialogProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    if (open) {
      fetchUsers();
      // Reset form when dialog opens
      setSelectedUserId(null);
      setStartDate(undefined);
      setEndDate(undefined);
    }
  }, [open]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const result = await getUsers();
      if (result.success) {
        setUsers((result.data as User[]) || []);
      } else {
        toast.error(result.message || 'Failed to fetch users');
      }
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
  };

  const handleAssignUser = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user');
      return;
    }

    if (!startDate) {
      toast.error('Please select a start date');
      return;
    }

    if (!endDate) {
      toast.error('Please select an end date');
      return;
    }

    if (startDate > endDate) {
      toast.error('Start date cannot be after end date');
      return;
    }

    setIsAssigning(true);
    try {
      let result;
      
      if (enquiryIds && enquiryIds.length > 0) {
        // Bulk assignment
        result = await bulkAssignEnquiries(enquiryIds, selectedUserId, startDate, endDate);
      } else if (enquiryId) {
        // Single assignment
        result = await assignEnquiry(enquiryId, selectedUserId, startDate, endDate);
      } else {
        toast.error('No enquiry selected');
        setIsAssigning(false);
        return;
      }

      if (result.success) {
        toast.success(result.message);
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(result.message || 'Failed to assign enquiry');
      }
    } catch {
      toast.error('Failed to assign enquiry');
    } finally {
      setIsAssigning(false);
    }
  };

  const isBulk = !!(enquiryIds && enquiryIds.length > 0);
  const count = enquiryIds?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isBulk ? 'Bulk Assign Enquiries' : 'Assign Enquiry'}</DialogTitle>
          <DialogDescription>
            {isBulk
              ? `Assign ${count} selected enquiries to a user.`
              : candidateName
                ? `Assign ${candidateName} to a user.`
                : 'Select a user to assign this enquiry to.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="start-date"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                    disabled={isAssigning}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => endDate ? date > endDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="end-date"
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                    disabled={isAssigning}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => startDate ? date < startDate : false}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* User Selection */}
          {isLoadingUsers ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length > 0 ? (
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-md border cursor-pointer transition-colors hover:bg-muted",
                      selectedUserId === user.id ? "bg-muted border-primary/50" : "bg-card",
                      currentAssigneeId === user.id && "ring-2 ring-primary/20"
                    )}
                    onClick={() => handleSelectUser(user.id)}
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentAssigneeId === user.id && (
                        <Badge variant="secondary" className="text-xs">
                          Current
                        </Badge>
                      )}
                      {user.role && (
                        <Badge variant="outline" className="text-[10px] px-2 py-0 h-5">
                          {user.role.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No users found to assign.
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignUser}
              disabled={isAssigning || !selectedUserId || !startDate || !endDate}
            >
              {isAssigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Assigning...
                </>
              ) : (
                'Assign'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
