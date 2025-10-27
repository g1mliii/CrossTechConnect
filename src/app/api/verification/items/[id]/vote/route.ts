/**
 * API endpoint for voting on verification items
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * POST /api/verification/items/[id]/vote - Submit a vote on a verification item
 */
export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const params = await context.params;
    const { id } = params;
    const body = await request.json();
    const { vote, suggestedValue, comment } = body;

    // For now, we'll use a mock user ID. In a real app, this would come from authentication
    const userId = 'mock-user-id'; // TODO: Get from auth context

    // Validate vote type
    if (!['approve', 'reject', 'modify'].includes(vote)) {
      return NextResponse.json(
        { success: false, error: 'Invalid vote type. Must be approve, reject, or modify' },
        { status: 400 }
      );
    }

    // Check if verification item exists
    const { data: verificationItem } = await supabase
      .from('verification_items')
      .select('id, status')
      .eq('id', id)
      .single();

    if (!verificationItem) {
      return NextResponse.json(
        { success: false, error: 'Verification item not found' },
        { status: 404 }
      );
    }

    if (verificationItem.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Cannot vote on non-pending verification items' },
        { status: 400 }
      );
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from('verification_votes')
      .select('id')
      .eq('verification_item_id', id)
      .eq('user_id', userId)
      .single();

    if (existingVote) {
      return NextResponse.json(
        { success: false, error: 'You have already voted on this item' },
        { status: 400 }
      );
    }

    // Get user's reputation score for vote weight calculation
    const { data: user } = await supabase
      .from('users')
      .select('reputation_score')
      .eq('id', userId)
      .single();

    const reputationScore = user?.reputation_score || 0;

    // Create the vote
    const { data: voteData, error: voteError } = await supabase
      .from('verification_votes')
      .insert({
        verification_item_id: id,
        user_id: userId,
        vote,
        suggested_value: suggestedValue,
        comment
      })
      .select()
      .single();

    if (voteError) {
      throw voteError;
    }

    // Calculate vote weights and check if we should auto-approve/reject
    const { data: allVotes } = await supabase
      .from('verification_votes')
      .select(`
        vote,
        user:users(reputation_score)
      `)
      .eq('verification_item_id', id);

    if (allVotes) {
      const voteWeights = allVotes.reduce((acc: Record<string, number>, vote: any) => {
        const user = Array.isArray(vote.user) ? vote.user[0] : vote.user;
        const weight = Math.min((user?.reputation_score || 0) / 100, 5.0);
        acc[vote.vote] = (acc[vote.vote] || 0) + weight;
        return acc;
      }, {} as Record<string, number>);

      const approvalThreshold = 10.0;
      const rejectionThreshold = 10.0;

      let newStatus = 'pending';
      
      if (voteWeights.approve >= approvalThreshold) {
        newStatus = 'approved';
      } else if (voteWeights.reject >= rejectionThreshold) {
        newStatus = 'rejected';
      }

      // Update verification item status if threshold reached
      if (newStatus !== 'pending') {
        await supabase
          .from('verification_items')
          .update({ status: newStatus })
          .eq('id', id);

        // If approved, update the device with the proposed value
        if (newStatus === 'approved') {
          const { data: item } = await supabase
            .from('verification_items')
            .select('device_id, field_name, proposed_value')
            .eq('id', id)
            .single();

          if (item) {
            // Update device specifications
            // This would need to be implemented based on your device update logic
            console.log('Would update device:', item.device_id, 'field:', item.field_name, 'value:', item.proposed_value);
          }
        }
      }

      // Update user reputation based on vote outcome
      if (newStatus !== 'pending') {
        const reputationChange = newStatus === 'approved' ? 
          (vote === 'approve' ? 10 : vote === 'reject' ? -5 : 0) :
          (vote === 'reject' ? 10 : vote === 'approve' ? -5 : 0);

        if (reputationChange !== 0) {
          await supabase
            .from('users')
            .update({ 
              reputation_score: Math.max(0, reputationScore + reputationChange)
            })
            .eq('id', userId);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: voteData.id,
        verificationItemId: voteData.verification_item_id,
        userId: voteData.user_id,
        vote: voteData.vote,
        suggestedValue: voteData.suggested_value,
        comment: voteData.comment,
        createdAt: voteData.created_at
      }
    });

  } catch (error) {
    console.error('Error submitting vote:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to submit vote',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}