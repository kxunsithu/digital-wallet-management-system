<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AgentManager\StoreAgentManagerRequest;
use App\Http\Requests\AgentManager\UpdateAgentManagerRequest;
use App\Models\AgentManagerProfile;
use App\Models\Image;
use App\Http\Resources\AgentManagerResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgentManagerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 15);
        $query = AgentManagerProfile::with(['user.images', 'parent']);

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
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

        $profile = AgentManagerProfile::create($data);

        if (! empty($data['nrc_front_image']) && ! empty($data['nrc_back_image'])) {
            $this->storeImageRecord($data['nrc_front_image'], $data['user_id'], 'nrc_front_image');
            $this->storeImageRecord($data['nrc_back_image'], $data['user_id'], 'nrc_back_image');
        }

        return (new AgentManagerResource($profile->load(['user', 'parent'])))
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
        $profile = AgentManagerProfile::with(['user.images', 'parent'])->find($id);

        if (! $profile) {
            return response()->json(['success' => false, 'message' => 'Not found.'], 404);
        }

        return (new AgentManagerResource($profile->load(['user', 'parent'])))
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

        $profile->update($request->validated());

        return (new AgentManagerResource($profile->fresh()->load(['user', 'parent'])))
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

        $current = $profile->status ?? 'inactive';
        $newStatus = $current === 'active' ? 'inactive' : 'active';

        $profile->update(['status' => $newStatus]);

        return (new AgentManagerResource($profile->fresh()->load(['user', 'parent'])))
            ->additional(['success' => true, 'message' => 'Status toggled.', 'status' => $newStatus])
            ->response()
            ->setStatusCode(200);
    }
}
