<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerResource;
use App\Models\CustomerProfile;
use App\Models\Image;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 15);
        $query = CustomerProfile::with(['user.images', 'user.nrcVerification', 'referrer', 'stateRegion', 'township']);

        if ($request->filled('kyc_status')) {
            $query->where('kyc_status', $request->query('kyc_status'));
        }

        if ($request->filled('state_region_id')) {
            $query->where('state_region_id', $request->query('state_region_id'));
        }

        if ($request->filled('township_id')) {
            $query->where('township_id', $request->query('township_id'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('referral_code', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('full_name', 'like', "%{$search}%")
                            ->orWhere('phone_number', 'like', "%{$search}%")
                            ->orWhere('nrc_number', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $list = $query->orderBy('id', 'desc')->paginate($perPage);

        return CustomerResource::collection($list)
            ->additional(['success' => true])
            ->response()
            ->setStatusCode(200);
    }

    public function show($id): JsonResponse
    {
        $profile = CustomerProfile::with(['user.images', 'user.wallet', 'user.nrcVerification', 'referrer', 'stateRegion', 'township'])->find($id);
        if (! $profile) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        return (new CustomerResource($profile))
            ->additional(['success' => true])
            ->response()
            ->setStatusCode(200);
    }

    public function destroy($id): JsonResponse
    {
        $profile = CustomerProfile::find($id);
        if (! $profile) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        DB::beginTransaction();
        try {
            $user = $profile->user;

            if ($user) {
                Image::where('user_id', $user->id)->delete();

                if (method_exists($user, 'wallet') && $user->wallet) {
                    $user->wallet()->delete();
                }

                $profile->delete();
                $user->delete();
            } else {
                $profile->delete();
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Failed to delete: '.$e->getMessage()], 500);
        }

        return response()->json(['success' => true, 'message' => 'Customer profile deleted.'], 200);
    }
}
