<?php

namespace Tests\Feature;

use App\Models\AgentManagerProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AgentManagerProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_agent_manager_profiles_table_exists(): void
    {
        $this->assertTrue(class_exists(AgentManagerProfile::class));
        $this->assertTrue(Schema::hasTable('agent_manager_profiles'));
    }
}
