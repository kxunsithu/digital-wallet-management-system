<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Agent\StoreAgentRequest;
use App\Http\Requests\Agent\UpdateAgentRequest;
use App\Http\Resources\AgentResource;
use App\Models\AgentProfile;
use App\Models\Image;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 15);
        $list = AgentProfile::with(['user.images', 'parent'])->orderBy('id', 'desc')->paginate($perPage);

        return AgentResource::collection($list)
            ->additional(['success' => true])
            ->response()
            ->setStatusCode(200);
    }

    public function store(StoreAgentRequest $request): JsonResponse
    {
        $data = $request->validated();

        $agent = AgentProfile::create($data);

        if (! empty($data['nrc_front_image']) && ! empty($data['nrc_back_image'])) {
            $this->storeImageRecord($data['nrc_front_image'], $data['user_id'], 'nrc_front_image');
            $this->storeImageRecord($data['nrc_back_image'], $data['user_id'], 'nrc_back_image');
        }

        return (new AgentResource($agent->load(['user.images', 'parent'])))
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
        $agent = AgentProfile::with(['user.images', 'parent'])->find($id);
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

        $agent->update($request->validated());

        return (new AgentResource($agent->fresh()->load(['user.images', 'parent'])))
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
}
