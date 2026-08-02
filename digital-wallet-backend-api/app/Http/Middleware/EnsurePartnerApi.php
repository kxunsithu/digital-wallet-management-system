<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class EnsureMerchantApi
{
    /**
     * Authenticate a merchant via the X-API-Key header.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $apiKey = $request->header('X-API-Key');
        if (! $apiKey) {
            return response()->json(['success' => false, 'message' => 'Missing API key.'], 401);
        }

        $merchant = DB::table('merchants')->where('api_key', $apiKey)->first();
        if (! $merchant) {
            return response()->json(['success' => false, 'message' => 'Invalid API key.'], 401);
        }

        if ($merchant->status !== 'active') {
            return response()->json(['success' => false, 'message' => 'Merchant account is inactive.'], 403);
        }

        $request->attributes->set('merchant', $merchant);

        return $next($request);
    }
}
