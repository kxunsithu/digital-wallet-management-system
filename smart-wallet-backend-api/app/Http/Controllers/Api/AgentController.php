<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Agent\StoreAgentRequest;
use App\Http\Requests\Agent\UpdateAgentRequest;
use App\Http\Resources\AgentResource;
use App\Models\AgentProfile;
use App\Models\Image;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AgentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 15);
        $query = AgentProfile::with(['user.images', 'parent', 'stateRegion', 'township']);

        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
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
                $q->where('agent_code', 'like', "%{$search}%")
                    ->orWhere('shop_name', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('full_name', 'like', "%{$search}%")
                            ->orWhere('phone_number', 'like', "%{$search}%")
                            ->orWhere('nrc_number', 'like', "%{$search}%");
                    });
            });
        }

        $list = $query->orderBy('id', 'desc')->paginate($perPage);

        return AgentResource::collection($list)
            ->additional(['success' => true])
            ->response()
            ->setStatusCode(200);
    }

    public function store(StoreAgentRequest $request): JsonResponse
    {
        $data = $request->validated();

        $agentRoleId = DB::table('roles')->where('name', 'agent')->value('id');

        DB::beginTransaction();
        try {
            $user = User::create([
                'phone_number' => $data['phone_number'],
                'full_name' => $data['full_name'] ?? null,
                'email' => $data['email'] ?? null,
                'nrc_number' => $data['nrc_number'] ?? null,
                'role_id' => $agentRoleId,
                'status' => 'active',
            ]);

            do {
                $agentCode = 'AG-'.mt_rand(100000, 999999);
            } while (AgentProfile::where('agent_code', $agentCode)->exists());

            $profile = AgentProfile::create([
                'user_id' => $user->id,
                'agent_code' => $agentCode,
                'shop_name' => $data['shop_name'] ?? null,
                'shop_address' => $data['shop_address'] ?? null,
                'state_region_id' => $data['state_region_id'] ?? null,
                'township_id' => $data['township_id'] ?? null,
                'status' => $data['status'] ?? 'pending',
                'level' => $data['level'] ?? null,
                'custom_commission_override' => $data['custom_commission_override'] ?? null,
                'parent_agent_id' => $data['parent_agent_id'] ?? null,
            ]);

            if (! empty($data['nrc_front_image']) && ! empty($data['nrc_back_image'])) {
                $this->storeImageRecord($data['nrc_front_image'], $user->id, 'nrc_front_image');
                $this->storeImageRecord($data['nrc_back_image'], $user->id, 'nrc_back_image');
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json(['success' => false, 'message' => 'Failed to create agent: '.$e->getMessage()], 500);
        }

        return (new AgentResource($profile->load(['user.images', 'parent', 'stateRegion', 'township'])))
            ->additional(['success' => true, 'message' => 'Agent created.'])
            ->response()
            ->setStatusCode(201);
    }

    protected function storeImageRecord($file, int $userId, string $imageType): void
    {
        if ($file instanceof \Illuminate\Http\UploadedFile) {
            $storedPath = $file->store('nrc-images', 'public');

            Image::updateOrCreate(
                ['user_id' => $userId, 'image_type' => $imageType],
                [
                    'image_path' => $storedPath,
                    'original_name' => $file->getClientOriginalName(),
                    'image_size' => $file->getSize(),
                ]
            );

            return;
        }

        if (is_string($file) && $file !== '') {
            Image::updateOrCreate(
                ['user_id' => $userId, 'image_type' => $imageType],
                ['image_path' => $file]
            );
        }
    }

    public function show($id): JsonResponse
    {
        $agent = AgentProfile::with(['user.images', 'parent', 'stateRegion', 'township'])->find($id);
        if (! $agent) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        return (new AgentResource($agent))
            ->additional(['success' => true])
            ->response()
            ->setStatusCode(200);
    }

    public function update(UpdateAgentRequest $request, $id): JsonResponse
    {
        $agent = AgentProfile::find($id);
        if (! $agent) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $data = $request->validated();

        DB::beginTransaction();
        try {
            $userFields = array_filter([
                'full_name' => $data['full_name'] ?? null,
                'email' => $data['email'] ?? null,
                'nrc_number' => $data['nrc_number'] ?? null,
            ], fn ($v) => $v !== null);

            if (! empty($userFields)) {
                $agent->user->update($userFields);
            }

            $profileFields = array_filter([
                'agent_code' => $data['agent_code'] ?? null,
                'shop_name' => $data['shop_name'] ?? null,
                'shop_address' => $data['shop_address'] ?? null,
                'state_region_id' => $data['state_region_id'] ?? null,
                'township_id' => $data['township_id'] ?? null,
                'status' => $data['status'] ?? null,
                'level' => $data['level'] ?? null,
                'custom_commission_override' => $data['custom_commission_override'] ?? null,
                'parent_agent_id' => $data['parent_agent_id'] ?? null,
            ], fn ($v) => $v !== null);

            $agent->update($profileFields);

            if (! empty($data['nrc_front_image'])) {
                $this->storeImageRecord($data['nrc_front_image'], $agent->user_id, 'nrc_front_image');
            }
            if (! empty($data['nrc_back_image'])) {
                $this->storeImageRecord($data['nrc_back_image'], $agent->user_id, 'nrc_back_image');
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json(['success' => false, 'message' => 'Failed to update: '.$e->getMessage()], 500);
        }

        return (new AgentResource($agent->fresh()->load(['user.images', 'parent', 'stateRegion', 'township'])))
            ->additional(['success' => true, 'message' => 'Updated.'])
            ->response()
            ->setStatusCode(200);
    }

    public function destroy($id): JsonResponse
    {
        $agent = AgentProfile::find($id);
        if (! $agent) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $agent->delete();

        return response()->json(['success' => true, 'message' => 'Deleted.'], 200);
    }

    public function toggleStatus(Request $request, $id): JsonResponse
    {
        $agent = AgentProfile::find($id);
        if (! $agent) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $current = $agent->status ?? 'inactive';
        $newStatus = $current === 'active' ? 'inactive' : 'active';

        $agent->update(['status' => $newStatus]);

        return (new AgentResource($agent->fresh()->load(['user.images', 'parent', 'stateRegion', 'township'])))
            ->additional(['success' => true, 'message' => 'Status toggled.', 'status' => $newStatus])
            ->response()
            ->setStatusCode(200);
    }
}
