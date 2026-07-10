<?php

namespace App\Repositories;

use App\Models\User;

class UserRepository
{
    /**
     * Find user by phone number.
     */
    public function findByPhone(string $phoneNumber): ?User
    {
        return User::where('phone_number', $phoneNumber)->first();
    }

    /**
     * Find user by ID with relationships.
     */
    public function findById(int $id, array $relations = []): ?User
    {
        $query = User::query();

        if (!empty($relations)) {
            $query->with($relations);
        }

        return $query->find($id);
    }

    /**
     * Create a new user.
     */
    public function create(array $data): User
    {
        return User::create($data);
    }

    /**
     * Update a user.
     */
    public function update(User $user, array $data): User
    {
        $user->update($data);
        return $user->fresh();
    }

    /**
     * Get paginated users with optional filters.
     */
    public function paginate(int $perPage = 15, array $filters = [])
    {
        $query = User::with(['role', 'wallet', 'customerProfile', 'agentProfile']);

        if (isset($filters['role'])) {
            $query->whereHas('role', fn ($q) => $q->where('name', $filters['role']));
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('phone_number', 'like', "%{$search}%")
                  ->orWhere('full_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate($perPage);
    }
}
