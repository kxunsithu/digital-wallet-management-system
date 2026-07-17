<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerResource;
use App\Models\CustomerProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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

        $profile->delete();

        return response()->json(['success' => true, 'message' => 'Customer profile deleted.'], 200);
    }
}
