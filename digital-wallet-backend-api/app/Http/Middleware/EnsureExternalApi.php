<?php

namespace App\Http\Middleware;

use App\Models\ExternalSystem;
use Closure;
use Illuminate\Http\Request;

class EnsureExternalApi
{
    /**
     * Authenticate requests coming from external systems (e.g. online shopping)
     * using the system's API key sent in the X-API-Key header.
     */
    public function handle(Request $request, Closure $next): mixed
    {
        $apiKey = $request->header('X-API-Key');

        if (! $apiKey) {
            return response()->json(['success' => false, 'message' => 'API key is required.'], 401);
        }

        $system = ExternalSystem::where('api_key_hash', hash('sha256', $apiKey))->first();

        if (! $system || $system->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'Invalid or inactive API key.'], 401);
        }

        $request->attributes->set('external_system', $system);

        return $next($request);
    }
}
