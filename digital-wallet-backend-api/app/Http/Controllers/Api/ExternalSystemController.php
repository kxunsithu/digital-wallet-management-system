<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExternalSystem\StoreExternalSystemRequest;
use App\Http\Requests\ExternalSystem\UpdateExternalSystemRequest;
use App\Models\ExternalSystem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ExternalSystemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = min(100, max(1, (int) $request->query('per_page', 15)));
        $query = ExternalSystem::with('user');

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('system_link', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('full_name', 'like', "%{$search}%")
                            ->orWhere('phone_number', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }

        $list = $query->orderByDesc('id')->paginate($perPage);

        return response()->json(['success' => true, 'data' => $list], 200);
    }

    public function store(StoreExternalSystemRequest $request): JsonResponse
    {
        $agent = $request->user();

        if ($agent->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'Agent account is '.$agent->status.' and cannot create an external system.'], 422);
        }

        $data = $request->validated();

        $system = ExternalSystem::create([
            'name' => $data['name'],
            'user_id' => $agent->id,
            'system_link' => $data['system_link'] ?? null,
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'External system created. Generate its API key from your app.',
            'data' => $system->fresh('user'),
        ], 201);
    }

    public function show(int $id): JsonResponse
    {
        $system = ExternalSystem::with(['user'])->withCount('externalPayments')->find($id);
        if (! $system) {
            return response()->json(['success' => false, 'message' => 'External system not found.'], 404);
        }

        return response()->json(['success' => true, 'data' => $system], 200);
    }

    public function update(UpdateExternalSystemRequest $request, int $id): JsonResponse
    {
        $system = ExternalSystem::find($id);
        if (! $system) {
            return response()->json(['success' => false, 'message' => 'External system not found.'], 404);
        }

        $data = $request->validated();
        $payload = [];

        if (isset($data['name'])) {
            $payload['name'] = $data['name'];
        }

        if (array_key_exists('system_link', $data)) {
            $payload['system_link'] = $data['system_link'];
        }

        if (isset($data['status'])) {
            $payload['status'] = $data['status'];
        }

        if (! empty($payload)) {
            $system->update($payload);
        }

        return response()->json([
            'success' => true,
            'message' => 'External system updated.',
            'data' => $system->fresh('user'),
        ], 200);
    }

    public function destroy(int $id): JsonResponse
    {
        $system = ExternalSystem::find($id);
        if (! $system) {
            return response()->json(['success' => false, 'message' => 'External system not found.'], 404);
        }

        $system->delete();

        return response()->json([
            'success' => true,
            'message' => 'External system deleted.',
        ], 200);
    }

    public function toggleStatus(int $id): JsonResponse
    {
        $system = ExternalSystem::find($id);
        if (! $system) {
            return response()->json(['success' => false, 'message' => 'External system not found.'], 404);
        }

        $newStatus = $system->status === 'active' ? 'inactive' : 'active';
        $system->update(['status' => $newStatus]);

        return response()->json([
            'success' => true,
            'message' => 'External system status updated.',
            'status' => $newStatus,
            'data' => $system->fresh('user'),
        ], 200);
    }

    public function mySystems(Request $request): JsonResponse
    {
        $systems = ExternalSystem::where('user_id', $request->user()->id)
            ->orderByDesc('id')
            ->get();

        return response()->json(['success' => true, 'data' => $systems], 200);
    }

    public function generateKey(Request $request, int $id): JsonResponse
    {
        $system = ExternalSystem::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (! $system) {
            return response()->json(['success' => false, 'message' => 'External system not found for your account.'], 404);
        }

        if ($system->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'External system is '.$system->status.' and cannot generate an API key.'], 422);
        }

        $apiKey = 'sk_live_'.Str::random(48);

        $system->update([
            'api_key_hash' => hash('sha256', $apiKey),
            'api_key_prefix' => substr($apiKey, 0, 12),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'API key generated. Store it now — it will not be shown again.',
            'data' => array_merge($system->fresh('user')->toArray(), ['api_key' => $apiKey]),
        ], 200);
    }
}
