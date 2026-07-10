<?php

namespace App\Services;

use App\Events\KycApprovedEvent;
use App\Models\NrcVerification;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class NrcVerificationService
{
    /**
     * Upload and create NRC verification record.
     */
    public function uploadNrc(User $user, ?UploadedFile $frontImage, ?UploadedFile $backImage): array
    {
        try {
            $frontImagePath = null;
            $backImagePath = null;

            // Upload front image
            if ($frontImage) {
                $frontImagePath = $frontImage->store('nrc/front', 'public');
            }

            // Upload back image
            if ($backImage) {
                $backImagePath = $backImage->store('nrc/back', 'public');
            }

            // Delete existing pending verification if any
            NrcVerification::where('user_id', $user->id)
                ->where('status', 'pending')
                ->delete();

            // Create new NRC verification record
            $nrcVerification = NrcVerification::create([
                'user_id' => $user->id,
                'nrc_front_image_path' => $frontImagePath,
                'nrc_back_image_path' => $backImagePath,
                'status' => 'pending',
            ]);

            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'nrc_upload',
                'target_table' => 'nrc_verifications',
                'target_id' => $nrcVerification->id,
                'details' => 'NRC images uploaded for verification',
            ]);

            return [
                'success' => true,
                'message' => 'NRC images uploaded successfully. Waiting for admin verification.',
                'data' => [
                    'nrc_verification_id' => $nrcVerification->id,
                    'status' => $nrcVerification->status,
                    'created_at' => $nrcVerification->created_at,
                ],
            ];
        } catch (\Exception $e) {
            Log::error('NRC upload failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Failed to upload NRC images. Please try again.',
                'data' => [],
            ];
        }
    }

    /**
     * Verify (approve) NRC verification.
     */
    public function approveNrc(int $nrcVerificationId, User $admin): array
    {
        $nrcVerification = NrcVerification::find($nrcVerificationId);

        if (!$nrcVerification) {
            return ['success' => false, 'message' => 'NRC verification not found.', 'data' => []];
        }

        if (!$nrcVerification->isPending()) {
            return [
                'success' => false,
                'message' => "NRC is already {$nrcVerification->status}.",
                'data' => [],
            ];
        }

        $user = $nrcVerification->user;
        $profile = $user->customerProfile;

        // Update NRC verification
        $nrcVerification->update([
            'status' => 'approved',
            'verified_by' => $admin->id,
            'verified_at' => now(),
            'rejection_reason' => null,
        ]);

        // Update customer profile KYC status
        if ($profile) {
            $profile->update(['kyc_status' => 'approved']);
        }

        // Log audit
        AuditLog::create([
            'user_id' => $admin->id,
            'action' => 'nrc_approved',
            'target_table' => 'nrc_verifications',
            'target_id' => $nrcVerification->id,
            'details' => "NRC verified and approved by admin {$admin->full_name}",
        ]);

        // Dispatch event to trigger level upgrade
        KycApprovedEvent::dispatch($user);

        Log::info('NRC verified and approved', [
            'user_id' => $user->id,
            'nrc_verification_id' => $nrcVerification->id,
            'admin_id' => $admin->id,
        ]);

        return [
            'success' => true,
            'message' => 'NRC verified successfully. Customer level upgraded.',
            'data' => [
                'nrc_verification_id' => $nrcVerification->id,
                'status' => $nrcVerification->status,
                'verified_at' => $nrcVerification->verified_at,
                'new_customer_level' => $profile?->level,
            ],
        ];
    }

    /**
     * Reject NRC verification.
     */
    public function rejectNrc(int $nrcVerificationId, string $rejectionReason, User $admin): array
    {
        $nrcVerification = NrcVerification::find($nrcVerificationId);

        if (!$nrcVerification) {
            return ['success' => false, 'message' => 'NRC verification not found.', 'data' => []];
        }

        if (!$nrcVerification->isPending()) {
            return [
                'success' => false,
                'message' => "NRC is already {$nrcVerification->status}.",
                'data' => [],
            ];
        }

        $user = $nrcVerification->user;

        // Update NRC verification
        $nrcVerification->update([
            'status' => 'rejected',
            'verified_by' => $admin->id,
            'verified_at' => now(),
            'rejection_reason' => $rejectionReason,
        ]);

        // Log audit
        AuditLog::create([
            'user_id' => $admin->id,
            'action' => 'nrc_rejected',
            'target_table' => 'nrc_verifications',
            'target_id' => $nrcVerification->id,
            'details' => "NRC rejected by admin {$admin->full_name}. Reason: {$rejectionReason}",
        ]);

        Log::info('NRC rejected', [
            'user_id' => $user->id,
            'nrc_verification_id' => $nrcVerification->id,
            'admin_id' => $admin->id,
            'reason' => $rejectionReason,
        ]);

        return [
            'success' => true,
            'message' => 'NRC rejected. Customer notified.',
            'data' => [
                'nrc_verification_id' => $nrcVerification->id,
                'status' => $nrcVerification->status,
                'rejection_reason' => $rejectionReason,
                'verified_at' => $nrcVerification->verified_at,
            ],
        ];
    }

    /**
     * Get NRC verification status for a user.
     */
    public function getNrcStatus(User $user): array
    {
        $nrcVerification = $user->latestNrcVerification;

        if (!$nrcVerification) {
            return [
                'has_nrc' => false,
                'status' => null,
                'message' => 'No NRC verification record found.',
            ];
        }

        return [
            'has_nrc' => true,
            'status' => $nrcVerification->status,
            'nrc_verification_id' => $nrcVerification->id,
            'nrc_front_image' => $nrcVerification->nrc_front_image_path,
            'nrc_back_image' => $nrcVerification->nrc_back_image_path,
            'rejection_reason' => $nrcVerification->rejection_reason,
            'verified_at' => $nrcVerification->verified_at,
            'created_at' => $nrcVerification->created_at,
        ];
    }
}
