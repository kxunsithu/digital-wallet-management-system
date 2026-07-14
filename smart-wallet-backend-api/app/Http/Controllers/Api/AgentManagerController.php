<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AgentManager\StoreAgentManagerRequest;
use App\Http\Requests\AgentManager\UpdateAgentManagerRequest;
use App\Models\AgentManagerProfile;
use App\Models\Image;
use App\Models\User;
use App\Http\Resources\AgentManagerResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AgentManagerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 15);
        $query = AgentManagerProfile::with(['user.images', 'parent', 'stateRegion', 'township']);

        if ($request->filled('status')) {
            $query->whereHas('user', function ($q) use ($request) {
                $q->where('status', $request->query('status'));
            });
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
                $q->where('manager_code', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('full_name', 'like', "%{$search}%")
                         ->orWhere('phone_number', 'like', "%{$search}%")
                         ->orWhere('nrc_number', 'like', "%{$search}%");
                  });
            });
        }

        $list = $query->orderBy('id', 'desc')->paginate($perPage);

        return AgentManagerResource::collection($list)
            ->additional(['success' => true])
            ->response()
            ->setStatusCode(200);
    }

    public function store(StoreAgentManagerRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Resolve the agent_manager role ID
        $agentManagerRoleId = DB::table('roles')->where('name', 'agent_manager')->value('id');

        DB::beginTransaction();
        try {
            // 1. Create the user
            $user = User::create([
                'phone_number' => $data['phone_number'],
                'full_name'    => $data['full_name'] ?? null,
                'email'        => $data['email'] ?? null,
                'nrc_number'   => $data['nrc_number'] ?? null,
                'role_id'      => $agentManagerRoleId,
                'status'       => $data['status'] ?? 'active',
            ]);

            // Generate a unique manager code
            do {
                $managerCode = 'AM-' . mt_rand(100000, 999999);
            } while (AgentManagerProfile::where('manager_code', $managerCode)->exists());

            // 2. Create the agent manager profile
            $profile = AgentManagerProfile::create([
                'user_id'           => $user->id,
                'manager_code'      => $managerCode,
                'state_region_id'   => $data['state_region_id'] ?? null,
                'township_id'       => $data['township_id'] ?? null,
                'approval_limit'    => $data['approval_limit'] ?? 0,
                'parent_manager_id' => $data['parent_manager_id'] ?? null,
            ]);

            // 3. Store NRC images
            if (! empty($data['nrc_front_image']) && ! empty($data['nrc_back_image'])) {
                $this->storeImageRecord($data['nrc_front_image'], $user->id, 'nrc_front_image');
                $this->storeImageRecord($data['nrc_back_image'], $user->id, 'nrc_back_image');
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Failed to create agent manager: ' . $e->getMessage()], 500);
        }

        return (new AgentManagerResource($profile->load(['user.images', 'parent', 'stateRegion', 'township'])))
            ->additional(['success' => true, 'message' => 'Agent manager created.'])
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
                    'image_path'    => $storedPath,
                    'original_name' => $file->getClientOriginalName(),
                    'image_size'    => $file->getSize(),
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
        $profile = AgentManagerProfile::with(['user.images', 'user.wallet', 'parent', 'stateRegion', 'township'])->find($id);

        if (! $profile) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        return (new AgentManagerResource($profile->load(['user', 'user.wallet', 'parent', 'stateRegion', 'township'])))
            ->additional(['success' => true])
            ->response()
            ->setStatusCode(200);
    }

    public function update(UpdateAgentManagerRequest $request, $id): JsonResponse
    {
        $profile = AgentManagerProfile::find($id);
        if (! $profile) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $data = $request->validated();

        DB::beginTransaction();
        try {
            // Update user data if provided
            $userFields = array_filter([
                'full_name'  => $data['full_name'] ?? null,
                'email'      => $data['email'] ?? null,
                'nrc_number' => $data['nrc_number'] ?? null,
                'status'     => $data['status'] ?? null,
            ], fn($v) => $v !== null);

            if (! empty($userFields)) {
                $profile->user->update($userFields);
            }

            // Update profile fields
            $profileFields = array_filter([
                'manager_code'      => $data['manager_code'] ?? null,
                'state_region_id'   => $data['state_region_id'] ?? null,
                'township_id'       => $data['township_id'] ?? null,
                'approval_limit'    => $data['approval_limit'] ?? null,
                'parent_manager_id' => $data['parent_manager_id'] ?? null,
            ], fn($v) => $v !== null);

            $profile->update($profileFields);

            // Store NRC images if provided
            if (! empty($data['nrc_front_image'])) {
                $this->storeImageRecord($data['nrc_front_image'], $profile->user_id, 'nrc_front_image');
            }
            if (! empty($data['nrc_back_image'])) {
                $this->storeImageRecord($data['nrc_back_image'], $profile->user_id, 'nrc_back_image');
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Failed to update: ' . $e->getMessage()], 500);
        }

        return (new AgentManagerResource($profile->fresh()->load(['user.images', 'parent', 'stateRegion', 'township'])))
            ->additional(['success' => true, 'message' => 'Updated.'])
            ->response()
            ->setStatusCode(200);
    }

    public function destroy($id): JsonResponse
    {
        $profile = AgentManagerProfile::find($id);
        if (! $profile) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $profile->delete();

        return response()->json(['success' => true, 'message' => 'Deleted.'], 200);
    }

    /**
     * Toggle status between 'active' and 'inactive' (admin only).
     */
    public function toggleStatus(Request $request, $id): JsonResponse
    {
        $profile = AgentManagerProfile::find($id);
        if (! $profile) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        $current = $profile->user->status ?? 'inactive';
        $newStatus = $current === 'active' ? 'inactive' : 'active';

        $profile->user->update(['status' => $newStatus]);

        return (new AgentManagerResource($profile->fresh()->load(['user', 'parent', 'stateRegion', 'township'])))
            ->additional(['success' => true, 'message' => 'Status toggled.', 'status' => $newStatus])
            ->response()
            ->setStatusCode(200);
    }
}
