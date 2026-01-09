'use server';

import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { ProposalStatus } from '@/types/proposal';
import jwt from 'jsonwebtoken';

// Configuration
const API_BASE_URL = 'http://localhost:3001/api';
// Use the secret provided by the user. In a real app, this should be in .env
const JWT_SECRET = process.env.JWT_SECRET;

// Helper to generate a token for the external API
// The external API expects a token signed with the secret.
// As per user request: "Generate token with empty payload"
const generateAuthToken = () => {
    try {
        if (!JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }
        const token = jwt.sign({}, JWT_SECRET);
        return token;
    } catch (error) {
        console.error("Error signing token:", error);
        throw new Error("Failed to generate auth token");
    }
};

const action = createSafeActionClient();

// Schemas
const proposalItemSchema = z.object({
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
});

const createProposalSchema = z.object({
    clientName: z.string(),
    clientEmail: z.string().optional(),
    clientPhone: z.string().optional(),
    items: z.array(proposalItemSchema).optional(),
});

const updateProposalSchema = z.object({
    id: z.string(),
    clientName: z.string().optional(),
    clientEmail: z.string().optional(),
    clientPhone: z.string().optional(),
    status: z.nativeEnum(ProposalStatus).optional(),
    items: z.array(proposalItemSchema).optional(),
});

// Helper function for making authenticated requests
async function fetchExternal(endpoint: string, options: RequestInit = {}) {
    const token = generateAuthToken();

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`External API Error (${response.status} ${response.statusText}):`, errorBody);
        throw new Error(`External API Error: ${response.statusText}`);
    }

    // Some endpoints might return 204 No Content or just status
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return response.json();
    }
    return null;
}

// ----------------------------------------------------------------------
// Actions
// ----------------------------------------------------------------------

export const getProposals = action.action(async () => {
    try {
        const data = await fetchExternal('/proposals');
        return { success: true, data };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : 'Failed to fetch proposals' };
    }
});

export const getProposalById = action.schema(z.object({ id: z.string() })).action(async ({ parsedInput: { id } }) => {
    try {
        const data = await fetchExternal(`/proposals/${id}`);
        return { success: true, data };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : 'Failed to fetch proposal' };
    }
});

export const createProposal = action.schema(createProposalSchema).action(async ({ parsedInput }) => {
    try {
        // The external API expects `createdByUser` if no internal `userId` is present from its own auth.
        // Since we are calling from server-to-server with a generic token, we might need to supply this.
        // However, the provided token generation code just signs an empty payload {}.
        // Let's pass createdByUser manually if the API allows it in the body, which the user provided code suggests:
        // "let createdByUser = data.createdByUser;"

        // We'll hardcode a system user or try to get something meaningful if possible, 
        // but for now let's send a generic "CRM User".
        const payload = {
            ...parsedInput,
            createdByUser: 'CRM System User',
        };

        const data = await fetchExternal('/proposals', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        revalidatePath('/proposals');
        return { success: true, data, message: 'Proposal created successfully' };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : 'Failed to create proposal' };
    }
});

export const updateProposal = action.schema(updateProposalSchema).action(async ({ parsedInput }) => {
    try {
        const { id, items, ...updateData } = parsedInput;

        // 1. Update basic details
        if (Object.keys(updateData).length > 0) {
            await fetchExternal(`/proposals/${id}`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });
        }

        // 2. Sync Items if provided
        if (items) {
            // Fetch current state to compare
            const currentProposal = await fetchExternal(`/proposals/${id}`);
            const currentItems: any[] = currentProposal.items || [];
            
            // Map current items by ID for easy lookup
            // Note: The schema for items in updateProposalSchema doesn't have ID, 
            // but we need to know if we are updating an existing one or adding a new one.
            // The UI form likely strips IDs or doesn't have them for new items.
            // *Correction*: The UI form `defaultValues` maps existing items. 
            // But `items` array in `parsedInput` is validated by `proposalItemSchema` which is:
            // { description, quantity, unitPrice }. It lacks `id`.
            // So we can't easily distinguish "update" vs "add" unless we change the schema 
            // OR use a strategy like: Delete all and re-create (brute force)?
            // OR assume order? (Dangerous)
            
            // Better strategy for this context without changing schema too much:
            // The `updateProposalSchema` *should* have ID to support updates properly.
            // But since I cannot easily change the schema without breaking validation if the UI doesn't send it,
            // let's look at `proposalItemSchema`. It strictly has desc, qty, price.
            
            // Let's TRY to rely on a "Delete All and Re-Create" strategy for items *if safe*, 
            // but `deleteProposalItem` requires ID. 
            // And we can't "delete all" in one go.
            
            // Okay, I will relax the schema in this action to allow `id` in items if passed, 
            // even though Zod might strip it if not defined. 
            // Wait, existing `proposalItemSchema` definition in this file:
            // const proposalItemSchema = z.object({ description: z.string(), quantity: z.number(), unitPrice: z.number() });
            // It strips extra keys.
            
            // I MUST update the schema to include optional ID to support this properly.
            // I will do this in a separate edit or assume I can modify it here.
            
            // For now, since schema is strict, I can't get IDs of items from `parsedInput.items`.
            // This means I can't know which item is which.
            // **CRITICAL FIX**: I will modify the schema first (in a separate step or implicitly here if I could).
            // But I can't modify top-level variables easily in `replace_file_content`.
            
            // Workaround: I will fetch the layout again in a "multi-step" replace or just do simple delete-recreate?
            // "Delete Recreate" is:
            // 1. Loop currentItems -> deleteProposalItem(id)
            // 2. Loop items -> addProposalItem(data)
            // This is heavy but robust for data consistency if ID matching is hard.
            // Let's do this approach for now.
            
            // 2.1 Delete all existing items sequentially to avoid DB locking/race issues
            for (const item of currentItems) {
                await fetchExternal(`/proposals/items/${item.id}`, { method: 'DELETE' });
            }

            // 2.2 Create new items sequentially to ensure Total Amount is calculated correctly
            // Parallel execution (Promise.all) causes race conditions in the backend transaction
            // where concurrent "read-sum-update" cycles overwrite the total.
            for (const item of items) {
                await fetchExternal(`/proposals/${id}/items`, {
                    method: 'POST',
                    body: JSON.stringify(item)
                });
            }
        }

        revalidatePath('/proposals');
        revalidatePath(`/proposals/${id}`);
        return { success: true, message: 'Proposal updated successfully' };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : 'Failed to update proposal' };
    }
});

export const deleteProposal = action.schema(z.object({ id: z.string() })).action(async ({ parsedInput: { id } }) => {
    try {
        await fetchExternal(`/proposals/${id}`, {
            method: 'DELETE',
        });
        revalidatePath('/proposals');
        return { success: true, message: 'Proposal deleted successfully' };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : 'Failed to delete proposal' };
    }
});
