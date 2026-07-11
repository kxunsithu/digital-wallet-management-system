<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AgentManager\CreateAgentRequest;
use App\Http\Requests\AgentManager\UpdateAgentRequest;
use App\Http\Responses\ApiResponse;
use App\Models\AgentProfile;
use App\Models\Role;
use App\Models\User;
use App\Models\Wallet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AgentManagerController extends Controller
{
    protected function ensureManager(User $manager): ?JsonResponse
    {
        if (!$manager || !$manager->isAgentManager()) {
            return ApiResponse::forbidden('Only agent managers can manage agents.');
        }

        return null;
    }

    public function index(): JsonResponse
    {
        $manager = auth()->user();
        $guardResponse = $this->ensureManager($manager);
        if ($guardResponse) {
            return $guardResponse;
        }

        $agents = User::where('role_id', Role::where('name', 'agent')->value('id'))
            ->whereHas('agentProfile', function ($query) use ($manager) {
                $query->where('approved_by', $manager->id);
            })
            ->with(['role', 'wallet', 'agentProfile'])
            ->latest()
            ->get();

        return ApiResponse::success('Agents retrieved.', ['data' => $agents]);
    }

    public function createAgent(CreateAgentRequest $request): JsonResponse
    {
        $manager = auth()->user();
        $guardResponse = $this->ensureManager($manager);
        if ($guardResponse) {
            return $guardResponse;
        }

        $role = Role::where('name', 'agent')->first();
        if (!$role) {
            return ApiResponse::error('Agent role not found.', null, 500);
        }

        $user = User::create([
            'phone_number' => $request->phone_number,
            'role_id' => $role->id,
            'full_name' => $request->full_name,
            'email' => $request->email,
            'status' => $request->input('status', 'inactive'),
            'is_phone_verified' => true,
            'is_pin_created' => true,
        ]);

        $user->pin()->create([
            'pin_hash' => bcrypt('123456'),
            'failed_attempts' => 0,
            'is_locked' => false,
        ]);

        Wallet::create([
            'user_id' => $user->id,
            'wallet_number' => 'WLT-' . strtoupper(Str::random(8)),
            'balance' => 0,
            'currency' => 'MMK',
            'status' => 'active',
        ]);

        $agentProfile = AgentProfile::create([
            'user_id' => $user->id,
            'agent_code' => $request->agent_code,
            'level' => $request->input('level', 'level_1'),
            'shop_name' => $request->shop_name,
            'shop_address' => $request->shop_address,
            'township' => $request->township,
            'float_balance' => $request->input('float_balance', 0),
            'status' => $request->input('status', 'inactive'),
            'approved_by' => $manager->id,
        ]);

        return ApiResponse::created('Agent created successfully.', [
            'user' => $user->fresh(['role', 'wallet', 'agentProfile']),
            'agent_profile' => $agentProfile,
        ]);
    }

    public function updateAgent(UpdateAgentRequest $request, int $id): JsonResponse
    {
        $manager = auth()->user();
        $guardResponse = $this->ensureManager($manager);
        if ($guardResponse) {
            return $guardResponse;
        }

        $agent = User::where('id', $id)
            ->where('role_id', Role::where('name', 'agent')->value('id'))
            ->with(['agentProfile'])
            ->first();

        if (!$agent || !$agent->agentProfile || $agent->agentProfile->approved_by !== $manager->id) {
            return ApiResponse::notFound('Agent not found for this manager.');
        }

        $agent->update([
            'full_name' => $request->input('full_name', $agent->full_name),
            'email' => $request->input('email', $agent->email),
            'status' => $request->input('status', $agent->status),
        ]);

        $agent->agentProfile->update([
            'shop_name' => $request->input('shop_name', $agent->agentProfile->shop_name),
            'shop_address' => $request->input('shop_address', $agent->agentProfile->shop_address),
            'township' => $request->input('township', $agent->agentProfile->township),
            'level' => $request->input('level', $agent->agentProfile->level),
            'status' => $request->input('status', $agent->agentProfile->status),
        ]);

        return ApiResponse::success('Agent updated successfully.', [
            'user' => $agent->fresh(['role', 'wallet', 'agentProfile']),
        ]);
    }

    public function destroyAgent(int $id): JsonResponse
    {
        $manager = auth()->user();
        $guardResponse = $this->ensureManager($manager);
        if ($guardResponse) {
            return $guardResponse;
        }

        $agent = User::where('id', $id)
            ->where('role_id', Role::where('name', 'agent')->value('id'))
            ->with(['agentProfile'])
            ->first();

        if (!$agent || !$agent->agentProfile || $agent->agentProfile->approved_by !== $manager->id) {
            return ApiResponse::notFound('Agent not found for this manager.');
        }

        $agent->agentProfile()->delete();
        $agent->wallet()->delete();
        $agent->pin()->delete();
        $agent->delete();

        return ApiResponse::success('Agent deleted successfully.');
    }
}
